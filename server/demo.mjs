import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes, createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
import {groqReply, MODEL} from './groq.mjs';

export function createDemoServer({database, reply = groqReply, clock = Date.now, cooldown = 4000, enableDeveloper = false, environment = process.env.NODE_ENV} = {}) {
  const developerEnabled = enableDeveloper === true && environment === 'development';
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, ip TEXT NOT NULL, history TEXT NOT NULL DEFAULT '[]', used INTEGER NOT NULL DEFAULT 0, pending TEXT, last INTEGER NOT NULL DEFAULT 0, handoff INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS budget (bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0);`);
  if (!db.prepare('PRAGMA table_info(sessions)').all().some(column=>column.name==='mode')) {
    db.exec("ALTER TABLE sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'demonstration'");
  }
  const clients = new Map();
  let inFlight = 0;
  const isDeveloper = row => developerEnabled && row.mode === 'developer';
  const state = row => ({messages: JSON.parse(row.history), used: row.used, remaining: Math.max(0,5-row.used),
    processing: !!row.pending, handoff: !!row.handoff, developerAllowed: developerEnabled,
    mode: isDeveloper(row)?'developer':'demonstration'});
  const get = id => db.prepare('SELECT * FROM sessions WHERE id=?').get(id);
  const bump = bucket => db.prepare('INSERT INTO budget(bucket,attempts) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1').run(bucket);
  const attempts = bucket => db.prepare('SELECT attempts FROM budget WHERE bucket=?').get(bucket)?.attempts ?? 0;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body) => { if (!res.destroyed) {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(body));} };
    const fail = (status, code) => send(status, {error: code});
    const address = req.socket.remoteAddress;
    if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)) return fail(403,'forbidden');
    if (!['127.0.0.1:5186','localhost:5186',`127.0.0.1:${req.socket.localPort}`].includes(req.headers.host)) return fail(403,'forbidden');
    const origin = req.headers.origin;
    if (origin && !['http://127.0.0.1:5186','http://localhost:5186'].includes(origin)) return fail(403,'forbidden');
    if (req.headers['sec-fetch-site'] === 'cross-site') return fail(403,'forbidden');
    // No remote identity supplied by a reverse proxy may unlock local developer mode.
    if (req.headers.forwarded || req.headers['x-forwarded-for'] || req.headers['x-forwarded-host'] || req.headers['x-forwarded-proto']) return fail(403,'forbidden');
    const ip = createHash('sha256').update(address).digest('hex');
    const now = clock();
    // Limit session creation / malformed requests, not just successful model calls.
    const minute = Math.floor(now/60000);
    const rate = clients.get(ip);
    const window = rate?.minute === minute ? rate : {minute, count: 0};
    clients.set(ip, window);
    if (++window.count > 120) return fail(429,'slow_down');
    const match = /(?:^|;\s*)prisma_demo=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '');
    let row = match ? get(match[1]) : undefined;
    if (row && row.ip !== ip) return fail(403,'forbidden');
    if (req.url === '/api/demo/session' && req.method === 'GET') {
      if (!row) {
        const bucket = `sessions:${ip}:${Math.floor(now/86400000)}`;
        if (attempts(bucket) >= 10) return fail(429,'slow_down');
        bump(bucket);
        const id = randomBytes(32).toString('hex');
        db.prepare('INSERT INTO sessions(id,ip) VALUES (?,?)').run(id,ip);
        row=get(id);
        res.setHeader('Set-Cookie',`prisma_demo=${id}; HttpOnly; SameSite=Strict; Path=/api/demo; Max-Age=2592000`);
      }
      return send(200,state(row));
    }
    const changingMode=req.url === '/api/demo/mode';
    if ((!changingMode && req.url !== '/api/demo/message') || req.method !== 'POST') return fail(404,'not_found');
    if (!origin) return fail(403,'forbidden');
    if (!row) return fail(401,'session_required');
    if (changingMode && !developerEnabled) return fail(403,'forbidden');
    if (!changingMode && row.used >= 5 && !isDeveloper(row)) return fail(403,'limit_reached');
    if (row.pending) return fail(409,'processing');
    if (!changingMode && now-row.last < cooldown) return fail(429,'slow_down');
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) return fail(415,'invalid_message');
    let body;
    try {
      let raw='';
      for await (const chunk of req) { raw+=chunk; if(Buffer.byteLength(raw)>4096) {fail(413,'invalid_message');req.resume();return;} }
      body=JSON.parse(raw);
    } catch { return fail(400,'invalid_message'); }
    if (changingMode) {
      if (!['demonstration','developer'].includes(body?.mode)) return fail(400,'invalid_mode');
      const updated=db.prepare('UPDATE sessions SET mode=? WHERE id=? AND pending IS NULL').run(body.mode,row.id);
      if (!updated.changes) return fail(409,'processing');
      return send(200,state(get(row.id)));
    }
    if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.trim().length > 800 ||
        typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.requestId)) return fail(400,'invalid_message');
    // Re-read after receiving the body: another request may have acquired the lock.
    row=get(row.id);
    if (row.pending) return fail(409,'processing');
    if (row.used>=5 && !isDeveloper(row)) return fail(403,'limit_reached');
    const history=JSON.parse(row.history);
    if (history.some(m=>m.requestId===body.requestId)) return send(200,state(row));
    if(now-row.last<cooldown) return fail(429,'slow_down');
    const day=Math.floor(now/86400000);
    const ipBucket=`ip:${ip}:${day}`, globalBucket=`all:${day}`;
    if (attempts(ipBucket)>=20 || attempts(globalBucket)>=100 || inFlight>=2) return fail(429,'slow_down');
    // All mutations before the first await; a SQL conditional also protects the quota.
    const lock=db.prepare('UPDATE sessions SET pending=?,last=? WHERE id=? AND pending IS NULL AND (used<5 OR (?=1 AND mode=\'developer\'))').run(body.requestId,now,row.id,Number(developerEnabled));
    if(!lock.changes) return fail(409,'processing');
    bump(ipBucket); bump(globalBucket); inFlight++;
    try {
      const result=await reply(history,body.text.trim());
      const time=new Date(clock()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      history.push({text:body.text.trim(),customer:true,time,requestId:body.requestId}, {text:result.reply,customer:false,time});
      db.prepare('UPDATE sessions SET history=?,used=used+1,pending=NULL,handoff=? WHERE id=? AND pending=?').run(JSON.stringify(history),Number(result.handoff),row.id,body.requestId);
      return send(200,state(get(row.id)));
    } catch(error) {
      console.warn('Groq demo request not completed:', ['provider_busy','invalid_reply','unavailable'].includes(error.code)?error.code:'internal_error');
      db.prepare('UPDATE sessions SET pending=NULL WHERE id=?').run(row.id);
      return fail(error.code==='provider_busy'?429:503,error.code==='provider_busy'?'provider_busy':'unavailable');
    } finally { inFlight--; }
  });
  server.requestTimeout=10000;
  server.headersTimeout=10000;
  // Only recover interrupted requests after this instance owns its listening port.
  server.once('listening',()=>db.exec('UPDATE sessions SET pending=NULL'));
  server.on('close',()=>db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  try { loadEnvFile(resolve(root,'.env.local')); } catch { console.error('Configuração privada indisponível.');process.exit(1); }
  if (!process.env.GROQ_API_KEY?.trim()) {console.error('GROQ_API_KEY não configurada.');process.exit(1);}
  const folder=resolve(root,'.local-demo');mkdirSync(folder,{recursive:true});
  const environment=process.argv.includes('--development') && process.env.NODE_ENV!=='production'?'development':process.env.NODE_ENV;
  const server=createDemoServer({database:resolve(folder,'sessions.sqlite'),environment,enableDeveloper:process.env.PRISMA_DEVELOPER_MODE==='true'});
  server.on('error',()=>{console.error('Não foi possível iniciar o backend local.');process.exit(1);});
  server.listen(5187,'127.0.0.1',()=>console.log(`PRISMA backend local: http://127.0.0.1:5187 | ${MODEL}`));
}
