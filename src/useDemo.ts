import {useEffect, useRef, useState} from 'react';
import type {FormEvent} from 'react';
export type Message={text:string;time:string;customer:boolean};
type Demo={messages:Message[];used:number;remaining:number;processing:boolean;handoff:boolean;developerAllowed:boolean;mode:'demonstration'|'developer'};
const errors:Record<string,string>={
  limit_reached:'Você utilizou suas 5 mensagens de teste.',
  slow_down:'Aguarde alguns segundos antes de tentar novamente.',
  provider_busy:'A IA está ocupada. Aguarde um pouco e tente novamente. Nenhuma mensagem foi descontada.',
  processing:'Uma mensagem já está sendo processada. Aguarde a resposta.',
  invalid_message:'Escreva uma mensagem de até 800 caracteres.',
  unavailable:'Não foi possível concluir a resposta. Tente novamente em instantes. Nenhuma mensagem foi descontada.'
};
async function request(path:string,options?:RequestInit):Promise<Demo>{
  const response=await fetch('/api/demo/'+path,{...options,signal:AbortSignal.timeout(35000)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error??'unavailable');
  return data;
}
export default function useDemo(){
  const [demo,setDemo]=useState<Demo|null>(null);
  const [draft,setDraft]=useState('');
  const [sending,setSending]=useState(false);
  const [changingMode,setChangingMode]=useState(false);
  const [error,setError]=useState('');
  const [pending,setPending]=useState<Message|null>(null);
  const sendingRef=useRef(false);
  const processing=sending||!!demo?.processing;
  const exhausted=demo?.mode!=='developer'&&demo?.remaining===0&&!processing;
  const messages=[...(demo?.messages??[]),...(pending?[pending]:[])];
  const status=exhausted?'Demonstração concluída':processing?'IA processando':demo?.handoff?'Encaminhamento demonstrativo':demo?.used?'Resposta enviada':'Aguardando mensagem';
  async function refresh(){
    try {setDemo(await request('session'));setError('');} catch {setError('Não foi possível carregar a demonstração. Tente novamente.');}
  }
  useEffect(()=>{document.title='Demonstração com IA — PRISMA ASSIST';void refresh();},[]);
  useEffect(()=>{
    if(!demo?.processing||sending)return;
    const timer=window.setInterval(()=>{void request('session').then(setDemo).catch(()=>{});},1500);
    return ()=>window.clearInterval(timer);
  },[demo?.processing,sending]);
  async function send(event:FormEvent){
    event.preventDefault();
    if(sendingRef.current||changingMode||processing||!demo||exhausted||!draft.trim()||draft.trim().length>800)return;
    sendingRef.current=true;setSending(true);setError('');
    const text=draft.trim();
    setPending({text,customer:true,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});
    try {
      setDemo(await request('message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,requestId:crypto.randomUUID()})}));setDraft('');
    } catch(failure){
      const code=failure instanceof Error?failure.message:'unavailable';setError(errors[code]??errors.unavailable);
      try {setDemo(await request('session'));} catch { /* Preserve history and draft for retry. */ }
    } finally {setPending(null);setSending(false);sendingRef.current=false;}
  }
  async function changeMode(mode:Demo['mode']){
    if(!demo?.developerAllowed||processing||sendingRef.current||changingMode)return;
    setChangingMode(true);setError('');
    try {setDemo(await request('mode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode})}));}
    catch {setError('Não foi possível alterar o modo de teste. Tente novamente.');}
    finally {setChangingMode(false);}
  }
  return {demo,draft,setDraft,error,messages,processing,exhausted,status,send,refresh,changeMode,changingMode};
}
