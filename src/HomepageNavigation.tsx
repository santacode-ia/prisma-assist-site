import {lazy, Suspense, useCallback, useEffect, useRef, useState} from 'react';
import {Menu, X} from 'lucide-react';
import {useMobileHomepage} from './MobileHomepageExperience';

const GlassSurface = lazy(()=>import('./components/GlassSurface'));

export default function HomepageNavigation({onExplore}:{onExplore:(area:string)=>void}) {
  const mobile = useMobileHomepage();
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open,setOpen] = useState(false);
  // Lazy glass replaces its fallback; restore focus on the real first option.
  const firstOption = useCallback((button:HTMLButtonElement|null)=>{
    if (button?.closest('nav')?.matches(':popover-open')) button.focus({preventScroll:true});
  }, []);
  const close = () => {if (nav.current?.matches(':popover-open')) nav.current.hidePopover();};

  useEffect(()=>{
    const element = nav.current;
    if (!mobile || !element) return;
    const sync = () => {
      const shown = element.matches(':popover-open');
      setOpen(shown);
      if (shown) element.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
    };
    element.addEventListener('toggle',sync);
    return ()=>element.removeEventListener('toggle',sync);
  }, [mobile]);

  const options = <>
    <button ref={firstOption} onClick={()=>onExplore('inbox')}>Plataforma</button>
    <button onClick={()=>onExplore('flow')}>Soluções</button>
    <button className="contact-pending" disabled title="Canal de contato em definição"><span>Contato</span></button>
    <button onClick={()=>onExplore('company')}>Empresa</button>
    <a href="/testar">Testar</a>
  </>;

  if (!mobile) return <nav id="home-navigation" aria-label="Navegação principal">{options}</nav>;
  return <>
    <button ref={toggle} className="mobile-nav-toggle" type="button" popoverTarget="home-navigation"
      aria-label={open?'Fechar navegação':'Abrir navegação'} aria-expanded={open} aria-controls="home-navigation">
      {open?<X size={24} strokeWidth={1.4} aria-hidden="true"/>:<Menu size={24} strokeWidth={1.4} aria-hidden="true"/>}
    </button>
    <nav ref={nav} id="home-navigation" className="mobile-glass-navigation" popover="auto" aria-label="Navegação principal"
      onClick={e=>{if ((e.target as Element).closest('button,a')) close();}}
      onKeyDown={e=>{if(e.key==='Escape'){close();toggle.current?.focus();}}}>
      <Suspense fallback={<div className="mobile-glass-fallback">{options}</div>}>
        <GlassSurface className="mobile-menu-glass" width="100%" height="auto" borderRadius={16}
          renderer="svg" distortionScale={-48} borderWidth={.08} blur={10} displace={1.2}
          redOffset={0} greenOffset={1} blueOffset={2} backgroundOpacity={.86} saturation={.9}>
          {options}
        </GlassSurface>
      </Suspense>
    </nav>
  </>;
}
