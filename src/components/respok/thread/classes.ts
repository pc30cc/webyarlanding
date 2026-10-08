/**
 * Thread class recipes: the brand shapes, type scale and action styles, shared by the
 * components in ui.tsx and the pages.
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Tail classes, so every surface uses exactly the brand's geometry. Logical corners:
 * question = bottom-start, answer = bottom-end, so right-to-left content mirrors the
 * tails as the brand book asks (identical to bottom-left / bottom-right in English).
 */
export const SHAPE = {
  question: "rounded-full rounded-es-[4px]",
  answer: "rounded-full rounded-ee-[4px]",
  questionCard: "rounded-[28px] rounded-es-[6px]",
  answerCard: "rounded-[28px] rounded-ee-[6px]",
  /** Smaller cards (menus, fields, chips that may wrap). */
  questionSoft: "rounded-[22px] rounded-es-[6px]",
  answerSoft: "rounded-[22px] rounded-ee-[6px]",
} as const;

export type ActionVariant = "primary" | "secondary" | "ghost" | "outline" | "text";
export type ActionSize = "sm" | "md" | "lg";

const ACTION_BASE =
  "group/action inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-200 ease-rpk-spring select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const ACTION_VARIANT: Record<ActionVariant, string> = {
  /** Answer pill: Signal, Ink text, tail bottom-right. */
  primary: cx(
    SHAPE.answer,
    "bg-rpk-signal text-rpk-ink hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgb(211_54_26/0.7)] active:translate-y-0 active:scale-[.97]",
  ),
  /** Question pill: Ink, white text, tail bottom-left. */
  secondary: cx(
    SHAPE.question,
    "bg-rpk-ink text-white hover:-translate-y-px hover:shadow-[0_10px_24px_-12px_rgb(22_20_43/0.7)] active:translate-y-0 active:scale-[.97]",
  ),
  ghost: "rounded-full text-rpk-ink hover:bg-rpk-paper active:scale-[.97]",
  outline: cx(
    SHAPE.question,
    "bg-white text-rpk-ink ring-1 ring-rpk-mist ring-inset hover:bg-rpk-paper active:scale-[.97]",
  ),
  text: "rounded-md text-rpk-ink underline-offset-4 hover:text-rpk-signal-deep",
};

const ACTION_SIZE: Record<ActionSize, string> = {
  sm: "h-10 px-4 text-[14px]",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-7 text-[16px]",
};

export function actionClass(
  variant: ActionVariant = "primary",
  size: ActionSize = "md",
  className?: string,
): string {
  return cx(
    ACTION_BASE,
    ACTION_VARIANT[variant],
    variant === "text" ? "min-h-11 text-[15px]" : ACTION_SIZE[size],
    className,
  );
}

/** Pill chip, e.g. a category filter or a tag. */
export function chipClass(active = false, className?: string): string {
  return cx(
    "inline-flex min-h-10 items-center gap-2 px-4 text-[14px] font-semibold transition-colors duration-200",
    active
      ? cx(SHAPE.question, "bg-rpk-ink text-white")
      : cx("rounded-full bg-white text-rpk-ink ring-1 ring-rpk-mist ring-inset hover:bg-rpk-paper"),
    className,
  );
}

export const TYPE = {
  display:
    "break-words font-extrabold text-[44px] leading-[1.02] tracking-[-0.03em] sm:text-[60px] lg:text-[72px] lg:tracking-[-0.035em]",
  /** Long page titles. */
  displayMd:
    "break-words font-extrabold text-[38px] leading-[1.04] tracking-[-0.03em] sm:text-[52px] lg:text-[60px] lg:tracking-[-0.032em]",
  h2: "break-words font-bold text-[30px] leading-[1.12] tracking-[-0.02em] sm:text-[36px]",
  h3: "font-bold text-[20px] leading-[1.25] tracking-[-0.01em]",
  lede: "text-[18px] leading-[1.55] text-rpk-slate sm:text-[20px]",
  body: "text-[16px] leading-[1.6] text-rpk-slate sm:text-[17px]",
} as const;
