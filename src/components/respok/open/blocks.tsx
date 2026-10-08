/**
 * Page blocks shared by the Open pages: index rows (like the brand book's contents page),
 * the closing CTA bubble with its dot outside the square corner, and the empty state.
 */
import type { ReactNode } from "react";
import { Reveal } from "../shared/Reveal";
import { BubbleGlyph, Card, Dot, Eyebrow, GiantBubble, type Surface } from "./ui";
import { cx, pad } from "./tokens";

/**
 * "01 ●  Title — body" rows with hairlines. The dot is the bullet: an outline at rest,
 * Signal (and 4 px further right) on hover.
 */
export function IndexRows({
  items,
  surface = "paper",
  headingLevel = 3,
  className,
  start = 1,
}: {
  items: { title: string; body?: string | undefined }[];
  surface?: Surface;
  headingLevel?: 3 | 4;
  className?: string;
  start?: number;
}) {
  const ink = surface === "ink";
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ol className={cx("border-t", ink ? "border-rpk-ink-line" : "border-rpk-mist", className)}>
      {items.map((item, index) => (
        <li
          key={item.title}
          className={cx(
            "group/row grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 border-b py-5 sm:grid-cols-[56px_minmax(0,1fr)] sm:py-6",
            ink ? "border-rpk-ink-line" : "border-rpk-mist",
          )}
        >
          <span className="flex items-center gap-2.5 self-start pt-[5px]">
            <span
              aria-hidden="true"
              className={cx(
                "font-rpk-mono text-[12px] tracking-[0.06em]",
                ink ? "text-white/55" : "text-rpk-slate",
              )}
            >
              {pad(index + start)}
            </span>
            <Dot
              size={8}
              tone={ink ? "away" : "away-ink"}
              className="transition-[transform,background-color,border-color] duration-300 ease-rpk-pop group-hover/row:translate-x-1 group-hover/row:border-rpk-signal group-hover/row:bg-rpk-signal"
            />
          </span>
          <div className="min-w-0">
            <Heading
              className={cx(
                "text-[18px] leading-[1.3] font-bold tracking-[-0.01em] sm:text-[19px]",
                ink ? "text-white" : "text-rpk-ink",
              )}
            >
              {item.title}
            </Heading>
            {item.body ? (
              <p
                className={cx(
                  "mt-1.5 max-w-[56ch] text-[16px] leading-[1.6]",
                  ink ? "text-white/70" : "text-rpk-slate",
                )}
              >
                {item.body}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The closing bubble: an Ink bubble on Paper with the Signal dot just outside its square
 * corner; it grows out of that corner when it scrolls into view, then the dot pops.
 */
export function CtaBubble({
  eyebrow,
  index,
  title,
  titleId,
  body,
  actions,
  size = "lg",
  lead,
}: {
  eyebrow?: string;
  index?: string;
  title: ReactNode;
  titleId?: string;
  body?: ReactNode;
  actions: ReactNode;
  size?: "lg" | "md";
  /** Content above the eyebrow, e.g. the visitor's question. */
  lead?: ReactNode;
}) {
  const big = size === "lg";
  return (
    <div className="relative mr-6 sm:mr-9">
      <Reveal effect="corner">
        <Card
          tone="ink"
          size={big ? "2xl" : "xl"}
          className={cx(
            "relative isolate overflow-hidden",
            big ? "px-7 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-24" : "p-8 sm:p-12 lg:p-14",
          )}
        >
          {big ? (
            <GiantBubble size="md" />
          ) : (
            <BubbleGlyph className="absolute -top-[46%] right-[4%] -z-10 hidden w-[300px] text-rpk-ink-soft lg:block" />
          )}
          <div
            className={cx(big ? "max-w-[880px]" : "lg:grid lg:grid-cols-12 lg:items-end lg:gap-10")}
          >
            <div className={big ? "" : "lg:col-span-8"}>
              {lead}
              {eyebrow ? (
                <Eyebrow surface="ink" {...(index ? { index } : {})}>
                  {eyebrow}
                </Eyebrow>
              ) : null}
              <h2
                id={titleId}
                className={cx(
                  "font-extrabold text-balance text-white",
                  eyebrow ? "mt-5" : "",
                  big
                    ? "text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[56px] lg:text-[76px]"
                    : "text-[30px] leading-[1.08] tracking-[-0.025em] sm:text-[38px]",
                )}
              >
                {title}
              </h2>
              {body ? (
                <p
                  className={cx(
                    "max-w-[52ch] text-white/72",
                    big
                      ? "mt-6 text-[18px] leading-[1.55] sm:text-[20px]"
                      : "mt-4 text-[17px] leading-[1.6]",
                  )}
                >
                  {body}
                </p>
              ) : null}
            </div>
            <div
              className={cx(
                "flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap",
                big ? "mt-10" : "mt-8 lg:col-span-4 lg:mt-0 lg:justify-end",
              )}
            >
              {actions}
            </div>
          </div>
        </Card>
      </Reveal>
      <PoppingCornerDot size={big ? 32 : 22} />
    </div>
  );
}

/**
 * CornerDot that pops (0.2 → 1.35 → 1) once its bubble has grown into view. Parent must
 * be `relative` and the size of the bubble.
 */
export function PoppingCornerDot({ size, delay = 240 }: { size: number; delay?: number }) {
  const offset = `calc(100% + ${Math.max(1, Math.round(size / 12))}px)`;
  return (
    <Reveal
      effect="pop"
      delay={delay}
      className="pointer-events-none absolute rounded-full bg-rpk-signal"
      style={{ left: offset, top: offset, width: size, height: size }}
    />
  );
}

/** Nothing to show yet: the bubble with its dot as an empty "away" ring. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="relative mr-6 max-w-[720px]">
      <Card className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
        <BubbleGlyph dot="away" className="w-20 shrink-0 text-rpk-mist" />
        <div>
          <h2 className="text-[24px] leading-[1.2] font-bold tracking-[-0.01em]">{title}</h2>
          {children}
        </div>
      </Card>
    </div>
  );
}
