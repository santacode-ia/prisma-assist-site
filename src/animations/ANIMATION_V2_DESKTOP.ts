import {easeOut,type TimelineContext} from './types';

export const FAST_FLOW_DESKTOP = Object.freeze({
  characterDuration:520,characterStagger:16,titleBlur:7,firstTitlePause:180,secondTitlePause:80,
  inboxDuration:560,inboxScale:.978,inboxOverlap:180,subtitleDuration:620,
  navigationOverlap:380,navigationStagger:80,navigationDuration:300,
  brandingOverlap:200,brandingDuration:340,carouselOverlap:180,carouselDuration:500,
  panelsAfterCarousel:100,panelStagger:80,panelDuration:560,panelScale:.99,
  flowDuration:280,numberDuration:320,barDuration:500,
  ctaGap:250,ctaDuration:420
});

export function ANIMATION_V2_DESKTOP(context:TimelineContext) {
  const {page,animate,finish,setCarouselReady}=context,t=FAST_FLOW_DESKTOP;
  const reveal=(selector:string,at:number,duration:number,y=3)=>animate(page.querySelector(selector),
    [{opacity:0,translate:`0 ${y}px`},{opacity:1,translate:'none'}],at,duration,selector);
  // Exact V1 character frames, easing and phrase timing; V1's own module stays frozen.
  const titleLetters=page.querySelectorAll('#headline .cinematic-letter');
  const firstPhraseLength=Array.from('Mais inteligência,'.replace(/\s/g,'')).length;
  const firstPhraseEnd=(firstPhraseLength-1)*t.characterStagger+t.characterDuration;
  const secondPhraseStart=firstPhraseEnd+t.firstTitlePause;
  const titleEnd=secondPhraseStart+(titleLetters.length-firstPhraseLength-1)*t.characterStagger+t.characterDuration;
  titleLetters.forEach((letter,i)=>animate(letter,
    [{opacity:0,filter:`blur(${t.titleBlur}px)`},{opacity:1,filter:'none'}],
    i<firstPhraseLength?i*t.characterStagger:secondPhraseStart+(i-firstPhraseLength)*t.characterStagger,
    t.characterDuration,`title-${i}`,easeOut));

  const inboxAt=titleEnd+t.secondTitlePause;
  const zoomEase='cubic-bezier(0.77, 0, 0.175, 1)';
  animate(page.querySelector('.inbox-rig'),[{opacity:0},{opacity:1}],inboxAt,t.inboxDuration,'inbox-frame',zoomEase);
  animate(page.querySelector('.inbox-tilt'),[{scale:String(t.inboxScale)},{scale:'none'}],inboxAt,t.inboxDuration,'inbox-zoom',zoomEase);

  // There is no eyebrow in the current hero: reveal its existing subtitle only.
  const subtitleAt=inboxAt+t.inboxDuration-t.inboxOverlap;
  animate(page.querySelector('.hero-subtitle-original'),[{opacity:0,filter:'blur(5px)'},{opacity:1,filter:'none'}],
    subtitleAt,t.subtitleDuration,'subtitle','cubic-bezier(0.77, 0, 0.175, 1)');

  const navigationAt=subtitleAt+t.subtitleDuration-t.navigationOverlap;
  const links=page.querySelectorAll('.header nav > button,.header nav > a');
  links.forEach((element,i)=>{
    // Five links: Plataforma/Testar → Soluções/Empresa → Contato.
    const wave=Math.min(i,links.length-1-i);
    animate(element,[{opacity:0,translate:'0 5px'},{opacity:1,translate:'none'}],
      navigationAt+wave*t.navigationStagger,t.navigationDuration,`navigation-${i}`);
  });
  const waveEnd=navigationAt+Math.floor((links.length-1)/2)*t.navigationStagger+t.navigationDuration;
  const extra=animate(page.querySelector('.header > .nav-action'),
    [{opacity:0,translate:'0 5px'},{opacity:1,translate:'none'}],waveEnd-t.navigationDuration+40,t.navigationDuration,'navigation-action');
  const brandingAt=waveEnd+(extra?40:0)-t.brandingOverlap;
  animate(page.querySelector('.header .brand'),[{opacity:0,translate:'0 2px'},{opacity:1,translate:'none'}],
    brandingAt,t.brandingDuration,'branding');

  const carouselAt=brandingAt+t.brandingDuration-t.carouselOverlap;
  const carousel=reveal('.reference-carousel',carouselAt,t.carouselDuration,3);
  carousel?.finished.then(()=>{if(!context.disposed)setCarouselReady(true);}).catch(()=>{});

  const panelsAt=carouselAt+t.panelsAfterCarousel;
  const surface=(selector:string,offset:number,direction:number)=>animate(page.querySelector(selector),
    [{opacity:0,translate:`${direction*8}px 0`,scale:String(t.panelScale)},
      {opacity:1,translate:'none',scale:'none'}],panelsAt+offset,t.panelDuration,selector,zoomEase);
  surface('.flow-panel',0,-1);
  surface('.operation-panel',t.panelStagger,1);
  reveal('.flow',panelsAt+80,t.flowDuration,2);
  page.querySelectorAll('.operation-stats strong').forEach((element,i)=>animate(element,
    [{opacity:0},{opacity:1}],panelsAt+t.panelStagger+80+i*20,t.numberDuration,`operation-number-${i}`));
  page.querySelectorAll('.allocation i').forEach((element,i)=>animate(element,
    [{transform:'scaleX(0)',transformOrigin:'left'},{transform:'none',transformOrigin:'left'}],
    panelsAt+t.panelStagger+100+i*10,t.barDuration,`operation-bar-${i}`));

  const ctaAt=Math.max(panelsAt+t.panelStagger+t.panelDuration+t.ctaGap,...context.animations.map(a=>{
    const timing=a.effect!.getTiming();return Number(timing.delay)+Number(timing.duration);
  }));
  const cta=reveal('.testar-cta',ctaAt,t.ctaDuration,3);
  cta?.finished.then(finish).catch(()=>{});
  context.onDeadline(ctaAt+t.ctaDuration+2000);
}
