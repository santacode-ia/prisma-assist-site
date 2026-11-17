import {Children,useEffect,useState,type ReactNode} from 'react';
import ScrollStack,{ScrollStackItem} from './components/ScrollStack';
const motionQuery='(min-width: 1100px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';
export default function InstitutionalStack({children}:{children:ReactNode}){
 const [stack,setStack]=useState(()=>matchMedia(motionQuery).matches);
 useEffect(()=>{const q=matchMedia(motionQuery);const sync=()=>setStack(q.matches);q.addEventListener('change',sync);return ()=>q.removeEventListener('change',sync)},[]);
 if(!stack)return <div className="institutional-static">{children}</div>;
 return <ScrollStack className="institutional-stack" useWindowScroll smoothScroll={false} snap={false} itemDistance={130} itemStackDistance={18} stackPosition={32} itemScale={0.018} baseScale={0.964} dimAmount={0.025} blurAmount={0} tiltAmount={0} rotationAmount={0} holdDistance={150}>{Children.toArray(children).map((child,index)=><ScrollStackItem key={index} itemClassName={`institutional-stack-card stack-piece-${index+1}`}>{child}</ScrollStackItem>)}</ScrollStack>;
}
