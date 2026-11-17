import type {ComponentType,ReactNode,CSSProperties} from 'react';
type Props = {children?:ReactNode;width?:number|string;height?:number|string;borderRadius?:number;borderWidth?:number;brightness?:number;opacity?:number;blur?:number;displace?:number;backgroundOpacity?:number;saturation?:number;distortionScale?:number;redOffset?:number;greenOffset?:number;blueOffset?:number;refraction?:boolean;renderer?:'auto'|'svg'|'webgl';className?:string;style?:CSSProperties};
declare const GlassSurface:ComponentType<Props>;
export default GlassSurface;
