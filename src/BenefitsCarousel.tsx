import {useEffect,useRef,useState} from 'react';
import {Workflow,Sparkles,ShieldCheck} from 'lucide-react';
import Carousel from './components/Carousel';
const items=[
 {id:'function',title:'Como funciona',description:'A IA recebe conversas, entende intenções e organiza respostas e fluxos sem perder o contexto',icon:<Workflow size={16} strokeWidth={1.8}/>},
 {id:'impact',title:'Impacto na operação',description:'Mais organização para responder com agilidade, ampliar a capacidade de atendimento e acompanhar oportunidades',icon:<Sparkles size={16} strokeWidth={1.8}/>},
 {id:'supervision',title:'Supervisão estratégica',description:'A IA conduz o atendimento; em casos que pedem atenção humana, encaminha a conversa com histórico e contexto',icon:<ShieldCheck size={16} strokeWidth={1.8}/>}
];
export default function BenefitsCarousel(){
 const [active,setActive]=useState(0),[reduce,setReduce]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[compact,setCompact]=useState(()=>matchMedia('(max-width:600px)').matches),[narrow,setNarrow]=useState(()=>matchMedia('(max-width:900px)').matches);const root=useRef<HTMLElement>(null);
 useEffect(()=>{const queries=[matchMedia('(prefers-reduced-motion: reduce)'),matchMedia('(max-width:600px)'),matchMedia('(max-width:900px)')];const sync=()=>{setReduce(queries[0].matches);setCompact(queries[1].matches);setNarrow(queries[2].matches)};queries.forEach(q=>q.addEventListener('change',sync));return ()=>queries.forEach(q=>q.removeEventListener('change',sync))},[]);
 useEffect(()=>{const node=root.current;if(!node)return;node.querySelector('.carousel-container')?.setAttribute('aria-label','Como a plataforma apoia a operação');node.querySelector('[aria-label="Previous slide"]')?.setAttribute('aria-label','Tema anterior');node.querySelector('[aria-label="Next slide"]')?.setAttribute('aria-label','Próximo tema');node.querySelectorAll('.carousel-bar').forEach((e,i)=>e.setAttribute('aria-label',`Ver ${items[i].title}`));node.querySelectorAll('.carousel-slide').forEach((e,i)=>e.setAttribute('aria-hidden',String(i!==active)))},[active,reduce]);
 return <section ref={root} className="reference-carousel" aria-label="Como a plataforma apoia a operação"><Carousel key={String(reduce)} items={items} baseWidth={760} aspectRatio={compact?1.3:narrow?2:2.55} peek={compact?30:140} gap={14} radius={14} frame={false} effect="scale" indicator="bars" arrows autoplay={!reduce} autoplayDelay={3000} pauseOnHover={false} loop draggable={!reduce} theme="dark" initialIndex={active} onChange={setActive}/></section>
}

