/**
 * Thread design system — "The Conversation".
 *
 * Two message shapes carry the whole brand: the visitor's question (Ink pill, tail
 * bottom-left 4px) and Respok's answer (Signal pill, Ink text, tail bottom-right 4px).
 * Long answers become white answer cards (radius 28, tail bottom-right 6px). Everything
 * else on the page — buttons, chips, menus, fields — is built from those shapes.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCheck, type LucideIcon } from "lucide-react";
import { RESPOK_SYMBOL } from "../RespokLogo";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Shapes ─────────────────────────────────────────────────────────────── */

/** Tail classes, so every surface uses exactly the brand's geometry. */
export const SHAPE = {
  question: "rounded-full rounded-bl-[4px]",
  answer: "rounded-full rounded-br-[4px]",
  questionCard: "rounded-[28px] rounded-bl-[6px]",
  answerCard: "rounded-[28px] rounded-br-[6px]",
  /** Smaller cards (menus, fields, chips that may wrap). */
  questionSoft: "rounded-[22px] rounded-bl-[6px]",
  answerSoft: "rounded-[22px] rounded-br-[6px]",
} as const;

/* ── Layout ─────────────────────────────────────────────────────────────── */

export function Container({
  className,
  children,
  wide = false,
}: {
  className?: string;
  children?: ReactNode;
  /** 1280 instead of 1152 */
  wide?: boolean;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        wide ? "max-w-7xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** DM Mono metadata: eyebrows, specs, counters. */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: "slate" | "ink" | "light";
}) {
  return (
    <Tag
      className={cx(
        "font-rpk-mono text-[12px] leading-[1.5] tracking-[0.08em] uppercase sm:text-[13px]",
        tone === "slate" && "text-rpk-slate",
        tone === "ink" && "text-rpk-ink",
        tone === "light" && "text-white/70",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Chat timestamp — decorative, hidden from assistive tech. */
export function Timestamp({
  children,
  className,
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  tone?: "slate" | "light";
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "font-rpk-mono text-[12px] leading-none tracking-[0.04em] tabular-nums",
        tone === "slate" ? "text-rpk-slate" : "text-white/60",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Read receipt: two ticks, decorative. */
export function ReadTicks({ className }: { className?: string }) {
  return (
    <CheckCheck aria-hidden="true" strokeWidth={2.4} className={cx("size-4 shrink-0", className)} />
  );
}

/** Three dots, the "someone is typing" indicator. */
export function TypingDots({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "slate" | "white";
}) {
  const dot = cx(
    "tt-typing-dot block size-[8px] rounded-full",
    tone === "ink" && "bg-rpk-ink",
    tone === "slate" && "bg-rpk-slate",
    tone === "white" && "bg-white",
  );
  return (
    <span aria-hidden="true" className={cx("inline-flex items-center gap-[5px]", className)}>
      <span className={dot} />
      <span className={dot} />
      <span className={dot} />
    </span>
  );
}

/* ── Message pills ──────────────────────────────────────────────────────── */

type PillSize = "sm" | "md" | "lg" | "xl";

const PILL_SIZE: Record<PillSize, string> = {
  sm: "min-h-8 px-3.5 py-1.5 text-[13px] leading-[1.3]",
  md: "min-h-11 px-5 py-2.5 text-[15px] leading-[1.35]",
  lg: "min-h-12 px-6 py-3 text-[16px] leading-[1.35] sm:min-h-14 sm:px-7 sm:text-[18px]",
  xl: "min-h-14 px-7 py-3.5 text-[18px] leading-[1.3] sm:min-h-16 sm:px-8 sm:text-[22px]",
};

/** The visitor's question: Ink, tail bottom-left. `tone="white"` on Ink bands. */
export function QuestionPill({
  children,
  size = "md",
  tone = "ink",
  as: Tag = "p",
  className,
}: {
  children: ReactNode;
  size?: PillSize;
  tone?: "ink" | "white";
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "inline-flex max-w-full items-center font-semibold",
        SHAPE.question,
        PILL_SIZE[size],
        tone === "ink" ? "bg-rpk-ink text-white" : "bg-white text-rpk-ink",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Respok's answer: Signal with Ink text, tail bottom-right. `away` = outline. */
export function AnswerPill({
  children,
  size = "md",
  away = false,
  as: Tag = "p",
  className,
}: {
  children: ReactNode;
  size?: PillSize;
  away?: boolean;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "inline-flex max-w-full items-center font-semibold text-rpk-ink",
        SHAPE.answer,
        PILL_SIZE[size],
        away ? "border-[1.5px] border-rpk-away bg-transparent" : "bg-rpk-signal",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Long answer: a white card with the answer's tail corner. */
export function AnswerCard({
  children,
  className,
  as: Tag = "div",
  tone = "white",
  id,
}: {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: "white" | "paper" | "soft";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cx(
        SHAPE.answerCard,
        tone === "white" && "bg-white shadow-rpk-card",
        tone === "paper" && "bg-rpk-paper ring-1 ring-rpk-mist",
        tone === "soft" && "bg-rpk-signal-soft",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Rare long question: an Ink card with the question's tail corner. */
export function QuestionCard({
  children,
  className,
  as: Tag = "div",
}: {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={cx(SHAPE.questionCard, "bg-rpk-ink text-white", className)}>{children}</Tag>
  );
}

/** The thin vertical line that ties a transcript together (desktop). */
export function ThreadLine({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("pointer-events-none absolute w-px bg-rpk-mist", className)}
    />
  );
}

/* ── Actions ────────────────────────────────────────────────────────────── */

export type ActionVariant = "primary" | "secondary" | "ghost" | "outline" | "text";
type ActionSize = "sm" | "md" | "lg";

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

function ArrowEnd() {
  return (
    <ArrowRight
      aria-hidden="true"
      strokeWidth={2.4}
      className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/action:translate-x-0.5"
    />
  );
}

interface ActionProps {
  variant?: ActionVariant;
  size?: ActionSize;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  onClick?: () => void;
}

/**
 * A link styled as an action. Internal paths ("/pricing") use the router; anything
 * else (signup URL, mailto:, tel:) is a plain anchor.
 */
export function ActionLink({
  href,
  hash,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  onClick,
  ...rest
}: ActionProps & { href: string; hash?: string }) {
  const classes = actionClass(variant, size, className);
  const body = (
    <>
      {children}
      {arrow && <ArrowEnd />}
    </>
  );
  if (href.startsWith("/") && !href.startsWith("//"))
    return (
      <Link to={href} {...(hash ? { hash } : {})} className={classes} onClick={onClick} {...rest}>
        {body}
      </Link>
    );
  return (
    <a href={href} className={classes} onClick={onClick} {...rest}>
      {body}
    </a>
  );
}

export const ActionButton = forwardRef<
  HTMLButtonElement,
  ActionProps & Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "onClick">
>(function ActionButton(
  {
    variant = "primary",
    size = "md",
    arrow = false,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button ref={ref} type={type} className={actionClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <ArrowEnd />}
    </button>
  );
});

/* ── Small pieces ───────────────────────────────────────────────────────── */

/** Icon in a soft pill-shaped holder. */
export function IconBadge({
  icon: Icon,
  tone = "paper",
  className,
}: {
  icon: LucideIcon;
  tone?: "paper" | "ink" | "signal" | "soft";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center",
        SHAPE.answer,
        tone === "paper" && "bg-rpk-paper text-rpk-ink",
        tone === "ink" && "bg-rpk-ink text-white",
        tone === "signal" && "bg-rpk-signal text-rpk-ink",
        tone === "soft" && "bg-rpk-signal-soft text-rpk-ink",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
    </span>
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

/** Mono badge, e.g. "3 articles" or a section number. */
export function Badge({
  children,
  className,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "ink" | "soft";
}) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center rounded-full px-3 font-rpk-mono text-[12px] tracking-[0.04em] uppercase",
        tone === "paper" && "bg-rpk-paper text-rpk-slate ring-1 ring-rpk-mist ring-inset",
        tone === "ink" && "bg-rpk-ink text-white",
        tone === "soft" && "bg-rpk-signal-soft text-rpk-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Type ───────────────────────────────────────────────────────────────── */

export const TYPE = {
  display:
    "font-extrabold text-[44px] leading-[1.02] tracking-[-0.03em] sm:text-[60px] lg:text-[72px] lg:tracking-[-0.035em]",
  h2: "font-bold text-[30px] leading-[1.12] tracking-[-0.02em] sm:text-[36px]",
  h3: "font-bold text-[20px] leading-[1.25] tracking-[-0.01em]",
  lede: "text-[18px] leading-[1.55] text-rpk-slate sm:text-[20px]",
  body: "text-[16px] leading-[1.6] text-rpk-slate sm:text-[17px]",
} as const;

/* ── Openers ────────────────────────────────────────────────────────────── */

/**
 * Every page opens like a conversation: the visitor's question arrives from the left,
 * Respok starts typing (the question pill and the typing pill draw the logo), and the
 * page title is the answer.
 */
export function PageOpener({
  question,
  time = "09:41",
  title,
  titleDir,
  lede,
  meta,
  children,
  className,
  aside,
}: {
  question: string;
  time?: string;
  title: ReactNode;
  titleDir?: "ltr" | "rtl";
  lede?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section className={cx("relative overflow-hidden bg-white", className)}>
      {!aside && <OpenerMark compact={!!children} />}
      <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div
          className={cx(
            !!aside &&
              "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-end lg:gap-16",
          )}
        >
          <div className={cx("min-w-0", !aside && "lg:max-w-[640px] xl:max-w-[760px]")}>
            <Conversation question={question} time={time} />
            <h1
              dir={titleDir}
              className={cx(TYPE.display, "mt-10 text-balance text-rpk-ink sm:mt-12")}
            >
              {title}
            </h1>
            {lede && <p className={cx(TYPE.lede, "mt-6 max-w-[42rem] text-pretty")}>{lede}</p>}
            {meta && <div className="mt-6">{meta}</div>}
            {children}
          </div>
          {aside && <div className="mt-12 lg:mt-0">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}

const MARK = RESPOK_SYMBOL.thread;
const MARK_ANSWER = "path" in MARK.accent ? MARK.accent.path : "";

/**
 * The Thread mark at architectural scale, in quiet tones, cropped by the right edge
 * of the opener (like the brand book cover).
 * `away`: the answer pill becomes an outline.
 */
export function OpenerMark({
  away = false,
  compact = false,
}: {
  away?: boolean;
  /** Smaller and pinned to the top, for openers with controls underneath. */
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute right-[-64px] hidden lg:block xl:right-[max(-64px,calc((100vw-1152px)/2-250px))]",
        compact ? "top-12" : "top-1/2 -translate-y-[46%]",
      )}
    >
      <div>
        <svg
          viewBox="-2 -2 108 96"
          focusable="false"
          className={cx(
            "block h-auto overflow-visible",
            compact ? "w-[300px] xl:w-[340px]" : "w-[340px] xl:w-[440px]",
          )}
        >
          <path d={MARK.main} fill="#E4E3EC" fillOpacity={0.55} />
          {away ? (
            <path d={MARK_ANSWER} fill="none" stroke="#A9A7BC" strokeWidth={0.6} />
          ) : (
            <>
              <path d={MARK_ANSWER} fill="#FFE3DC" />
              <circle cx="50" cy="71" r="2.6" fill="#FF5A3C" />
              <circle cx="63" cy="71" r="2.6" fill="#FF5A3C" opacity="0.7" />
              <circle cx="76" cy="71" r="2.6" fill="#FF5A3C" opacity="0.45" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

/** Question pill + typing answer pill: the logo, drawn with a real question. */
export function Conversation({
  question,
  time = "09:41",
  className,
  away = false,
  answer,
}: {
  question: string;
  time?: string;
  className?: string;
  /** Outline (away) answer pill instead of the Signal one. */
  away?: boolean;
  /** Replaces the typing dots. */
  answer?: ReactNode;
}) {
  return (
    <div className={cx("flex flex-col items-start", className)}>
      <div className="flex max-w-full items-end gap-3">
        <QuestionPill size="lg" className="tt-in-left">
          {question}
        </QuestionPill>
        <Timestamp className="mb-1.5 hidden sm:inline">{time}</Timestamp>
      </div>
      <div className="mt-2 ml-8 flex items-center gap-3 sm:ml-10">
        <AnswerPill as="span" size="lg" away={away} className="tt-in-right justify-center">
          {answer ?? <TypingDots tone="ink" className="tt-typing px-1" />}
        </AnswerPill>
      </div>
    </div>
  );
}

/** Section opener inside a page: optional question pill, mono eyebrow, title, lede. */
export function SectionHeader({
  question,
  eyebrow,
  title,
  lede,
  id,
  className,
  as: Heading = "h2",
}: {
  question?: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cx("max-w-3xl", className)}>
      {question && (
        <QuestionPill size="md" className="mb-6">
          {question}
        </QuestionPill>
      )}
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <Heading id={id} className={cx(TYPE.h2, "text-balance text-rpk-ink")}>
        {title}
      </Heading>
      {lede && <p className={cx(TYPE.body, "mt-4 max-w-2xl")}>{lede}</p>}
    </div>
  );
}

/* ── Forms ──────────────────────────────────────────────────────────────── */

const FIELD_BASE =
  "block w-full bg-white px-5 text-[16px] text-rpk-ink ring-1 ring-rpk-mist ring-inset transition-[box-shadow,background-color] duration-200 placeholder:text-rpk-slate/70 hover:ring-rpk-haze focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rpk-signal-deep";

export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx("mb-2 block text-[14px] font-semibold text-rpk-ink", className)}
    >
      {children}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-2 text-[14px] leading-[1.4] font-medium text-rpk-signal-deep"
    >
      <span
        aria-hidden="true"
        className="mt-[5px] inline-block h-2 w-3 shrink-0 rounded-full rounded-br-[2px] bg-rpk-signal-deep"
      />
      {children}
    </p>
  );
}

export const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(FIELD_BASE, "h-12 rounded-full", className)} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  function TextArea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cx(
          FIELD_BASE,
          "min-h-40 resize-y py-4 leading-[1.55]",
          SHAPE.questionSoft,
          className,
        )}
        {...rest}
      />
    );
  },
);
