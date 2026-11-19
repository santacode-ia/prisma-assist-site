import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDemoServer} from './demo.mjs';
import {groqReply, ModelError} from './groq.mjs';

test('quota, concurrency, persistence, failures and origin isolation', async () => {
  const database=join(mkdtempSync(join(tmpdir(),'prisma-test-')),'test.sqlite');
  let release, calls=0, mode='ok';
  const reply=async()=>{calls++;if(mode==='hold')await new Promise(r=>release=r);if(mode==='fail')throw new ModelError('provider_busy');return {reply:'Resposta de teste controlado.',handoff:false};};
  let server=createDemoServer({database,reply,cooldown:0});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let base=`http://127.0.0.1:${server.address().port}`;
  const headers={Host:'127.0.0.1:5187',Origin:'http://127.0.0.1:5186','Content-Type':'application/json'};
  const request=(path,init={})=>fetch(base+path,{...init,headers:{...headers,...init.headers}});
  const session=await request('/api/demo/session');
  if(session.status!==200){console.log('TEST session status',session.status,await session.text());server.close();throw new Error('Session rejected');}
  headers.Cookie=session.headers.get('set-cookie').split(';')[0];
  assert.equal((await session.json()).remaining,5);
  const post=(text='Teste',extra={})=>request('/api/demo/message',{method:'POST',body:JSON.stringify({text,requestId:crypto.randomUUID()}),...extra});
  assert.equal((await post('x'.repeat(801))).status,400);
  assert.equal((await post('x',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal(calls,0);
  mode='fail';assert.equal((await post()).status,429);
  assert.equal((await (await request('/api/demo/session')).json()).used,0);
  mode='hold';const first=post();
  while(!release)await new Promise(r=>setTimeout(r,10));
  assert.equal((await post()).status,409);
  assert.equal((await (await request('/api/demo/session')).json()).processing,true);
  mode='ok';release();assert.equal((await first).status,200);
  for(let i=2;i<=5;i++){const r=await post();assert.equal(r.status,200);const d=await r.json();assert.equal(d.used,i);assert.equal(d.messages.length,i*2);}
  const before=calls;assert.equal((await post()).status,403);assert.equal(calls,before);
  await new Promise(r=>server.close(r));
  server=createDemoServer({database,reply,cooldown:0});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base=`http://127.0.0.1:${server.address().port}`;
  try {
    const restored=await (await request('/api/demo/session')).json();assert.equal(restored.used,5);assert.equal(restored.messages.length,10);
    assert.equal((await post()).status,403);assert.equal(calls,before);
  } finally {await new Promise(r=>server.close(r));}
});

test('provider errors and invalid output never become fictional answers',async()=>{
  const run=fetcher=>groqReply([],'Teste',{key:'test-only-not-a-credential',fetcher});
  await assert.rejects(run(async()=>new Response('{}',{status:429})),{code:'provider_busy'});
  await assert.rejects(run(async()=>{throw new Error('timeout');}),{code:'unavailable'});
  await assert.rejects(run(async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'Visite https://example.com',handoff:false})}}]})),{code:'invalid_reply'});
  await assert.rejects(run(async()=>Response.json({choices:[{finish_reason:'length',message:{content:'partial'}}]})),{code:'invalid_reply'});
});

test('developer mode persists, bypasses only five messages, and fails closed outside development',async()=>{
  const database=join(mkdtempSync(join(tmpdir(),'prisma-mode-test-')),'test.sqlite');
  let calls=0;
  const reply=async()=>{calls++;return {reply:'Resposta controlada de QA.',handoff:false};};
  let server,base;
  const boot=async(options={})=>{
    server=createDemoServer({database,reply,cooldown:0,...options});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
  };
  const headers={Origin:'http://127.0.0.1:5186','Content-Type':'application/json'};
  const request=(path,init={})=>fetch(base+'/api/demo/'+path,{...init,headers:{...headers,...init.headers}});
  const mode=value=>request('mode',{method:'POST',body:JSON.stringify({mode:value})});
  const post=()=>request('message',{method:'POST',body:JSON.stringify({text:'Teste de modos',requestId:crypto.randomUUID(),mode:'developer'})});
  await boot({enableDeveloper:true,environment:'development'});
  try {
    const session=await request('session');headers.Cookie=session.headers.get('set-cookie').split(';')[0];
    assert.equal((await session.json()).developerAllowed,true);
    for(let i=0;i<5;i++)assert.equal((await post()).status,200);
    assert.equal((await post()).status,403); // A frontend field cannot bypass server mode.
    assert.equal((await mode('developer')).status,200);
    const sixth=await post();assert.equal(sixth.status,200);assert.equal((await sixth.json()).used,6);
    const back=await mode('demonstration');const backState=await back.json();
    assert.equal(backState.remaining,0);assert.equal(backState.messages.length,12);
    assert.equal((await post()).status,403);
    assert.equal((await mode('developer')).status,200);
  } finally {await new Promise(r=>server.close(r));}
  await boot({enableDeveloper:true,environment:'development'});
  try {
    const restored=await (await request('session')).json();assert.equal(restored.mode,'developer');assert.equal(restored.used,6);
    for(let i=6;i<20;i++)assert.equal((await post()).status,200);
    assert.equal((await post()).status,429);assert.equal(calls,20); // Daily consumption remains enforced.
    assert.equal((await mode('developer')).status,200);
    assert.equal((await request('mode',{method:'POST',headers:{Origin:'https://example.com'},body:'{"mode":"developer"}'})).status,403);
    assert.equal((await request('mode',{method:'POST',headers:{'X-Forwarded-For':'203.0.113.1'},body:'{"mode":"developer"}'})).status,403);
  } finally {await new Promise(r=>server.close(r));}
  for(const options of [{enableDeveloper:true,environment:'production'},{enableDeveloper:false,environment:'development'},{enableDeveloper:true,environment:undefined}]){
    await boot(options);
    try {
      const state=await (await request('session')).json();assert.equal(state.developerAllowed,false);assert.equal(state.mode,'demonstration');
      assert.equal((await mode('developer')).status,403);assert.equal((await post()).status,403);assert.equal(calls,20);
    } finally {await new Promise(r=>server.close(r));}
  }
});
