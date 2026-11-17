import type {ComponentType,ReactNode,CSSProperties} from 'react';
type Props={children?:ReactNode;containerWidth?:number|string;containerHeight?:number|string;imageWidth?:number|string;imageHeight?:number|string;rotateAmplitude?:number;scaleOnHover?:number;perspective?:number|string;flipOnClick?:boolean;smoothness?:number;glare?:number;shadow?:number;showTooltip?:boolean;floating?:boolean;intro?:boolean;gyroscope?:boolean;parallax?:number;radius?:number;className?:string;style?:CSSProperties};
declare const TiltedCard:ComponentType<Props>;
export default TiltedCard;
