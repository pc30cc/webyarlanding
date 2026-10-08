/**
 * Open ("The Corner") design system. Every surface is the bubble from the logo: three
 * round corners and one nearly-square corner (bottom-right) that points at a Signal dot.
 * The dot means "live"; an empty Away ring means "nobody here".
 */
import { Link } from "@tanstack/react-router";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RESPOK_SYMBOL } from "../RespokLogo";
import { buttonClass, cx } from "./tokens";

/* ─── Shape ─────────────────────────────────────────────────────────────── */

/** Bubble radii, scaled with the size of the surface. Square corner = bottom-right. */
export const BUBBLE = {
  xs: "rounded-[12px] rounded-br-[3px]",
  sm: "rounded-[16px] rounded-br-[4px]",
  md: "rounded-[24px] rounded-br-[6px]",
  lg: "rounded-[32px] rounded-br-[6px]",
  xl: "rounded-[40px] rounded-br-[6px]",
  "2xl": "rounded-[56px] rounded-br-[8px]",
} as const;
export type BubbleSize = keyof typeof BUBBLE;

export type Surface = "ink" | "paper";

export function Container({
  as: Tag = "div",
  className,
  children,
  id,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10", className)}>
      {children}
    </Tag>
  );
}

/* ─── Dot ───────────────────────────────────────────────────────────────── */

export type DotTone = "signal" | "ink" | "white" | "away" | "away-ink";

const DOT_TONE: Record<DotTone, string> = {
  signal: "bg-rpk-signal",
  ink: "bg-rpk-ink",
  white: "bg-white",
  away: "border-2 border-rpk-away bg-transparent",
  "away-ink": "border-2 border-rpk-ink/40 bg-transparent",
};

/** The live dot. Decorative: meaning is always carried by text next to it. */
export function Dot({
  tone = "signal",
  size = 10,
  className,
}: {
  tone?: DotTone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block shrink-0 rounded-full", DOT_TONE[tone], className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * A dot sitting just outside the bubble's square corner, on the 45° axis, at the logo's
 * proportions (bounding box offset ≈ 1/12 of the dot). Parent must be `relative`.
 */
export function CornerDot({
  size = 16,
  tone = "signal",
  corner = "br",
  className,
}: {
  size?: number;
  tone?: DotTone;
  corner?: "br" | "tl" | "tr";
  className?: string;
}) {
  const offset = `calc(100% + ${Math.max(1, Math.round(size / 12))}px)`;
  const position: CSSProperties =
    corner === "br"
      ? { left: offset, top: offset }
      : corner === "tl"
        ? { right: offset, bottom: offset }
        : { left: offset, bottom: offset };
  return (
    <span
      aria-hidden="true"
      className={cx("pointer-events-none absolute rounded-full", DOT_TONE[tone], className)}
      style={{ width: size, height: size, ...position }}
    />
  );
}

/**
 * The logo's bubble drawn from the kit geometry (no wordmark). Used huge and cropped
 * behind Ink chapters, like the guideline cover. Color via `currentColor`.
 */
export function BubbleGlyph({
  dot,
  className,
  style,
}: {
  /** Draw the dot too: live (Signal), away (empty ring) or none. */
  dot?: "live" | "away" | "ink" | "white";
  className?: string;
  style?: CSSProperties;
}) {
  const symbol = RESPOK_SYMBOL.open;
  const accent = "circle" in symbol.accent ? symbol.accent.circle : ([96, 96, 12] as const);
  const [x, y, r] = accent;
  return (
    <svg
      viewBox={dot ? "0 0 108 108" : "0 0 82 82"}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={symbol.main} fill="currentColor" />
      {dot === "live" && <circle cx={x} cy={y} r={r} fill="#FF5A3C" />}
      {dot === "ink" && <circle cx={x} cy={y} r={r} fill="#16142B" />}
      {dot === "white" && <circle cx={x} cy={y} r={r} fill="#FFFFFF" />}
      {dot === "away" && (
        <circle cx={x} cy={y} r={r - 1.25} fill="none" stroke="#A9A7BC" strokeWidth={2.5} />
      )}
    </svg>
  );
}

/** Giant cropped background bubble for Ink chapters (rpk-ink-soft on Ink). */
export function GiantBubble({ className }: { className?: string }) {
  return (
    <BubbleGlyph
      className={cx("pointer-events-none absolute text-rpk-ink-soft select-none", className)}
    />
  );
}

/* ─── Type ──────────────────────────────────────────────────────────────── */

/** Mono eyebrow: "01 · LIVE CHAT". */
export function Eyebrow({
  index,
  children,
  surface = "paper",
  className,
  as: Tag = "p",
}: {
  index?: string;
  children: ReactNode;
  surface?: Surface;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cx(
        "font-rpk-mono text-[12px] leading-[1.5] tracking-[0.08em] uppercase sm:text-[13px]",
        surface === "ink" ? "text-white/65" : "text-rpk-slate",
        className,
      )}
    >
      {index ? (
        <>
          <span className={surface === "ink" ? "text-rpk-signal" : "text-rpk-ink"}>{index}</span>
          <span aria-hidden="true"> · </span>
        </>
      ) : null}
      {children}
    </Tag>
  );
}

export const DISPLAY =
  "font-extrabold tracking-[-0.035em] leading-[1.02] text-[44px] sm:text-[56px] lg:text-[72px]";
export const DISPLAY_SM =
  "font-extrabold tracking-[-0.03em] leading-[1.04] text-[40px] sm:text-[48px] lg:text-[60px]";
export const HEADING =
  "font-extrabold tracking-[-0.025em] leading-[1.08] text-[30px] sm:text-[36px] lg:text-[44px]";

/**
 * Paper-chapter section header in the brand-book "contents" pattern: mono label, a 2px
 * Ink rule, then the title and lede on a 12-column grid.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  id,
  surface = "paper",
  className,
  children,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
  surface?: Surface;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cx(
        "grid gap-x-10 gap-y-4 border-t-2 pt-5 md:grid-cols-12",
        surface === "ink" ? "border-white/80" : "border-rpk-ink",
        className,
      )}
    >
      <Eyebrow
        {...(index ? { index } : {})}
        surface={surface}
        className="md:col-span-4 lg:col-span-3"
      >
        {eyebrow}
      </Eyebrow>
      <div className="md:col-span-8 lg:col-span-9">
        <h2 id={id} className={cx(HEADING, surface === "ink" ? "text-white" : "text-rpk-ink")}>
          {title}
        </h2>
        {lede ? (
          <p
            className={cx(
              "mt-4 max-w-[60ch] text-[17px] leading-[1.55] sm:text-[18px]",
              surface === "ink" ? "text-white/72" : "text-rpk-slate",
            )}
          >
            {lede}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}

/* ─── Chapters ──────────────────────────────────────────────────────────── */

/**
 * Ink chapter that opens an inner page: running header like the brand book
 * ("RESPOK · SUPPORT ……… /help"), mono eyebrow, display title and lede, with a giant
 * cropped bubble bleeding off the right edge.
 */
export function ChapterHero({
  running,
  path,
  index = "01",
  eyebrow,
  title,
  titleDir,
  lede,
  ledeDir,
  children,
  size = "lg",
  className,
  bubble = "right",
  contentClassName,
}: {
  running: string;
  path: string;
  index?: string;
  eyebrow: string;
  title: ReactNode;
  titleDir?: "ltr" | "rtl";
  lede?: ReactNode;
  ledeDir?: "ltr" | "rtl";
  children?: ReactNode;
  size?: "lg" | "md";
  className?: string;
  bubble?: "right" | "none";
  /** Extra classes for the title block (e.g. to leave room for an overlapping panel). */
  contentClassName?: string;
}) {
  return (
    <section className={cx("relative isolate overflow-hidden bg-rpk-ink text-white", className)}>
      {bubble === "right" ? (
        <GiantBubble className="-right-[18%] top-[14%] -z-10 w-[min(760px,92vw)] sm:-right-[10%] lg:-right-[4%] lg:top-[10%] lg:w-[min(680px,52vw)]" />
      ) : null}
      <Container className={cx("relative", size === "lg" ? "pb-20 sm:pb-24" : "pb-14 sm:pb-16")}>
        <div className="flex items-center justify-between gap-4 border-b border-rpk-ink-line py-4 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
          <span className="truncate">{running}</span>
          <span className="shrink-0 normal-case">{path}</span>
        </div>
        <div
          className={cx(
            size === "lg" ? "pt-14 sm:pt-20 lg:pt-24" : "pt-12 sm:pt-16",
            contentClassName,
          )}
        >
          <Eyebrow index={index} surface="ink">
            {eyebrow}
          </Eyebrow>
          <h1
            dir={titleDir}
            className={cx(
              size === "lg" ? DISPLAY : DISPLAY_SM,
              "mt-5 max-w-[16ch] text-balance text-white",
            )}
          >
            {title}
          </h1>
          {lede ? (
            <p
              dir={ledeDir}
              className="mt-6 max-w-[58ch] text-[17px] leading-[1.6] text-white/72 sm:text-[19px]"
            >
              {lede}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}

/* ─── Actions ───────────────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "ink" | "secondary" | "ghost";

/** Trailing mark: the "on-signal" colorway puts an Ink dot on coral; Ink buttons get the Signal dot. */
function Trail({ variant, icon }: { variant: ButtonVariant; icon?: LucideIcon | "dot" }) {
  if (icon === "dot" || (!icon && (variant === "primary" || variant === "ink"))) {
    return (
      <span
        aria-hidden="true"
        className={cx(
          "size-2 rounded-full transition-transform duration-300 ease-rpk-pop group-hover/btn:scale-[1.35]",
          variant === "primary" ? "bg-rpk-ink" : "bg-rpk-signal",
        )}
      />
    );
  }
  const Icon = icon ?? ArrowRight;
  return (
    <Icon
      aria-hidden="true"
      className="size-[18px] transition-transform duration-200 ease-rpk-spring group-hover/btn:translate-x-1"
      strokeWidth={2}
    />
  );
}

function isExternal(href: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/i.test(href);
}

/**
 * Button-styled link. Internal paths use the router; absolute/mailto URLs use <a>.
 */
export function ActionLink({
  to,
  children,
  variant = "primary",
  surface = "paper",
  size = "md",
  icon,
  className,
  hash,
  ariaLabel,
  rel,
}: {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  surface?: Surface;
  size?: "md" | "lg" | "sm";
  icon?: LucideIcon | "dot";
  className?: string | undefined;
  hash?: string | undefined;
  ariaLabel?: string | undefined;
  rel?: string | undefined;
}) {
  const classes = cx(buttonClass(variant, surface, size), className);
  const content = (
    <>
      <span>{children}</span>
      <Trail variant={variant} {...(icon ? { icon } : {})} />
    </>
  );
  if (isExternal(to)) {
    return (
      <a href={to} className={classes} aria-label={ariaLabel} rel={rel}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to} {...(hash ? { hash } : {})} className={classes} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

/** Icon in a small bubble tile. */
export function IconTile({
  icon: Icon,
  tone = "ink",
  size = 48,
  className,
}: {
  icon: LucideIcon;
  tone?: "ink" | "paper" | "glass" | "signal";
  size?: number;
  className?: string;
}) {
  const tones = {
    ink: "bg-rpk-ink text-white",
    paper: "bg-rpk-paper text-rpk-ink",
    glass: "bg-white/[0.08] text-white",
    signal: "bg-rpk-signal text-rpk-ink",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-[16px] rounded-br-[4px]",
        tones[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="size-[45%]" strokeWidth={1.75} />
    </span>
  );
}

export function Badge({
  children,
  tone = "paper",
  className,
}: {
  children: ReactNode;
  tone?: "paper" | "ink" | "signal" | "glass";
  className?: string;
}) {
  const tones = {
    paper: "bg-rpk-mist text-rpk-ink",
    ink: "bg-rpk-ink text-white",
    signal: "bg-rpk-signal text-rpk-ink",
    glass: "bg-white/[0.08] text-white/85",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-[10px] rounded-br-[3px] px-2.5 py-1 font-rpk-mono text-[12px] leading-[1.35] tracking-[0.06em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─── Forms ─────────────────────────────────────────────────────────────── */

/** Label + control + inline error, wired with aria-describedby by the caller. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-semibold text-rpk-ink">
          {label}
        </label>
        {hint ? <span className="font-rpk-mono text-[12px] text-rpk-slate">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 flex items-center gap-2 text-[13px] font-medium text-rpk-signal-deep"
        >
          <Dot tone="signal" size={7} className="bg-rpk-signal-deep" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Surfaces ──────────────────────────────────────────────────────────── */

export function Card({
  as: Tag = "div",
  size = "lg",
  tone = "white",
  className,
  children,
  id,
  ...rest
}: {
  as?: ElementType;
  size?: BubbleSize;
  tone?: "white" | "ink" | "paper" | "raised";
  className?: string;
  children?: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const tones = {
    white: "bg-white text-rpk-ink shadow-[0_1px_0_rgb(22_20_43/0.04)]",
    ink: "bg-rpk-ink text-white",
    paper: "bg-rpk-paper text-rpk-ink",
    raised: "bg-rpk-ink-soft text-white",
  } as const;
  return (
    <Tag id={id} className={cx(BUBBLE[size], tones[tone], className)} {...rest}>
      {children}
    </Tag>
  );
}
