import {useEffect,useState,type ReactNode} from 'react';
import TiltedCard from './components/TiltedCard';

export default function ProductTilt({children}:{children:ReactNode}){
  const [enabled,setEnabled]=useState(false);
  useEffect(()=>{
    const query=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const sync=()=>setEnabled(query.matches);
    sync();query.addEventListener('change',sync);
    return ()=>query.removeEventListener('change',sync);
  },[]);
  return <div className="inbox-rig"><TiltedCard className="inbox-tilt" containerWidth="100%" containerHeight="100%" imageWidth="100%" imageHeight="100%" rotateAmplitude={enabled?1.15:0} scaleOnHover={1} perspective={2400} smoothness={0.1} glare={0} shadow={0} radius={13} parallax={0} intro={false} floating={false} gyroscope={false} showTooltip={false} flipOnClick={false}>{children}</TiltedCard></div>;
}
