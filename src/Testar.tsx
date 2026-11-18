import {useEffect} from 'react';
import BrandWordmark from './BrandWordmark';

export default function Testar(){
  useEffect(()=>{document.title='Teste — PRISMA ASSIST';},[]);
  return <main className="testar-page"><header className="header"><a className="brand" href="/" aria-label="PRISMA ASSIST — início"><img className="brand-logo" src="/prisma-triangle.svg" alt="" width="28" height="24"/><BrandWordmark/></a></header><section className="testar-placeholder" aria-labelledby="testar-title"><p className="testar-status">ESTADO PROVISÓRIO</p><h1 id="testar-title">Página de teste em preparação</h1><p>Esta página ainda não oferece uma demonstração funcional da plataforma ou conexão com o WhatsApp.</p><a className="primary" href="/">Voltar ao site institucional</a></section></main>;
}
