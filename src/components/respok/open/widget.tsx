/**
 * Product illustrations for the Open template, drawn from the kit's widget specs
 * (Shared/Code/widget/respok-launcher.css): the 60 px launcher, the 372 × 560 panel with
 * its 6 px tail corner pointing back at the button, the inbox, store badges.
 * Everything here is decorative: callers wrap it in role="img" with an English label,
 * and every word inside comes from ../content or OPEN_COPY.mock (no extra claims).
 */
import type { CSSProperties, ReactNode } from "react";
import { ArrowUp, CheckCheck, ChevronDown, ChevronLeft, Video } from "lucide-react";
import type { AppDto, AppPlatform } from "@/lib/apps.functions";
import { AndroidIcon, AppleIcon, GooglePlayIcon, WindowsIcon } from "@/components/site/brand-icons";
import { RespokLogo } from "../RespokLogo";
import type { ConversationCopy } from "../content/home";
import { downloadHref, PLATFORM_EN } from "../shared/apps";
import { OPEN_COPY } from "./copy";
import { Dot, type Surface } from "./ui";
import { cx } from "./tokens";

/* ─── Launcher ──────────────────────────────────────────────────────────── */

/** The symbol's small cut (kit `symbol-small`, for 32 px and below). */
const SMALL_SYMBOL = {
  main: "M40 0A40 40 0 0 1 80 40L80 75Q80 80 75 80L40 80A40 40 0 0 1 0 40A40 40 0 0 1 40 0Z",
  dot: [95, 95, 17] as const,
};

function delay(ms: number | undefined): CSSProperties | undefined {
  return ms === undefined ? undefined : { animationDelay: `${ms}ms` };
}

/** White bubble + Signal dot, as on the launcher and in avatars. */
export function LauncherGlyph({
  className,
  bubble = "#FFFFFF",
  dot = "#FF5A3C",
  pop,
  style,
}: {
  className?: string;
  bubble?: string;
  dot?: string;
  /** Pop the dot (0.2 → 1.35 → 1, 360 ms) after this many ms. */
  pop?: number;
  style?: CSSProperties | undefined;
}) {
  const [cx0, cy0, r] = SMALL_SYMBOL.dot;
  return (
    <svg
      viewBox="0 0 112 112"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={SMALL_SYMBOL.main} fill={bubble} />
      <circle
        cx={cx0}
        cy={cy0}
        r={r}
        fill={dot}
        className={pop === undefined ? undefined : "rpk-o-pop"}
        style={
          pop === undefined
            ? undefined
            : { transformBox: "fill-box", transformOrigin: "center", animationDelay: `${pop}ms` }
        }
      />
    </svg>
  );
}

/**
 * The floating chat button: an Ink circle (size from the `--l` custom property) with
 * the glyph. With `openAt`, the dot pops first and then the glyph turns 90° into a
 * chevron, as the kit does while the panel is open.
 */
export function Launcher({
  popAt,
  openAt,
  className,
  style,
}: {
  popAt?: number;
  openAt?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid place-items-center rounded-full bg-rpk-ink text-white shadow-rpk-launcher transition-[transform,box-shadow] duration-150 hover:scale-[1.06] hover:shadow-rpk-launcher-hover",
        className,
      )}
      style={{ width: "var(--l, 60px)", height: "var(--l, 60px)", ...style }}
    >
      <LauncherGlyph
        {...(popAt === undefined ? {} : { pop: popAt })}
        className={cx("[grid-area:1/1] w-[47%]", openAt !== undefined && "rpk-o-turn-out")}
        style={delay(openAt)}
      />
      {openAt !== undefined ? (
        <ChevronDown
          className="rpk-o-turn-in [grid-area:1/1] size-[43%]"
          strokeWidth={2.5}
          style={delay(openAt)}
        />
      ) : null}
    </span>
  );
}

/* ─── Messages ──────────────────────────────────────────────────────────── */

export function TypingDots({
  className,
  tone = "slate",
  style,
}: {
  className?: string;
  tone?: "slate" | "white";
  style?: CSSProperties | undefined;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "rpk-o-blink inline-flex w-fit items-center gap-1 rounded-[14px] rounded-bl-[4px] px-3.5 py-3",
        tone === "white" ? "bg-white shadow-[0_1px_2px_rgb(22_20_43/0.08)]" : "bg-rpk-paper",
        className,
      )}
      style={style}
    >
      <span className="size-1.5 rounded-full bg-rpk-ink" />
      <span className="size-1.5 rounded-full bg-rpk-ink" />
      <span className="size-1.5 rounded-full bg-rpk-ink" />
    </span>
  );
}

/** One message. `mine` = sent from this side (right, Ink); otherwise left, white. */
function MessageBubble({
  text,
  mine,
  className,
  style,
}: {
  text: string;
  mine: boolean;
  className?: string;
  style?: CSSProperties | undefined;
}) {
  return (
    <span
      className={cx(
        "block w-fit max-w-[86%] px-3.5 py-2.5 text-[13px] leading-[1.4] sm:text-[14px]",
        mine
          ? "justify-self-end rounded-[16px] rounded-br-[4px] bg-rpk-ink text-white [transform-origin:100%_100%]"
          : "rounded-[16px] rounded-bl-[4px] bg-white text-rpk-ink shadow-[0_1px_2px_rgb(22_20_43/0.08)] [transform-origin:0_100%]",
        className,
      )}
      style={style}
    >
      {text}
    </span>
  );
}

export interface MockMessage {
  from: "agent" | "visitor";
  text: string;
}

/* ─── Chat panel (the visitor's side) ───────────────────────────────────── */

/**
 * The Open chat panel: Ink header (avatar, name, status with the live dot), Paper body,
 * composer and "Powered by". Animated, it plays the kit's open sequence from `start`:
 * the agent types before each reply and messages arrive one by one. The end state is
 * the server-rendered markup, so nothing is lost without JavaScript.
 */
export function ChatPanel({
  agent,
  status,
  messages,
  composer,
  ending,
  start,
  className,
  style,
}: {
  agent: string;
  status: string;
  messages: MockMessage[];
  composer: string;
  /** What follows the last message: a call invitation (calls on) or the agent typing. */
  ending: "call" | "typing" | "none";
  /** ms after load when the first message arrives; undefined = static. */
  start?: number;
  className?: string;
  style?: CSSProperties;
}) {
  // Timeline: greeting, the visitor's question, then the agent types and answers.
  let t = start ?? 0;
  const timeline = messages.map((message, index) => {
    if (message.from === "visitor" || index === 0) {
      const at = t;
      t += message.from === "visitor" ? 520 : 760;
      return { typing: null, at };
    }
    const typing = { from: t, for: 1100 };
    const at = t + 1000;
    t = at + 640;
    return { typing, at };
  });
  const animated = start !== undefined;
  const at = (ms: number) => (animated ? delay(ms) : undefined);

  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-[24px] rounded-br-[6px] bg-white shadow-rpk-panel",
        className,
      )}
      style={style}
    >
      <div className="flex shrink-0 items-center gap-3 bg-rpk-ink py-3.5 pr-3 pl-4 text-white sm:py-4 sm:pl-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white sm:size-10">
          <LauncherGlyph bubble="#16142B" className="w-[52%]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-[1.25] font-bold sm:text-[16px]">
            {agent}
          </span>
          <span className="mt-0.5 flex items-start gap-[7px] text-[12px] leading-[1.3] text-white/82 sm:text-[13px]">
            <Dot size={8} className="rpk-o-live mt-[4px] sm:mt-[5px]" />
            <span className="min-w-0">{status}</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-white/80"
          strokeWidth={2.4}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 bg-rpk-paper px-3.5 pt-4 pb-4 sm:px-4">
        <span className="mb-1 self-center text-[11px] text-rpk-slate sm:text-[12px]">
          {OPEN_COPY.mock.today}
        </span>
        {messages.map((message, index) => {
          const step = timeline[index];
          const mine = message.from === "visitor";
          return (
            <span key={index} className="grid">
              {animated && step?.typing ? (
                <TypingDots
                  tone="white"
                  className="rpk-o-typing [grid-area:1/1] self-start [transform-origin:0_100%]"
                  style={{
                    animationDelay: `${step.typing.from}ms`,
                    animationDuration: `${step.typing.for}ms`,
                  }}
                />
              ) : null}
              <MessageBubble
                text={message.text}
                mine={mine}
                className={cx("[grid-area:1/1]", animated && "rpk-o-msg")}
                style={step ? at(step.at) : undefined}
              />
            </span>
          );
        })}
        {ending === "call" ? (
          <span
            style={at(t)}
            className={cx(
              "flex w-[86%] items-center gap-3 rounded-[16px] rounded-bl-[4px] bg-white p-2.5 pr-2.5 shadow-[0_1px_2px_rgb(22_20_43/0.08)] [transform-origin:0_100%]",
              animated && "rpk-o-msg",
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rpk-ink text-white">
              <Video className="size-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-rpk-ink sm:text-[14px]">
              {OPEN_COPY.mock.videoCall}
            </span>
            <span className="rounded-[12px] rounded-br-[3px] bg-rpk-signal px-3 py-1.5 text-[12px] font-semibold text-rpk-ink sm:text-[13px]">
              {OPEN_COPY.mock.join}
            </span>
          </span>
        ) : ending === "typing" ? (
          <TypingDots
            tone="white"
            className={cx("[transform-origin:0_100%]", animated && "rpk-o-msg")}
            style={at(t)}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-rpk-mist bg-white py-2.5 pr-2.5 pl-4">
        <span className="min-w-0 flex-1 truncate text-[13px] text-rpk-slate sm:text-[14px]">
          {composer}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rpk-away text-white">
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </span>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-1.5 bg-white pb-2.5 text-[11px] text-rpk-slate sm:text-[12px]">
        {OPEN_COPY.mock.powered}
        <RespokLogo concept="open" colorway="color" height={13} title="" />
      </div>
    </div>
  );
}

/* ─── Inbox (the operator's side) ───────────────────────────────────────── */

export function Avatar({
  src,
  size = 40,
  online,
}: {
  src: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="size-full rounded-full bg-rpk-mist object-cover"
      />
      {online ? (
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-rpk-signal" />
      ) : null}
    </span>
  );
}

export function ConversationList({
  conversations,
  compact,
  selected = 0,
}: {
  conversations: ConversationCopy[];
  compact?: boolean;
  selected?: number;
}) {
  return (
    <ul>
      {conversations.map((c, index) => (
        <li
          key={c.name}
          className={cx(
            "flex items-center gap-3 border-b border-rpk-mist last:border-b-0",
            compact ? "px-4 py-3" : "px-5 py-3.5 sm:px-6 sm:py-4",
            index === selected && "bg-rpk-paper",
          )}
        >
          <Avatar src={c.avatar} size={compact ? 36 : 42} online={index === selected} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span
                className={cx(
                  "truncate font-semibold text-rpk-ink",
                  compact ? "text-[13px]" : "text-[14px] sm:text-[15px]",
                )}
              >
                {c.name}
              </span>
              <span className="shrink-0 font-rpk-mono text-[11px] text-rpk-slate">{c.time}</span>
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-3">
              <span
                className={cx(
                  "truncate text-rpk-slate",
                  compact ? "text-[12px]" : "text-[13px] sm:text-[14px]",
                )}
              >
                {c.message}
              </span>
              {index === selected ? (
                <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-rpk-signal-deep px-1 text-[11px] leading-none font-bold text-white">
                  1
                </span>
              ) : null}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function InboxHeader({ count, compact }: { count: number; compact?: boolean }) {
  return (
    <div
      className={cx(
        "border-b border-rpk-mist",
        compact ? "px-4 pt-4 pb-3" : "px-5 pt-5 pb-4 sm:px-6",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cx("font-bold text-rpk-ink", compact ? "text-[15px]" : "text-[17px]")}>
          {OPEN_COPY.mock.inboxTitle}
        </span>
        <span className="flex items-center gap-2 font-rpk-mono text-[11px] tracking-[0.06em] text-rpk-slate uppercase">
          <Dot size={7} />
          {OPEN_COPY.mock.online}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {OPEN_COPY.mock.views.map((view, index) => (
          <span
            key={view}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-[10px] rounded-br-[3px] px-2.5 py-1 font-medium",
              compact ? "text-[11px]" : "text-[12px]",
              index === 0 ? "bg-rpk-ink text-white" : "text-rpk-slate",
            )}
          >
            {view}
            {index === 0 ? (
              <span className="font-rpk-mono text-[10px] text-white/70">
                {String(count).padStart(2, "0")}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The shared inbox: views, the conversation list, a composer with saved replies. */
export function InboxCard({
  conversations,
  className,
}: {
  conversations: ConversationCopy[];
  className?: string;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-[32px] rounded-br-[6px] bg-white shadow-rpk-panel",
        className,
      )}
    >
      <InboxHeader count={conversations.length} />
      <ConversationList conversations={conversations} />
      <div className="border-t border-rpk-mist bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3 rounded-[16px] rounded-br-[4px] bg-rpk-paper py-2.5 pr-2.5 pl-4">
          <span className="min-w-0 flex-1 truncate text-[13px] text-rpk-slate sm:text-[14px]">
            {OPEN_COPY.mock.savedReplies}
          </span>
          <span className="grid size-8 place-items-center rounded-[10px] rounded-br-[3px] bg-white font-rpk-mono text-[13px] text-rpk-ink shadow-[0_1px_2px_rgb(22_20_43/0.1)]">
            /
          </span>
        </div>
      </div>
    </div>
  );
}

/** An open conversation as the operator sees it: their replies on the right, in Ink. */
export function ThreadPane({
  contact,
  messages,
  compact,
  back,
}: {
  contact: ConversationCopy;
  messages: MockMessage[];
  compact?: boolean;
  back?: boolean;
}) {
  const lastAgent = messages.reduce((last, m, i) => (m.from === "agent" ? i : last), -1);
  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <div className="flex items-center gap-2.5 border-b border-rpk-mist px-4 py-3">
        {back ? <ChevronLeft aria-hidden="true" className="-ml-1 size-4 text-rpk-ink" /> : null}
        <Avatar src={contact.avatar} size={compact ? 30 : 34} online />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-rpk-ink">
            {contact.name}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-rpk-slate">
            <Dot size={6} />
            {OPEN_COPY.mock.online}
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 bg-rpk-paper px-3 py-4">
        <span className="mb-1 self-center text-[11px] text-rpk-slate">{OPEN_COPY.mock.today}</span>
        {messages.map((m, index) => (
          <span key={index} className="grid">
            <MessageBubble text={m.text} mine={m.from === "agent"} className="!text-[12px]" />
            {index === lastAgent ? (
              <span className="mt-1 flex items-center gap-1 justify-self-end font-rpk-mono text-[10px] text-rpk-slate">
                <CheckCheck aria-hidden="true" className="size-3" />
                {OPEN_COPY.mock.read}
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-rpk-mist px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[12px] text-rpk-slate">
          {OPEN_COPY.mock.savedReplies}
        </span>
        <span className="grid size-7 place-items-center rounded-full bg-rpk-ink text-white">
          <ArrowUp className="size-3.5" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}

/**
 * The app, drawn by the template when no screenshots are uploaded: on phones the inbox
 * and an open conversation as two screens; on desktops one window with both panes.
 */
export function AppIllustration({
  platform,
  conversations,
  messages,
  label,
}: {
  platform: AppPlatform;
  conversations: ConversationCopy[];
  messages: MockMessage[];
  label: string;
}) {
  const contact = conversations[0];
  if (!contact) return null;
  const phone = platform === "ios" || platform === "android";
  if (phone) {
    const screen =
      "relative h-[460px] w-[236px] shrink-0 overflow-hidden rounded-[36px] rounded-br-[8px] border-[6px] border-rpk-ink bg-white shadow-rpk-panel sm:h-[520px] sm:w-[260px]";
    return (
      <div role="img" aria-label={label} className="flex justify-center gap-5 sm:gap-8">
        <div className={cx(screen, "hidden sm:block")}>
          <InboxHeader count={conversations.length} compact />
          <ConversationList conversations={conversations} compact />
        </div>
        <div className={cx(screen, "sm:mt-12")}>
          <ThreadPane contact={contact} messages={messages} compact back />
        </div>
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-[28px] rounded-br-[6px] border border-rpk-mist bg-white shadow-rpk-panel"
    >
      <div className="flex h-10 items-center gap-2 border-b border-rpk-mist bg-rpk-paper px-4">
        {platform === "mac" ? (
          <>
            <span className="size-2.5 rounded-full bg-rpk-away" />
            <span className="size-2.5 rounded-full bg-rpk-away" />
            <span className="size-2.5 rounded-full bg-rpk-away" />
          </>
        ) : (
          <RespokLogo concept="open" variant="symbol" height={16} title="" />
        )}
      </div>
      <div className="grid h-[440px] sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="hidden overflow-hidden border-r border-rpk-mist sm:block">
          <InboxHeader count={conversations.length} compact />
          <ConversationList conversations={conversations} compact />
        </div>
        <ThreadPane contact={contact} messages={messages} />
      </div>
    </div>
  );
}

/* ─── Platforms & stores ────────────────────────────────────────────────── */

const STORE_ICON: Record<AppPlatform, (p: { className?: string | undefined }) => ReactNode> = {
  ios: AppleIcon,
  android: GooglePlayIcon,
  mac: AppleIcon,
  windows: WindowsIcon,
};

const PLATFORM_ICON: Record<AppPlatform, (p: { className?: string | undefined }) => ReactNode> = {
  ios: AppleIcon,
  android: AndroidIcon,
  mac: AppleIcon,
  windows: WindowsIcon,
};

/** Platform mark in a bubble tile. */
export function PlatformTile({
  platform,
  size = 56,
  tone = "ink",
  className,
}: {
  platform: AppPlatform;
  size?: number;
  tone?: "ink" | "white" | "glass";
  className?: string;
}) {
  const Icon = PLATFORM_ICON[platform];
  const tones = {
    ink: "bg-rpk-ink text-white",
    white: "bg-white text-rpk-ink",
    glass: "bg-white/[0.08] text-white",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative inline-grid shrink-0 place-items-center",
        size >= 72 ? "rounded-[24px] rounded-br-[6px]" : "rounded-[16px] rounded-br-[4px]",
        tones[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="size-[44%]" />
    </span>
  );
}

/**
 * Template-styled store badge (no official store artwork). Released apps link through
 * /go/{slug} so downloads are counted; others show "Coming soon" with the away ring.
 */
export function StoreBadge({
  app,
  surface = "paper",
  className,
}: {
  app: Pick<AppDto, "slug" | "downloadUrl" | "platform">;
  surface?: Surface;
  className?: string;
}) {
  const platform = PLATFORM_EN[app.platform];
  const Icon = STORE_ICON[app.platform];
  const href = downloadHref(app);
  const ink = surface === "ink";
  const base =
    "group/store inline-flex h-14 min-w-[188px] items-center gap-3 rounded-[18px] rounded-br-[5px] pr-5 pl-4 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-rpk-spring";
  const body = (
    <>
      <Icon className="size-6 shrink-0" />
      <span className="flex min-w-0 flex-col leading-[1.15]">
        <span className="text-[11px] font-medium opacity-75">
          {href ? platform.action : platform.soon}
        </span>
        <span className="truncate text-[17px] font-bold tracking-[-0.01em]">{platform.store}</span>
      </span>
    </>
  );
  if (!href) {
    return (
      <span
        className={cx(
          base,
          "cursor-default border border-dashed",
          ink ? "border-white/25 text-white/70" : "border-rpk-ink/25 text-rpk-slate",
          className,
        )}
      >
        {body}
        <Dot size={9} tone={ink ? "away" : "away-ink"} className="ml-auto" />
      </span>
    );
  }
  return (
    <a
      href={href}
      rel="nofollow"
      className={cx(
        base,
        "hover:-translate-y-px active:scale-[.97]",
        ink
          ? "bg-white text-rpk-ink hover:shadow-[0_14px_28px_-14px_rgb(0_0_0/0.6)]"
          : "bg-rpk-ink text-white hover:shadow-[0_14px_28px_-14px_rgb(22_20_43/0.7)]",
        className,
      )}
    >
      {body}
      <Dot
        size={8}
        className="ml-auto transition-transform duration-300 ease-rpk-pop group-hover/store:scale-[1.35]"
      />
    </a>
  );
}
