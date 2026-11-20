import {easeOut,type TimelineContext} from './types';

// ANIMATION_V2_MOBILE — FAST FLOW. All markers use the runtime's single document timeline.
export const FAST_FLOW_MOBILE = Object.freeze({
  titleDuration:120,titleStagger:2,titleBlur:5,
  inboxAt:190,inboxDuration:180,inboxScale:.978,
  topAt:370,contentDuration:140,contentScale:.99,
  carouselOffset:30,navigationDuration:120,navigationStagger:15,
  brandingDuration:120,ctaGap:0,ctaDuration:140
});

export function ANIMATION_V2_MOBILE(context:TimelineContext) {
  const {page,isMobile,animate,finish,setCarouselReady}=context,t=FAST_FLOW_MOBILE;
  const reveal=(selector:string,at:number,duration:number,y=3)=>animate(page.querySelector(selector),
    [{opacity:0,translate:`0 ${y}px`},{opacity:1,translate:'none'}],at,duration,selector);

  page.querySelectorAll('#headline .cinematic-letter').forEach((letter,i)=>animate(letter,
    [{opacity:0,filter:`blur(${t.titleBlur}px)`},{opacity:1,filter:'none'}],i*t.titleStagger,t.titleDuration,`title-${i}`));

  animate(page.querySelector('.inbox-rig'),[{opacity:0},{opacity:1}],t.inboxAt,t.inboxDuration,'inbox-frame');
  animate(page.querySelector(isMobile?'.inbox-rig':'.inbox-tilt'),
    [{scale:String(t.inboxScale)},{scale:'none'}],t.inboxAt,t.inboxDuration,'inbox-zoom');

  reveal(isMobile?'.hero-subtitle-mobile':'.hero-subtitle-original',t.topAt,t.contentDuration,2);
  const carouselAt=t.topAt+t.carouselOffset;
  const carousel=reveal('.reference-carousel',carouselAt,t.contentDuration,3);
  carousel?.finished.then(()=>{if(!context.disposed)setCarouselReady(true);}).catch(()=>{});
  const navigationAt=t.topAt+30;
  const controls=page.querySelectorAll(isMobile?'.mobile-nav-toggle':'.header nav > button,.header nav > a,.header > .nav-action');
  controls.forEach((element,i)=>animate(element,
    [{opacity:0,translate:`0 ${isMobile?3:5}px`},{opacity:1,translate:'none'}],
    navigationAt+i*t.navigationStagger,t.navigationDuration,`navigation-${i}`));
  const brandingAt=navigationAt+30;
  animate(page.querySelector('.header .brand'),[{opacity:0,translate:'0 2px'},{opacity:1,translate:'none'}],
    brandingAt,t.brandingDuration,'branding',easeOut);

  const panelsAt=Math.max(t.topAt+t.contentDuration,carouselAt+t.contentDuration,
    navigationAt+Math.max(0,controls.length-1)*t.navigationStagger+t.navigationDuration,
    brandingAt+t.brandingDuration);
  const surface=(selector:string,offset:number,direction:number)=>animate(page.querySelector(selector),
    [{opacity:0,translate:`${direction*(isMobile?4:8)}px 0`,scale:String(t.contentScale)},
      {opacity:1,translate:'none',scale:'none'}],panelsAt+offset,t.contentDuration,selector);
  surface('.flow-panel',0,-1);
  surface('.operation-panel',30,1);
  // Reveal the real flow as a group, retaining every existing card and connection.
  reveal('.flow',panelsAt+35,120,2);
  if(isMobile)reveal('.mobile-attention-state',panelsAt+60,t.contentDuration,2);
  page.querySelectorAll('.operation-stats strong').forEach((element,i)=>animate(element,
    [{opacity:0},{opacity:1}],panelsAt+40+i*5,120,`operation-number-${i}`));
  page.querySelectorAll('.allocation i').forEach((element,i)=>animate(element,
    [{transform:'scaleX(0)',transformOrigin:'left'},{transform:'none',transformOrigin:'left'}],
    panelsAt+50+i*5,140,`operation-bar-${i}`));
  const ctaAt=Math.max(...context.animations.map(a=>{
    const timing=a.effect!.getTiming();return Number(timing.delay)+Number(timing.duration);
  }))+t.ctaGap;
  const cta=reveal('.testar-cta',ctaAt,t.ctaDuration,3);
  cta?.finished.then(finish).catch(()=>{});
  context.onDeadline(ctaAt+t.ctaDuration+2000);
}
