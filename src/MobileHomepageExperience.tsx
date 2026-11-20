import {ANIMATION_V1} from './animations/ANIMATION_V1';
import {ANIMATION_V2} from './animations/ANIMATION_V2';
import {easeOut,motionVersion} from './animations/types';
import {useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject} from 'react';

const mobileQuery = '(max-width:800px)';
const reducedQuery = '(prefers-reduced-motion: reduce)';
const subscribeMobile = (notify:()=>void) => {
  const query = matchMedia(mobileQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
export const useMobileHomepage = () => useSyncExternalStore(subscribeMobile, ()=>matchMedia(mobileQuery).matches, ()=>false);

// Same-tab links/back navigation must not repeat a decorative loading screen.
function shouldIntroduce() {
  if (matchMedia(reducedQuery).matches) return false;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === 'back_forward') return false;
  if (navigation?.type !== 'reload' && document.referrer) {
    try { if (new URL(document.referrer).origin === location.origin) return false; } catch { /* no referrer */ }
  }
  return true;
}

export function CinematicText({text, className = ''}:{text:string;className?:string}) {
  return <span className={className}><span className="cinematic-accessible">{text}</span><span aria-hidden="true">{text.split(' ').map((word, index)=><span key={index}>
    {index > 0 ? ' ' : null}<span className="cinematic-word">{Array.from(word).map((letter, i)=><span className="cinematic-letter" key={i}>{letter}</span>)}</span>
  </span>)}</span></span>;
}

// Coordinates copied verbatim from public/prisma-triangle.svg, the current official asset.
const prismaPath = 'M627 342 296 904H953L627 342Z M627 342V728L296 904 M627 728 953 904';
// The same six official edges, phased independently without changing the symbol.
const prismaStrokes = ['M627 342 296 904','M296 904H953','M953 904 627 342','M627 342V728','M627 728 296 904','M627 728 953 904'];

export function useMobileIntroduction(root:RefObject<HTMLElement|null>) {
  const [version] = useState(motionVersion);
  const [loader, setLoader] = useState(()=>version==='v1' && matchMedia(mobileQuery).matches && shouldIntroduce());
  const overlay = useRef<HTMLDivElement>(null);
  const [carouselReady,setCarouselReady] = useState(()=>!shouldIntroduce());

  useLayoutEffect(()=>{
    const page = root.current;
    if (!page) return;
    const mobile = matchMedia(mobileQuery), reduced = matchMedia(reducedQuery);
    const isMobile = mobile.matches;
    page.dataset.motion=version;
    let disposed = false;
    let animations:Animation[] = [];
    let fallback:ReturnType<typeof setTimeout> | undefined;
    const scene = page.querySelector<HTMLElement>('.mobile-operation-scene');
    const stage = page.querySelector<HTMLElement>('.product-stage');

    // Only the right-hand scene owns a camera. Front-facing text remains in 2D.
    const align = () => {
      if (!mobile.matches || !stage || !scene) return;
      const previous = parseFloat(stage.style.getPropertyValue('--mobile-stage-snap')) || 0;
      const top = stage.getBoundingClientRect().top + scrollY;
      stage.style.setProperty('--mobile-stage-snap', `${previous + Math.round(top) - top}px`);
      const a = stage.getBoundingClientRect(), b = scene.getBoundingClientRect();
      scene.style.setProperty('--camera-x', `${a.width / 2 - (b.left - a.left)}px`);
      scene.style.setProperty('--camera-y', `${a.height * .35 - (b.top - a.top)}px`);
    };
    align();
    const observer = new ResizeObserver(align);
    if (stage) observer.observe(stage);
    const copy = page.querySelector('.hero-copy');
    if (copy) observer.observe(copy);
    document.fonts.ready.then(()=>{if (!disposed) align();});

    const finish = () => {
      clearTimeout(fallback);
      animations.forEach(animation=>animation.cancel());
      animations = [];
      page.dataset.intro = 'complete';
      if (!disposed) {setLoader(false);setCarouselReady(true);}
    };
    const onPreference = () => {align(); finish();};
    const onInteraction = () => {if (page.dataset.intro !== 'complete') finish();};
    const onScroll = () => {if (mobile.matches && page.dataset.intro === 'running' && scrollY > 60) onInteraction();};
    const onWheel = () => {if (!mobile.matches) onInteraction();};
    mobile.addEventListener('change', onPreference);
    reduced.addEventListener('change', onPreference);
    page.addEventListener('pointerdown', onInteraction, {capture:true});
    window.addEventListener('keydown', onInteraction, {capture:true});
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('wheel', onWheel, {passive:true});

    if (shouldIntroduce() && typeof page.animate === 'function') {
      try {
        page.dataset.intro = isMobile && version==='v1'?'loader':'running';
        window.scrollTo({top:0,behavior:'instant'});
        const start = document.timeline.currentTime as number;
        const animate = (element:Element|null, frames:Keyframe[], at:number, duration:number, id:string, easing=easeOut) => {
          if (!element) return;
          const animation = element.animate(frames, {delay:at, duration, easing, fill:'both'});
          animation.id = `prisma-${id}`;
          animation.startTime = start;
          animations.push(animation);
          // Cancel, rather than retain identity transforms/filter:blur(0), at rest.
          // The fading overlay must stay transparent until React unmounts it;
          // cancelling it first would briefly restore its opaque base style.
          if (id !== 'loader-exit') animation.finished.then(()=>animation.cancel()).catch(()=>{});
          return animation;
        };
        const schedule = version==='v2'?ANIMATION_V2:ANIMATION_V1;
        schedule({page,isMobile,overlay,animate,finish,setLoader,setCarouselReady,
          get disposed(){return disposed;},
          get animations(){return animations;},
          onDeadline:delay=>{fallback=setTimeout(finish,delay);}
        });
      } catch { finish(); }
    } else finish();

    return ()=>{
      disposed = true;
      finish();
      observer.disconnect();
      stage?.style.removeProperty('--mobile-stage-snap');
      scene?.style.removeProperty('--camera-x');
      scene?.style.removeProperty('--camera-y');
      mobile.removeEventListener('change', onPreference);
      reduced.removeEventListener('change', onPreference);
      page.removeEventListener('pointerdown', onInteraction, true);
      window.removeEventListener('keydown', onInteraction, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
    };
  }, [root,version]);

  return {loader, overlay, carouselReady};
}

export default function MobileHomepageExperience({loader,overlay}:{loader:boolean;overlay:RefObject<HTMLDivElement|null>}) {
  return loader ? <div ref={overlay} className="prisma-loader" aria-hidden="true">
    <svg viewBox="280 326 690 594" fill="none" stroke="#000" strokeWidth="17" strokeLinejoin="miter">
      <path d={prismaPath} opacity=".16"/>
      {prismaStrokes.map((d,index)=><path key={d} d={d} pathLength="1" className="prisma-loader-stroke" style={{animationDelay:`${index*160}ms`}}/>)}
    </svg>
  </div> : null;
}
