/**
 * The Respok chat widget, drawn exactly as the brand kit ships it (launcher CSS and the
 * "chat widget on a website" image): Ink launcher with the Thread glyph, Signal Deep
 * unread badge, the 24px panel with a 6px tail corner, white agent bubbles and Ink
 * visitor bubbles (radius 21, tail 4), composer and "Powered by".
 *
 * Everything here is illustration: aria-hidden by the caller, never interactive.
 */
import type { CSSProperties, ReactNode } from "react";
import { ArrowUp, ChevronDown } from "lucide-react";
import { RESPOK_SYMBOL, RespokLogo } from "../RespokLogo";
import { cx } from "./classes";
import { TypingDots } from "./ui";

const GLYPH = RESPOK_SYMBOL.thread;
const GLYPH_ANSWER = "path" in GLYPH.accent ? GLYPH.accent.path : "";

/** Floating chat button: 60 × 60 Ink circle, glyph 50%, optional unread badge. */
export function Launcher({
  unread,
  size = 60,
  className,
  accentClassName,
  badgeClassName,
}: {
  unread?: number;
  size?: number;
  className?: string;
  accentClassName?: string;
  badgeClassName?: string;
}) {
  return (
    <span
      className={cx("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-full bg-rpk-ink shadow-rpk-launcher">
        <svg viewBox="0 0 104 92" focusable="false" className="block h-auto w-1/2 overflow-visible">
          <path d={GLYPH.main} fill="#FFFFFF" />
          <path d={GLYPH_ANSWER} fill="#FF5A3C" className={accentClassName} />
        </svg>
      </span>
      {unread !== undefined && (
        <span
          className={cx(
            "absolute -top-[3px] -right-[3px] h-[22px] min-w-[22px] rounded-[11px] border-2 border-white bg-rpk-signal-deep px-1.5 text-center text-[12px] leading-[18px] font-bold text-white",
            badgeClassName,
          )}
        >
          {unread}
        </span>
      )}
    </span>
  );
}

/** A chat bubble inside the panel: agent = white on the left, visitor = Ink on the right. */
export function Bubble({
  from,
  children,
  className,
  style,
}: {
  from: "agent" | "visitor";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cx(
        "max-w-[84%] px-[15px] py-[11px] text-[15px] leading-[1.45] break-words",
        from === "agent"
          ? "self-start rounded-[21px] rounded-es-[4px] bg-white text-rpk-ink shadow-[0_1px_0_#E4E3EC]"
          : "self-end rounded-[21px] rounded-ee-[4px] bg-rpk-ink text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Agent typing indicator bubble. */
export function TypingBubble({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      style={style}
      className={cx(
        "flex w-fit items-center self-start rounded-[21px] rounded-es-[4px] bg-white px-4 py-[15px] shadow-[0_1px_0_#E4E3EC]",
        className,
      )}
    >
      <TypingDots tone="slate" className="tt-typing" />
    </div>
  );
}

/** The open chat panel: header, conversation, composer, Powered by. */
export function ChatPanel({
  agent,
  status,
  today,
  composer,
  poweredBy,
  children,
  className,
  bodyClassName,
}: {
  agent: string;
  status: string;
  today: string;
  composer: string;
  poweredBy: string;
  /** Bubbles. */
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-[24px] rounded-ee-[6px] bg-white shadow-rpk-panel",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-rpk-ink py-4 pr-2.5 pl-5 text-white">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white">
          <RespokLogo concept="thread" variant="symbol" height={18} title="" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-[16px] leading-[1.25] font-bold">{agent}</span>
          <span className="flex items-center gap-[7px] text-[13px] leading-[1.3] text-white/80">
            <span className="size-2 shrink-0 rounded-full bg-rpk-signal" />
            <span className="truncate">{status}</span>
          </span>
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-[12px]">
          <ChevronDown className="size-[22px]" strokeWidth={2.4} />
        </span>
      </div>
      <div
        className={cx(
          "flex flex-1 flex-col gap-2.5 bg-rpk-paper px-4 pt-[18px] pb-4",
          bodyClassName,
        )}
      >
        <span className="self-center pb-1 text-[12px] text-rpk-slate">{today}</span>
        {children}
      </div>
      <div className="flex items-center gap-2 border-t border-rpk-mist bg-white py-2 pr-2.5 pl-[18px]">
        <span className="flex h-11 min-w-0 flex-1 items-center truncate text-[15px] text-rpk-slate">
          {composer}
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rpk-ink/40 text-white">
          <ArrowUp className="size-5" strokeWidth={2.4} />
        </span>
      </div>
      <div className="flex items-center justify-center gap-1.5 bg-white pt-1.5 pb-2.5 text-[12px] text-rpk-slate">
        <span>{poweredBy}</span>
        <RespokLogo concept="thread" height={14} title="" />
      </div>
    </div>
  );
}

/** A browser window with a quiet skeleton website (the visitor's site, not ours). */
export function BrowserFrame({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-[22px] bg-white shadow-[0_40px_80px_-48px_rgb(22_20_43/0.45)] ring-1 ring-rpk-mist",
        className,
      )}
    >
      <div className="flex h-11 items-center gap-2 border-b border-rpk-mist bg-rpk-paper px-4">
        <span className="size-2.5 rounded-full bg-rpk-haze" />
        <span className="size-2.5 rounded-full bg-rpk-haze" />
        <span className="size-2.5 rounded-full bg-rpk-haze" />
        <span className="ml-4 h-6 w-[38%] rounded-full bg-white ring-1 ring-rpk-mist" />
      </div>
      {children}
    </div>
  );
}

/** Skeleton of a generic website: logo, nav, hero copy, image, cards. */
export function SkeletonSite({ className }: { className?: string }) {
  const bar = "rounded-full";
  return (
    <div className={cx("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-4 w-5 rounded-[6px] rounded-es-[2px] bg-rpk-haze" />
          <span className={cx(bar, "h-2.5 w-14 bg-rpk-haze")} />
        </span>
        <span className="hidden gap-3 xl:flex">
          <span className={cx(bar, "h-2 w-10 bg-rpk-mist")} />
          <span className={cx(bar, "h-2 w-10 bg-rpk-mist")} />
          <span className={cx(bar, "h-2 w-10 bg-rpk-mist")} />
        </span>
      </div>
      <div className="mt-12 grid grid-cols-1 items-center gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <span className={cx(bar, "block h-5 w-[86%] bg-rpk-haze")} />
          <span className={cx(bar, "mt-3 block h-5 w-[62%] bg-rpk-haze")} />
          <span className={cx(bar, "mt-6 block h-2 w-[92%] bg-rpk-mist")} />
          <span className={cx(bar, "mt-2.5 block h-2 w-[74%] bg-rpk-mist")} />
          <span className="mt-7 flex gap-2.5">
            <span className={cx(bar, "h-8 w-24 bg-rpk-haze")} />
            <span className={cx(bar, "h-8 w-20 bg-rpk-mist")} />
          </span>
        </div>
        <span className="hidden aspect-[4/3] rounded-[18px] bg-rpk-paper ring-1 ring-rpk-mist xl:block" />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-10 xl:grid-cols-3">
        <span className="h-24 rounded-[16px] bg-rpk-paper ring-1 ring-rpk-mist" />
        <span className="h-24 rounded-[16px] bg-rpk-paper ring-1 ring-rpk-mist" />
        <span className="hidden h-24 rounded-[16px] bg-rpk-paper ring-1 ring-rpk-mist xl:block" />
      </div>
    </div>
  );
}
