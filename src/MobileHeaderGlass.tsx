import {lazy, Suspense} from 'react';
import {useMobileHomepage} from './MobileHomepageExperience';

const GlassSurface = lazy(()=>import('./components/GlassSurface'));

/** The original React Bits surface, behind—not filtering—the live branding. */
export default function MobileHeaderGlass() {
  const mobile = useMobileHomepage();
  if (!mobile) return null;
  return <div className="mobile-header-glass" aria-hidden="true">
    <Suspense fallback={<div className="mobile-header-glass-fallback"/>}>
      <GlassSurface className="mobile-header-surface" width="100%" height="100%" borderRadius={0}
        renderer="svg" distortionScale={-18} borderWidth={.04} blur={6} displace={.6}
        redOffset={0} greenOffset={0} blueOffset={0} backgroundOpacity={.66} saturation={.95}/>
    </Suspense>
  </div>;
}
