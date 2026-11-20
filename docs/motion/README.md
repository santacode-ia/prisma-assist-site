# PRISMA ASSIST — motion versions

V1 is the approved default. The query parameter selects only the introductory timeline:

- `http://127.0.0.1:5188/?motion=v1` — **ANIMATION_V1 — CINEMATIC**.
- `http://127.0.0.1:5188/?motion=v2` — **ANIMATION_V2 — FAST FLOW**.
- Missing or unknown values use V1. Reload to replay. No public selector, storage or content changes.

## V1: preserve the approved reference

`src/animations/ANIMATION_V1.ts` is the active, reusable timeline, extracted directly from the approved source. Its durations, delays, curves, keyframes, geometry and choreography were not reconstructed from prompts. The original complete module is retained byte-for-byte in `ANIMATION_V1.original.tsx.txt`; the original loader/surface stylesheet is retained in `ANIMATION_V1.loader-and-surface.css.txt`. `V1-integrity.json` contains SHA-256 hashes for those references and the extracted timeline.

Only runtime plumbing changed during extraction: disposed is read through the context getter, the deadline is scheduled by the shared runtime, and animation handles are supplied by that runtime. All animation statements and numeric parameters stay as extracted. Before/after browser QA compares every V1 timing, easing and computed keyframe against the original, plus final geometry.

The existing live loader component and CSS remain unchanged. V1 mobile still uses it. Desktop never uses the loader. Keep V1 frozen for comparisons; create a new version rather than tuning V1 when experimenting.

## V2: tune Fast Flow independently

`src/animations/ANIMATION_V2.ts` dispatches to independent desktop/mobile modules. The default version remains V1; V2 is experimental and awaits visual approval. Inspect `.canvas[data-motion]` to confirm the URL-selected version without adding public controls.

`ANIMATION_V2_DESKTOP.ts` contains `FAST_FLOW_DESKTOP`. The title uses the exact V1 character frames/timing (520 ms, stagger16, blur7, pauses180/80). Inbox and panels restore V1's560 ms and cubic-bezier(.77,0,.175,1); navigation300, branding340, Carousel500 and CTA420 ms also match V1. Inbox1812–2372; subtitle2192–2812; inward navigation starts2432/2512/2592, duration300 ms. Branding2732–3072; Carousel2892–3392; left/right panels2992/3072, duration560 ms. Overlaps: subtitle180 ms before Inbox ends; navigation380 ms before subtitle ends; branding200 ms before the full navigation phase ends; Carousel180 ms before branding ends. CTA3882–4302 starts250 ms after the right panel's main entrance ends. Total **4302 ms desktop**, no loader. Flow is revealed as a group; numbers320/bar500 ms preserve V1's natural duration without a long mini-card construction. No global speed multiplier is used.

`ANIMATION_V2_MOBILE.ts` preserves the previous V2 timeline without changing its parameters, keyframes or execution path. Total **890 ms mobile**, no loader; title120/stagger2, Inbox190–370, subtitle370, navigation/Carousel400, branding430, panels550/580, CTA750–890. Desktop adjustments do not retime mobile.

Historical reference recovered from original browser QA: first V2 was **1840 ms desktop /1640 ms mobile**, with title220/stagger4 and Inbox300 ms; before the latest desktop redesign it had been accelerated to930/890 ms. Those historical values were recovered from `motion-versions-2026-11-20/qa.json` and `v2-order-2026-11-20/qa.json`, not assumed from prompts. All phases use one `document.timeline` origin. Carousel autoplay is enabled only after its reveal finishes; CTA closes both current timelines.

## Shared runtime and protections

`src/MobileHomepageExperience.tsx` resolves the URL selection once per mount, maintains the existing camera alignment, schedules one selected timeline, and cancels temporary effects on completion, interaction, preference change or unmount. `src/animations/types.ts` defines the context contract and URL resolver. Visual components, Tilt/hover, layouts, Glass Surface, state transitions, Carousel engine and Scroll Stack are shared and unchanged.

Reduced motion skips both intros and the decorative loader. Existing same-site navigation/back behavior is preserved; full reload replays the selected version. `/testar` does not use either timeline. No additional animation library is needed.

QA artifacts: sibling `prisma-assist-mobile-checkpoints/motion-versions-2026-11-20/` contains the original V1 baseline; `v2-balanced-desktop-2026-11-20/` contains recovery data and `v2-natural-overlap-2026-11-20/` contains current duration/overlap QA, screenshots and recording. Tests use real Chrome browser rendering with automated pointer/keyboard input; physical devices and other browsers are not covered. Native fractional scale/perspective interpolation can soften text during movement; all temporary transforms and filters are removed at rest.
