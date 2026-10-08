/**
 * Template-made pictures of the Respok apps, used when an app has no screenshots.
 * They show only what the apps really do: the inbox list and a conversation, with the
 * names and messages from the shared copy (Thread colors: the visitor's question in
 * Ink, the operator's answer in Signal).
 */
import type { ReactNode } from "react";
import { ChevronLeft, Minus, Search, Square, X } from "lucide-react";
import type { AppPlatform } from "@/lib/apps.functions";
import { useContent } from "../content";
import { getHomeContent, type HomeContent } from "../content/home";
import { THREAD_COPY } from "./copy";
import { SHAPE, cx } from "./classes";

type Conversation = HomeContent["chat"]["conversations"][number];
type Message = HomeContent["hero"]["chat"]["messages"][number];

function InboxRows({ rows, compact = false }: { rows: Conversation[]; compact?: boolean }) {
  return (
    <ul>
      {rows.map((row, index) => (
        <li
          key={row.name}
          className={cx(
            "flex items-center gap-2.5",
            compact ? "px-3 py-2.5" : "px-4 py-3",
            index === 0 ? "bg-rpk-paper" : "border-t border-rpk-mist/70",
          )}
        >
          <img
            src={row.avatar}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            className={cx("shrink-0 rounded-full object-cover", compact ? "size-8" : "size-9")}
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] leading-[1.3] font-semibold text-rpk-ink">
                {row.name}
              </span>
              <span className="shrink-0 font-rpk-mono text-[10px] text-rpk-slate">{row.time}</span>
            </span>
            <span className="block truncate text-[11px] leading-[1.35] text-rpk-slate">
              {row.message}
            </span>
          </span>
          {index === 0 && <span className="size-2 shrink-0 rounded-full bg-rpk-signal" />}
        </li>
      ))}
    </ul>
  );
}

function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((message, index) => (
        <span
          key={index}
          className={cx(
            "max-w-[86%] px-3 py-2 text-[11px] leading-[1.4] font-medium break-words",
            message.from === "visitor"
              ? cx("self-start bg-rpk-ink text-white", "rounded-[14px] rounded-es-[4px]")
              : cx("self-end bg-rpk-signal text-rpk-ink", "rounded-[14px] rounded-ee-[4px]"),
          )}
        >
          {message.text}
        </span>
      ))}
    </div>
  );
}

function Composer({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-rpk-mist bg-white px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-rpk-slate">{text}</span>
      <span className={cx("h-6 w-8 shrink-0 bg-rpk-ink/40", SHAPE.answer)} />
    </div>
  );
}

/** The visitor's messages, seen from the operator's side. */
function operatorChat(c: HomeContent): { contact: Conversation | undefined; messages: Message[] } {
  const rows = c.chat.conversations;
  return { contact: rows[0], messages: c.hero.chat.messages };
}

function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "w-[200px] shrink-0 rounded-[38px] bg-rpk-ink p-[7px] shadow-[0_40px_70px_-36px_rgb(22_20_43/0.55)] sm:w-[214px]",
        className,
      )}
    >
      <div className="flex h-[420px] flex-col overflow-hidden rounded-[31px] bg-white sm:h-[448px]">
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="font-rpk-mono text-[10px] text-rpk-ink">9:41</span>
          <span className="h-[18px] w-16 rounded-full bg-rpk-ink" />
          <span className="flex gap-0.5">
            <span className="h-2 w-1 rounded-full bg-rpk-ink" />
            <span className="h-2 w-1 rounded-full bg-rpk-ink" />
            <span className="h-2 w-3 rounded-[3px] bg-rpk-ink" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function PhonePair({ c }: { c: HomeContent }) {
  const { contact, messages } = operatorChat(c);
  return (
    <div className="relative mx-auto flex w-fit items-start">
      <Phone className="relative z-0 -rotate-[4deg]">
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <span className="text-[17px] font-bold text-rpk-ink">{THREAD_COPY.home.inbox}</span>
          <span className="grid size-7 place-items-center rounded-full bg-rpk-paper">
            <Search className="size-3.5 text-rpk-ink" strokeWidth={2.4} />
          </span>
        </div>
        <div className="flex gap-1.5 px-4 pb-3">
          <span
            className={cx(
              "inline-flex h-6 items-center bg-rpk-ink px-2.5 text-[10px] font-semibold text-white",
              SHAPE.question,
            )}
          >
            {THREAD_COPY.home.inboxOpen}
          </span>
        </div>
        <InboxRows rows={c.chat.conversations} compact />
      </Phone>
      <Phone className="relative z-10 mt-14 -ml-16 rotate-[3deg] sm:-ml-12">
        <div className="flex items-center gap-2 border-b border-rpk-mist px-3 pt-2 pb-2.5">
          <ChevronLeft className="size-4 shrink-0 text-rpk-ink" strokeWidth={2.4} />
          {contact && (
            <>
              <img
                src={contact.avatar}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="size-7 shrink-0 rounded-full object-cover"
              />
              <span className="truncate text-[12px] font-semibold text-rpk-ink">
                {contact.name}
              </span>
            </>
          )}
        </div>
        <div className="flex-1 bg-rpk-paper px-3 py-3">
          <ChatMessages messages={messages} />
        </div>
        <Composer text={c.hero.chat.composer} />
      </Phone>
    </div>
  );
}

function DesktopWindow({ c, platform }: { c: HomeContent; platform: AppPlatform }) {
  const { contact, messages } = operatorChat(c);
  return (
    <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[18px] bg-white shadow-[0_40px_70px_-40px_rgb(22_20_43/0.55)] ring-1 ring-rpk-mist">
      <div className="flex h-8 items-center gap-1.5 border-b border-rpk-mist bg-rpk-paper px-3">
        {platform === "mac" ? (
          <>
            <span className="size-2.5 rounded-full bg-rpk-haze" />
            <span className="size-2.5 rounded-full bg-rpk-haze" />
            <span className="size-2.5 rounded-full bg-rpk-haze" />
          </>
        ) : (
          <span className="ml-auto flex items-center gap-3 text-rpk-slate">
            <Minus className="size-3" strokeWidth={2.4} />
            <Square className="size-2.5" strokeWidth={2.4} />
            <X className="size-3" strokeWidth={2.4} />
          </span>
        )}
      </div>
      <div className="grid h-[300px] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="border-r border-rpk-mist">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[13px] font-bold text-rpk-ink">{THREAD_COPY.home.inbox}</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rpk-ink px-1.5 font-rpk-mono text-[10px] text-white">
              {c.chat.conversations.length}
            </span>
          </div>
          <InboxRows rows={c.chat.conversations} compact />
        </div>
        <div className="flex min-w-0 flex-col">
          {contact && (
            <div className="flex items-center gap-2 border-b border-rpk-mist px-3 py-2">
              <img
                src={contact.avatar}
                alt=""
                width={24}
                height={24}
                loading="lazy"
                className="size-6 shrink-0 rounded-full object-cover"
              />
              <span className="truncate text-[12px] font-semibold text-rpk-ink">
                {contact.name}
              </span>
            </div>
          )}
          <div className="flex-1 bg-rpk-paper p-3">
            <ChatMessages messages={messages} />
          </div>
          <Composer text={c.hero.chat.composer} />
        </div>
      </div>
    </div>
  );
}

/** Inbox → chat, as a phone pair (iPhone, Android) or a desktop window (Mac, Windows). */
export function AppIllustration({
  platform,
  label,
  className,
}: {
  platform: AppPlatform;
  label: string;
  className?: string;
}) {
  const c = useContent(getHomeContent);
  return (
    <div role="img" aria-label={label} className={cx("relative", className)}>
      {platform === "ios" || platform === "android" ? (
        <PhonePair c={c} />
      ) : (
        <DesktopWindow c={c} platform={platform} />
      )}
    </div>
  );
}
