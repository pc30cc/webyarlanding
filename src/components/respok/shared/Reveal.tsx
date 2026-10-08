import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export type RevealEffect =
  /** fade in while rising 16px (default) */
  | "rise"
  /** Thread: the visitor's question arrives from the left */
  | "from-left"
  /** Thread: the answer slides in from the right with a small overshoot */
  | "from-right"
  /** Open: grow out of the bottom-right corner, like the chat panel */
  | "corner"
  /** Open: the dot pops 0.2 → 1.35 → 1 */
  | "pop"
  | "fade";

const HIDDEN: Record<RevealEffect, CSSProperties> = {
  rise: { opacity: 0, transform: "translateY(16px)" },
  "from-left": { opacity: 0, transform: "translateX(-28px)" },
  "from-right": { opacity: 0, transform: "translateX(36px)" },
  corner: { opacity: 0, transform: "scale(0.2)", transformOrigin: "100% 100%" },
  pop: { opacity: 0, transform: "scale(0.2)" },
  fade: { opacity: 0 },
};

const EASING: Record<RevealEffect, string> = {
  rise: "cubic-bezier(.2,.9,.25,1)",
  "from-left": "cubic-bezier(.2,.9,.25,1)",
  "from-right": "cubic-bezier(.3,1.4,.5,1)",
  corner: "cubic-bezier(.2,.9,.25,1)",
  pop: "cubic-bezier(.3,1.5,.5,1)",
  fade: "ease",
};

const DURATION: Record<RevealEffect, number> = {
  rise: 520,
  "from-left": 420,
  "from-right": 360,
  corner: 280,
  pop: 360,
  fade: 400,
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Scroll-triggered entrance that never hides content in the server HTML: elements
 * render visible, and only those still below the fold after hydration are hidden and
 * then animated in when they scroll into view. Reduced motion → no animation.
 */
export function Reveal({
  as: Tag = "div",
  effect = "rise",
  delay = 0,
  className,
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  effect?: RevealEffect;
  /** ms */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  role?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"ssr" | "hidden" | "shown">("ssr");

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) {
      setState("shown");
      return;
    }
    const limit = () => window.innerHeight * 0.92;
    // Already on screen at hydration: leave it exactly as rendered.
    if (node.getBoundingClientRect().top < limit()) {
      setState("shown");
      return;
    }
    setState("hidden");
    // Measure the element's real box, not the scaled/shifted hidden one, so a tiny
    // "corner" or "pop" start state can never stay hidden off screen.
    const realTop = () => {
      const rect = node.getBoundingClientRect();
      if (effect === "corner") return rect.bottom - rect.height / 0.2;
      if (effect === "pop") return rect.top + rect.height / 2 - rect.height / 0.4;
      if (effect === "rise") return rect.top - 16;
      return rect.top;
    };
    let frame = 0;
    const check = () => {
      frame = 0;
      if (realTop() < limit()) {
        setState("shown");
        stop();
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    const stop = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return stop;
  }, [effect]);

  const motionStyle: CSSProperties =
    state === "hidden"
      ? HIDDEN[effect]
      : state === "shown"
        ? {
            opacity: 1,
            transform: "none",
            transformOrigin: HIDDEN[effect].transformOrigin,
            transition: `opacity ${DURATION[effect]}ms ease ${delay}ms, transform ${DURATION[effect]}ms ${EASING[effect]} ${delay}ms`,
          }
        : {};

  return (
    <Tag ref={ref} className={className} style={{ ...style, ...motionStyle }} {...rest}>
      {children}
    </Tag>
  );
}
