import type {RefObject} from 'react';

export const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
export type MotionVersion = 'v1'|'v2';
export function motionVersion(search=location.search):MotionVersion {
  return new URLSearchParams(search).get('motion')==='v2'?'v2':'v1';
}
export interface TimelineContext {
  page:HTMLElement;
  isMobile:boolean;
  overlay:RefObject<HTMLDivElement|null>;
  readonly disposed:boolean;
  readonly animations:readonly Animation[];
  animate:(element:Element|null,frames:Keyframe[],at:number,duration:number,id:string,easing?:string)=>Animation|undefined;
  finish:()=>void;
  setLoader:(value:boolean)=>void;
  setCarouselReady:(value:boolean)=>void;
  onDeadline:(delay:number)=>void;
}
