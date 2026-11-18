import {useLayoutEffect,useRef} from 'react';

/** Measure the rendered type after fonts load, rather than approximating tracking */
export default function BrandWordmark(){
  const root=useRef<HTMLSpanElement>(null);
  useLayoutEffect(()=>{
    let live=true;
    const measure=()=>{
      if(!live||!root.current)return;
      const main=root.current.querySelector('strong')!;
      const sub=root.current.querySelector('small')!;
      sub.style.letterSpacing='0px';
      const target=main.getBoundingClientRect().width;
      const spacing=(target-sub.getBoundingClientRect().width)/5;
      sub.style.letterSpacing=`${spacing}px`;
    };
    const observer=new ResizeObserver(measure);
    observer.observe(root.current!.querySelector('strong')!);
    document.fonts.ready.then(measure);
    measure();
    return ()=>{live=false;observer.disconnect()};
  },[]);
  return <span ref={root} className="brand-wordmark"><strong>PRISM<span>A</span></strong><small>ASSIS<span>T</span></small></span>;
}
