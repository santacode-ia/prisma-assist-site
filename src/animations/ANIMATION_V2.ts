import type {TimelineContext} from './types';
import {ANIMATION_V2_DESKTOP} from './ANIMATION_V2_DESKTOP';
import {ANIMATION_V2_MOBILE} from './ANIMATION_V2_MOBILE';

// V2 timelines are independent: desktop refinement must not retime mobile.
export function ANIMATION_V2(context:TimelineContext) {
  return context.isMobile?ANIMATION_V2_MOBILE(context):ANIMATION_V2_DESKTOP(context);
}
