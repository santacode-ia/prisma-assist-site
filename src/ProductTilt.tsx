import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import TiltedCard from './components/TiltedCard';
import {useMobileHomepage} from './MobileHomepageExperience';

export default function ProductTilt({children}:{children:ReactNode}){
  const mobile=useMobileHomepage();
  const rig=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const element=rig.current!;
    const snap=()=>{
      if(!matchMedia('(min-width:1251px)').matches){element.style.marginTop='';return;}
      element.style.marginTop='0px';
      const top=element.getBoundingClientRect().top+scrollY;
      element.style.marginTop=`${Math.round(top)-top}px`;
    };
    const observer=new ResizeObserver(snap);observer.observe(element.parentElement!);
    window.addEventListener('resize',snap);document.fonts.ready.then(snap);snap();
    return()=>{observer.disconnect();window.removeEventListener('resize',snap)};
  },[]);
  const [enabled,setEnabled]=useState(false);
  useEffect(()=>{
    const query=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const sync=()=>setEnabled(query.matches);
    sync();query.addEventListener('change',sync);
    return ()=>query.removeEventListener('change',sync);
  },[]);
  if(mobile)return <div ref={rig} className="inbox-rig">{children}</div>;
  return <div ref={rig} className="inbox-rig"><TiltedCard stabilizeContent={false} className="inbox-tilt" containerWidth="100%" containerHeight="100%" imageWidth="100%" imageHeight="100%" rotateAmplitude={enabled?2.25:0} scaleOnHover={1} perspective={2400} smoothness={0.1} glare={0} shadow={0} radius={13} parallax={0} intro={false} floating={false} gyroscope={false} showTooltip={false} flipOnClick={false}>{children}</TiltedCard></div>;
}
