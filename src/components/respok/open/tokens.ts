/** Class helpers and small pure utilities for the Open template. */
import type { ButtonVariant, Surface } from "./ui";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Two-digit chapter numbers: 1 → "01". */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function buttonClass(
  variant: ButtonVariant,
  surface: Surface = "paper",
  size: "md" | "lg" | "sm" = "md",
): string {
  const base =
    "group/btn relative inline-flex max-w-full select-none items-center justify-center gap-3 whitespace-nowrap font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-rpk-spring active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 rounded-[22px] rounded-br-[6px]";
  const sizes = {
    sm: "h-11 px-4 text-[14px]",
    md: "h-12 px-6 text-[15px]",
    lg: "h-[52px] px-7 text-[16px]",
  } as const;
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-rpk-signal text-rpk-ink hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_rgb(255_90_60/0.9)]",
    ink: "bg-rpk-ink text-white hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_rgb(22_20_43/0.7)]",
    secondary:
      surface === "ink"
        ? "border border-white/25 text-white hover:-translate-y-px hover:border-white/60 hover:bg-white/[0.06]"
        : "border border-rpk-ink/20 bg-white/40 text-rpk-ink hover:-translate-y-px hover:border-rpk-ink/50 hover:bg-white",
  };
  return cx(base, sizes[size], variants[variant]);
}

/**
 * Inline text link. Ink text with a Signal underline on light surfaces: Signal Deep text
 * is only 4.48:1 on Paper (large text only, per the brand book). White on Ink.
 */
export function textLinkClass(surface: Surface = "paper"): string {
  return surface === "ink"
    ? "rounded-[4px] text-white underline decoration-white/35 decoration-[1.5px] underline-offset-[5px] transition-colors hover:decoration-rpk-signal"
    : "rounded-[4px] font-semibold text-rpk-ink underline decoration-rpk-signal decoration-2 underline-offset-[5px] transition-[text-decoration-color] hover:decoration-rpk-ink";
}

export function inputClass(invalid: boolean, extra?: string): string {
  return cx(
    "block w-full rounded-[16px] rounded-br-[4px] border bg-white px-4 text-[16px] text-rpk-ink transition-[border-color,box-shadow] duration-150 placeholder:text-rpk-slate outline-none",
    invalid
      ? "border-rpk-signal-deep"
      : "border-rpk-ink/15 hover:border-rpk-ink/35 focus:border-rpk-ink",
    extra,
  );
}

/** Splits "1. Introduction" into ("01", "Introduction"). */
export function splitNumbered(title: string, fallback: number): { n: string; text: string } {
  const match = /^(\d+)\.\s*(.*)$/.exec(title);
  if (match) return { n: pad(Number(match[1])), text: match[2] ?? title };
  return { n: pad(fallback), text: title };
}

/** URL-safe anchor id from a heading. */
export function anchorId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

const DISPLAY_SIZE = {
  lg: "text-[44px] sm:text-[56px] lg:text-[72px]",
  md: "text-[40px] sm:text-[48px] lg:text-[60px]",
} as const;

/**
 * Display title classes. Latin: tight Figtree 800 at line-height ~1.0. Persian/Arabic
 * titles (blog posts) get no negative tracking (it breaks letter joining) and a taller
 * line for the script's ascenders and dots.
 */
export function displayClass(size: "lg" | "md", dir?: "ltr" | "rtl"): string {
  return cx(
    "font-extrabold break-words",
    DISPLAY_SIZE[size],
    dir === "rtl"
      ? "leading-[1.35] tracking-normal"
      : size === "lg"
        ? "leading-[1.02] tracking-[-0.035em]"
        : "leading-[1.04] tracking-[-0.03em]",
  );
}

/* ─── Grids that never leave holes ─────────────────────────────────────── */

/**
 * Splits n cards into rows of at most `perRow`, as evenly as possible (10 → 3·3·2·2),
 * so a list shortened by the call/AI switches still fills every row.
 */
export function balancedRows(n: number, perRow: number): number[] {
  if (n <= 0) return [];
  const rows = Math.ceil(n / Math.max(1, perRow));
  const base = Math.floor(n / rows);
  const extra = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}

const LG_SPAN: Record<number, string> = {
  1: "lg:col-span-12",
  2: "lg:col-span-6",
  3: "lg:col-span-4",
  4: "lg:col-span-3",
};

/**
 * Column classes for a `grid sm:grid-cols-2 lg:grid-cols-12` list of n cards: rows of up
 * to `perRow` cards on desktop, two per row on tablets (an odd last card spans both).
 */
export function balancedSpans(n: number, perRow = 3): string[] {
  const spans: string[] = [];
  for (const size of balancedRows(n, perRow)) {
    for (let i = 0; i < size; i++) spans.push(LG_SPAN[size] ?? "lg:col-span-4");
  }
  return spans.map((span, index) =>
    n % 2 === 1 && index === n - 1 ? `${span} sm:col-span-2` : span,
  );
}

export const BALANCED_GRID = "grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12 lg:gap-6";
