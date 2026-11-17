import type {ReactNode,ComponentType,CSSProperties} from 'react';
type Props={children?:ReactNode;className?:string;itemDistance?:number;itemStackDistance?:number;stackPosition?:number|string;itemScale?:number;baseScale?:number;dimAmount?:number;blurAmount?:number;tiltAmount?:number;rotationAmount?:number;holdDistance?:number;smoothScroll?:boolean;snap?:boolean;useWindowScroll?:boolean;onStackComplete?:()=>void};
export const ScrollStackItem:ComponentType<{children?:ReactNode;itemClassName?:string;style?:CSSProperties}>;
declare const ScrollStack:ComponentType<Props>;
export default ScrollStack;
