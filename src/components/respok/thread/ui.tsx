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
import { ArrowRight, Check, CheckCheck, type LucideIcon } from "lucide-react";
import { RESPOK_SYMBOL } from "../RespokLogo";
import { SHAPE, TYPE, actionClass, cx, type ActionSize, type ActionVariant } from "./classes";
import { Reveal } from "../shared/Reveal";

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
  "aria-labelledby": labelledBy,
}: {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: "white" | "paper" | "soft";
  id?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
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

/* ── Actions ────────────────────────────────────────────────────────────── */

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

/* ── Openers ────────────────────────────────────────────────────────────── */

/**
 * Every page opens like a conversation: the visitor's question arrives from the left,
 * Respok starts typing (the question pill and the typing pill draw the logo), and the
 * page title is the answer.
 */
export function PageOpener({
  question,
  eyebrow,
  title,
  lede,
  meta,
  before,
  aside,
  children,
  className,
}: {
  question: ReactNode;
  /** Mono label above the title (outside the h1). */
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  meta?: ReactNode;
  /** Above the conversation, e.g. a breadcrumb or a back link. */
  before?: ReactNode;
  /** Right column on desktop (replaces the decorative mark). */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const text = (
    <div className={cx(!aside && "lg:max-w-[640px] xl:max-w-[760px]")}>
      {before && <div className="mb-8 sm:mb-10">{before}</div>}
      <Conversation question={question} />
      <div className="mt-10 sm:mt-12">
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h1 className={cx(TYPE.display, "text-balance text-rpk-ink")}>{title}</h1>
      </div>
      {lede && <p className={cx(TYPE.lede, "mt-6 max-w-[42rem] text-pretty")}>{lede}</p>}
      {meta && <div className="mt-6">{meta}</div>}
    </div>
  );
  return (
    <section className={cx("relative overflow-hidden bg-white", className)}>
      {!aside && <OpenerMark compact={!!children} />}
      <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        {aside ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-16">
            {text}
            <div className="min-w-0">{aside}</div>
          </div>
        ) : (
          text
        )}
        {children}
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

/**
 * The mark's geometry with real content: the question sits left, the answer sits
 * right, 8px below, and always reaches past the question's end (logo: 62 / 82 wide,
 * overlapping by 40). Works for any text length.
 */
export function Exchange({
  question,
  answer,
  className,
}: {
  question: ReactNode;
  answer: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cx("flex w-fit max-w-full flex-col items-start gap-2", className)}>
      <div className="mr-10 max-w-[calc(100%-2.5rem)] sm:mr-14 sm:max-w-[calc(100%-3.5rem)]">
        {question}
      </div>
      <div className="ml-10 max-w-[calc(100%-2.5rem)] self-end sm:ml-14 sm:max-w-[calc(100%-3.5rem)]">
        {answer}
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
  question: ReactNode;
  time?: string;
  className?: string;
  /** Outline (away) answer pill instead of the Signal one. */
  away?: boolean;
  /** Replaces the typing dots. */
  answer?: ReactNode;
}) {
  return (
    <Exchange
      className={className}
      question={
        <div className="relative">
          <QuestionPill size="lg" className="tt-in-left">
            {question}
          </QuestionPill>
          <Timestamp className="absolute top-1/2 left-full ml-3 hidden -translate-y-1/2 sm:inline">
            {time}
          </Timestamp>
        </div>
      }
      answer={
        <AnswerPill
          as="span"
          size="lg"
          away={away}
          className="tt-in-right min-w-[104px] justify-center sm:min-w-[124px]"
        >
          {answer ?? <TypingDots tone="ink" className="tt-typing" />}
        </AnswerPill>
      }
    />
  );
}

/**
 * Section opener inside a page: the visitor's question pill (with an optional mono
 * label beside it, like a timestamp), a mono eyebrow, the title as the answer, a lede.
 */
export function SectionHeader({
  question,
  meta,
  eyebrow,
  title,
  lede,
  id,
  className,
  center = false,
  tone = "light",
  as: Heading = "h2",
}: {
  question?: string;
  /** Mono label next to the question pill. */
  meta?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
  className?: string;
  center?: boolean;
  /** "dark" on Ink bands. */
  tone?: "light" | "dark";
  as?: "h2" | "h3";
}) {
  const dark = tone === "dark";
  return (
    <div className={cx("max-w-3xl", center && "mx-auto text-center", className)}>
      {question && (
        <Reveal
          effect="from-left"
          className={cx(
            "mb-6 flex flex-wrap items-center gap-x-3 gap-y-2",
            center && "justify-center",
          )}
        >
          <QuestionPill size="md" tone={dark ? "white" : "ink"}>
            {question}
          </QuestionPill>
          {meta && (
            <span
              className={cx(
                "font-rpk-mono text-[12px] tracking-[0.08em] uppercase sm:text-[13px]",
                dark ? "text-white/60" : "text-rpk-slate",
              )}
            >
              {meta}
            </span>
          )}
        </Reveal>
      )}
      {eyebrow && (
        <Eyebrow className="mb-3" tone={dark ? "light" : "slate"}>
          {eyebrow}
        </Eyebrow>
      )}
      <Heading
        id={id}
        className={cx(TYPE.h2, "text-balance", dark ? "text-white" : "text-rpk-ink")}
      >
        {title}
      </Heading>
      {lede && (
        <p
          className={cx(
            TYPE.body,
            "mt-4 max-w-2xl text-pretty",
            center && "mx-auto",
            dark && "!text-white/70",
          )}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

/** A page band. `tone` sets the background; ids double as scroll targets. */
export function Section({
  id,
  tone = "white",
  className,
  children,
  labelledBy,
  label,
}: {
  id?: string;
  tone?: "white" | "paper" | "ink";
  className?: string;
  children?: ReactNode;
  labelledBy?: string;
  label?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={label}
      className={cx(
        "relative scroll-mt-24 py-20 sm:py-24 lg:py-28",
        tone === "white" && "bg-white",
        tone === "paper" && "bg-rpk-paper",
        tone === "ink" && "bg-rpk-ink text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Done / included: an Ink circle with a white check (success is Ink, never green). */
export function CheckDot({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "signal" | "white";
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
        tone === "ink" && "bg-rpk-ink text-white",
        tone === "signal" && "bg-rpk-signal text-rpk-ink",
        tone === "white" && "bg-white text-rpk-ink",
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3.2} />
    </span>
  );
}

/** Checklist with Ink check dots. */
export function CheckList({
  items,
  className,
  tone = "light",
  size = "md",
}: {
  items: ReactNode[];
  className?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  return (
    <ul className={cx(size === "sm" ? "space-y-2.5" : "space-y-3.5", className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cx(
            "flex items-start gap-3 leading-[1.5]",
            size === "sm" ? "text-[15px]" : "text-[16px]",
            tone === "dark" ? "text-white/85" : "text-rpk-ink",
          )}
        >
          <CheckDot
            tone={tone === "dark" ? "signal" : "ink"}
            className={size === "sm" ? "mt-[2px]" : "mt-[3px]"}
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Catalog / feature icon on an answer-pill tile. */
export function IconTile({
  icon: Icon,
  size = "md",
  tone = "paper",
  className,
}: {
  icon: LucideIcon;
  size?: "md" | "lg";
  tone?: "paper" | "ink" | "soft";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center",
        SHAPE.answer,
        size === "lg" ? "h-16 w-20" : "h-12 w-[60px]",
        tone === "paper" && "bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset",
        tone === "ink" && "bg-rpk-ink text-white",
        tone === "soft" && "bg-rpk-signal-soft text-rpk-ink",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-7" : "size-[22px]"} strokeWidth={2} />
    </span>
  );
}

/* ── Forms ──────────────────────────────────────────────────────────────── */

const FIELD_BASE =
  "block w-full bg-white px-5 text-[16px] text-rpk-ink ring-1 ring-rpk-mist ring-inset transition-[box-shadow,background-color] duration-200 placeholder:text-rpk-slate hover:ring-rpk-haze focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rpk-signal-deep";

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
