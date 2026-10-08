/**
 * Thread choreography that the global stylesheet does not cover: the hero's scripted
 * exchange, the "new reply" launcher motion, the chat stage and the channel marquee.
 * All values come from the brand kit (answer slide 360ms cubic-bezier(.3,1.4,.5,1),
 * panel rise 16px + .96 → 1 in 240ms, badge pop). The server HTML is always the
 * finished state; only elements the client arms are hidden before they play.
 * Reduced motion: no transforms, quick fades (and the stage never arms).
 */
const CSS = `
@keyframes tt-blip{0%{opacity:0;transform:translateX(28px)}16%{opacity:1;transform:translateX(-4px)}26%{opacity:1;transform:none}84%{opacity:1;transform:none}100%{opacity:0;transform:scale(.94)}}
@keyframes tt-answer{0%{opacity:0;transform:translateX(34px)}70%{opacity:1;transform:translateX(-6px)}100%{opacity:1;transform:none}}
@keyframes tt-pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:none}}
@keyframes tt-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes tt-opacity{from{opacity:0}to{opacity:1}}
.respok-thread .tt-hero-typing{animation:tt-blip 1100ms cubic-bezier(.2,.9,.25,1) 460ms both}
.respok-thread .tt-hero-answer{animation:tt-answer 360ms cubic-bezier(.3,1.4,.5,1) 1520ms both}
.respok-thread [data-stage=armed] .tt-st-accent{opacity:0}
.respok-thread [data-stage=armed] .tt-st-badge{transform:scale(0)}
.respok-thread :is([data-stage=play],[data-stage=launcher]) .tt-st-accent{animation:tt-answer 360ms cubic-bezier(.3,1.4,.5,1) var(--d,0ms) both}
.respok-thread :is([data-stage=play],[data-stage=launcher]) .tt-st-badge{animation:tt-pop 340ms cubic-bezier(.3,1.5,.5,1) calc(var(--d,0ms) + 80ms) both}
.respok-thread [data-stage=play] :is(.tt-st-accent,.tt-st-badge){--d:450ms}
.respok-thread [data-stage=launcher] :is(.tt-st-accent,.tt-st-badge){--d:1900ms}
.respok-thread .tt-marquee{animation:tt-marquee 56s linear infinite}
.respok-thread .tt-marquee-wrap:is(:hover,:focus-within) .tt-marquee,.respok-thread .tt-marquee-wrap[data-paused=true] .tt-marquee{animation-play-state:paused}
.respok-thread .tt-faq-answer{animation:tt-answer 360ms cubic-bezier(.3,1.4,.5,1) both}
@media (prefers-reduced-motion:reduce){
.respok-thread .tt-hero-typing{display:none}
.respok-thread :is(.tt-hero-answer,.tt-faq-answer){animation-name:tt-opacity}
.respok-thread .tt-marquee{animation:none}
.respok-thread .tt-marquee-dup{display:none}
.respok-thread .tt-marquee-wrap{overflow-x:auto}
}
`;

/** Keyframes for the pages that use the choreography above (rendered once per page). */
export function ThreadMotion() {
  return <style dangerouslySetInnerHTML={{ __html: CSS.replace(/\n/g, "") }} />;
}
