/** Stage choreography helpers (see motion.tsx for the keyframes). */
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** `--d` is the animation delay used by the stage choreography (motion.ts). */
export type DelayStyle = CSSProperties & { "--d"?: string };

export function delay(ms: number): DelayStyle {
  return { "--d": `${ms}ms` };
}

export type StageState = "static" | "armed" | "play" | "launcher";

/**
 * Plays a stage when it scrolls into view. Server render and reduced motion: "static"
 * (the finished picture). Already on screen at hydration: only the launcher's
 * decorative "new reply" plays, so no readable content flickers.
 */
export function useStage<T extends HTMLElement>({
  play = 1200,
  launcher = 2600,
}: {
  /** ms until the "play" choreography has finished */
  play?: number;
  /** ms until the "launcher" choreography has finished */
  launcher?: number;
} = {}) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<StageState>("static");

  // Once the motion has played, settle back to the static picture.
  useEffect(() => {
    if (state !== "play" && state !== "launcher") return;
    const timer = window.setTimeout(() => setState("static"), state === "play" ? play : launcher);
    return () => window.clearTimeout(timer);
  }, [state, play, launcher]);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setState("launcher");
      return;
    }
    setState("armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("play");
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, state] as const;
}
