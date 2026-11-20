import {easeOut,type TimelineContext} from './types';

// ANIMATION_V1 — CINEMATIC. Extracted from the approved live source, not reconstructed.
export function ANIMATION_V1(context:TimelineContext) {
  const {page,isMobile,overlay,animate,animations,finish,setLoader,setCarouselReady}=context;
        const titleEntrance = isMobile?3440:0;
        const titleLetters = page.querySelectorAll('#headline .cinematic-letter');
        const firstPhraseLength = Array.from('Mais inteligência,'.replace(/\s/g,'')).length;
        const characterStagger = 16, characterDuration = 520, firstTitlePause = 180, secondTitlePause = 80;
        const firstPhraseEnd = (firstPhraseLength-1)*characterStagger+characterDuration;
        const secondPhraseStart = firstPhraseEnd+firstTitlePause;
        const titleEnd = secondPhraseStart+(titleLetters.length-firstPhraseLength-1)*characterStagger+characterDuration;
        // Shift the existing continuation as a unit; all its internal timings stay intact.
        const entrance = titleEntrance+titleEnd+secondTitlePause-780;
        const reveal = (selector:string, at:number, duration=300, scale=false, clock=entrance) => {
          // Individual properties leave desktop's CSS perspective and Tilt transforms intact.
          const frames:Keyframe[] = isMobile ? [
            {opacity:0, transform:scale?'scale(0.978)':'translateY(4px)'}, {opacity:1, transform:'none'}
          ] : scale ? [
            {scale:'0.978'}, {scale:'1'}
          ] : [{opacity:0, translate:'0 4px'}, {opacity:1, translate:'none'}];
          return animate(page.querySelector(selector),frames,clock+at,duration,selector,scale?'cubic-bezier(0.77, 0, 0.175, 1)':easeOut);
        };
        if (isMobile) {
          const loaderExit = animate(overlay.current, [{opacity:1},{opacity:0}], 3200, 240, 'loader-exit');
          loaderExit?.finished.then(()=>{
            if (!context.disposed) {window.scrollTo({top:0,behavior:'instant'});setLoader(false); page.dataset.intro = 'running';}
          }).catch(()=>{});
        }
        titleLetters.forEach((letter, i)=>animate(letter,
          [{opacity:0, filter:'blur(7px)'},{opacity:1, filter:'none'}],
          titleEntrance+(i<firstPhraseLength?i*characterStagger:secondPhraseStart+(i-firstPhraseLength)*characterStagger),
          characterDuration, `title-${i}`));
        // Overlap the settling tail of each scene with the next entrance.
        if (!isMobile) animate(page.querySelector('.inbox-rig'),[{opacity:0},{opacity:1}],entrance+780,560,'inbox-frame','cubic-bezier(0.77, 0, 0.175, 1)');
        reveal(isMobile?'.inbox-rig':'.inbox-tilt', 780, 560, true);
        const laterEntrance = entrance-180;
        const revealLater = (selector:string,at:number,duration=300)=>reveal(selector,at,duration,false,laterEntrance);
        const flowDelay = 480;
        const revealSide = (selector:string,at:number,direction:number) => animate(page.querySelector(selector),
          [{opacity:0,translate:`${direction*(isMobile?6:18)}px 0`,scale:'0.978'},{opacity:1,translate:'none',scale:'none'}],
          laterEntrance+at,560,selector,'cubic-bezier(0.77, 0, 0.175, 1)');
        revealSide('.flow-panel',1180+flowDelay,-1);
        if (!isMobile) {
          revealLater('.flow-panel .panel-body h2',1450+flowDelay,280);
          revealLater('.flow-panel .live',1450+flowDelay,280);
          revealLater('.flow-panel .panel-note',2630+flowDelay,280);
        }
        const nodes = page.querySelectorAll('.flow-panel .node');
        [1450,1830,2220].forEach((at,i)=>animate(nodes[i], [{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'none'}], laterEntrance+at+flowDelay,280,`flow-card-${i}`));
        const lines = isMobile ? [page.querySelector('.flow > .connector:not(.branch)'),page.querySelector('.mobile-flow-bridge'),page.querySelector('.flow > .connector.branch')]
          : [page.querySelector('.flow > .connector:not(.branch)'),page.querySelector('.flow > .connector.branch')];
        [1650,2030,2430].forEach((at,i)=>animate(lines[i], [{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}], laterEntrance+at+flowDelay,240,`flow-line-${i}`,'linear'));
        page.querySelectorAll('.branch .cinematic-letter').forEach((letter,i)=>animate(letter,
          [{opacity:0},{opacity:1}], laterEntrance+2630+flowDelay+i*12,220,`flow-text-${i}`));
        const operationAt = 1180+flowDelay+130;
        revealSide('.operation-panel',operationAt,1);
        {
          ['.panel-body h2','.panel-body > .muted','.operation-stats span','.team-label','.team-member','.activity','.panel-note'].forEach((selector,i)=>page.querySelectorAll(`.operation-panel ${selector}`).forEach((element,j)=>animate(element,[{opacity:0,translate:'0 3px'},{opacity:1,translate:'none'}],laterEntrance+operationAt+180+i*45+j*35,280,`operation-label-${i}-${j}`)));
          page.querySelectorAll('.operation-stats strong').forEach((element,i)=>animate(element,[{opacity:0,translate:'0 4px'},{opacity:1,translate:'none'}],laterEntrance+operationAt+280+i*55,320,`operation-number-${i}`));
          page.querySelectorAll('.allocation i').forEach((element,i)=>animate(element,[{transform:'scaleX(0)',transformOrigin:'left'},{transform:'none',transformOrigin:'left'}],laterEntrance+operationAt+350+i*70,500,`operation-bar-${i}`));
        }
        if (isMobile) revealLater('.mobile-attention-state', operationAt+920, 320);
        // Both viewports use Agente de IA to launch the closing phase.
        const closingAt = 1830+flowDelay;
        animate(page.querySelector(isMobile?'.hero-subtitle-mobile':'.hero-subtitle-original'), [{opacity:0,filter:'blur(5px)'},{opacity:1,filter:'none'}], laterEntrance+closingAt,620,'subtitle','cubic-bezier(0.77, 0, 0.175, 1)');
        const controls = isMobile?page.querySelectorAll('.mobile-nav-toggle'):page.querySelectorAll('.header nav > button,.header nav > a,.header > .nav-action');
        const navigationAt = closingAt+780;
        const brandingAt = Math.max(
          ...animations.map(a=>{const t=a.effect!.getTiming();return Number(t.delay)+Number(t.duration)-laterEntrance;}),
          navigationAt+500,
          navigationAt+(controls.length-1)*(isMobile?40:80)+300
        );
        const ctaAt = brandingAt+340+140;
        animate(page.querySelector('.header .brand'),[{opacity:0,translate:'0 3px'},{opacity:1,translate:'none'}],laterEntrance+brandingAt,340,'branding');
        const cta = revealLater('.testar-cta', ctaAt, 420);
        const last = revealLater('.reference-carousel',navigationAt,500);
        const navigation = Array.from(controls).map((element,i)=>animate(element,
          [{opacity:0,translate:isMobile?'0 3px':'0 7px'},{opacity:1,translate:'none'}],
          laterEntrance+navigationAt+i*(isMobile?40:80),300,`navigation-${i}`));
        const navigationFinished = Promise.all([last,...navigation].filter((a):a is Animation=>Boolean(a)).map(a=>a.finished));
        navigationFinished.then(()=>{if (!context.disposed) setCarouselReady(true);}).catch(()=>{});
        Promise.all([navigationFinished,cta?.finished]).then(finish).catch(()=>{});
        context.onDeadline(laterEntrance+Math.max(closingAt+1580,ctaAt+420)+2000);
}
