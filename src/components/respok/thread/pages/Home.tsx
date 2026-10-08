import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Mic, Pause, PhoneOff, Play, Plus, Video } from "lucide-react";
import { LoopVideo } from "@/components/site/LoopVideo";
import type { AppDto } from "@/lib/apps.functions";
import type { HomePageData } from "../../types";
import { RESPOK_SYMBOL } from "../../RespokLogo";
import { useContent } from "../../content";
import { getHomeContent, type ChannelCopy, type HomeContent } from "../../content/home";
import { useRespokAuth } from "../../shared/auth";
import { sortApps } from "../../shared/apps";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { homeJsonLd, withOverride } from "../../shared/structured";
import { AppCard, PlatformGlyph } from "../apps";
import { THREAD_COPY } from "../copy";
import { SHAPE, cx } from "../classes";
import { ThreadMotion } from "../motion";
import { useStage } from "../stage";
import {
  ActionLink,
  AnswerCard,
  AnswerPill,
  CheckDot,
  Container,
  Eyebrow,
  Exchange,
  IconBadge,
  QuestionPill,
  ReadTicks,
  Section,
  SectionHeader,
  Timestamp,
  TypingDots,
} from "../ui";
import { BrowserFrame, Bubble, ChatPanel, Launcher, SkeletonSite, TypingBubble } from "../widget";

type Tone = "white" | "paper";

/** 09:41, 09:42 … decorative chat clock for transcripts. */
function clock(step: number): string {
  const minutes = 41 + step;
  return `${String(9 + Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ c, apps }: { c: HomeContent; apps: AppDto[] }) {
  const auth = useRespokAuth();
  // One glyph per logo: iPhone and Mac share Apple's.
  const platforms = [
    ...new Map(
      sortApps(apps).map((app) => [app.platform === "mac" ? "ios" : app.platform, app.platform]),
    ).values(),
  ];
  return (
    <section className="relative overflow-hidden bg-white">
      <Container wide className="flex flex-col items-center pt-12 text-center sm:pt-16 lg:pt-20">
        <Exchange
          className="mx-auto text-left"
          question={
            <div className="relative">
              <QuestionPill size="xl" className="tt-in-left">
                {c.hero.question}
              </QuestionPill>
              <Timestamp className="absolute top-1/2 left-full ml-3 hidden -translate-y-1/2 sm:inline">
                {clock(0)}
              </Timestamp>
            </div>
          }
          answer={
            <div className="relative">
              <AnswerPill size="xl" className="tt-hero-answer">
                {c.hero.answer}
              </AnswerPill>
              <span
                aria-hidden="true"
                className={cx(
                  "tt-hero-typing absolute top-0 right-0 inline-flex h-14 min-w-[104px] items-center justify-center bg-rpk-signal sm:h-16 sm:min-w-[124px]",
                  SHAPE.answer,
                )}
              >
                <TypingDots className="tt-typing" />
              </span>
            </div>
          }
        />

        <Eyebrow className="mt-12 sm:mt-14">{c.hero.eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-[17ch] text-[42px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance text-rpk-ink min-[400px]:text-[46px] sm:max-w-none sm:text-[60px] lg:text-[72px] lg:tracking-[-0.035em] xl:text-[76px]">
          {c.hero.title.map((line) => (
            <span key={line} className="sm:block">
              {line}{" "}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-[40rem] text-[18px] leading-[1.55] text-pretty text-rpk-slate sm:text-[20px]">
          {c.hero.lede}
        </p>
        <div className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center">
          <ActionLink href={auth.ctaUrl} size="lg" arrow>
            {c.hero.primaryCta}
          </ActionLink>
          <ActionLink href="/pricing" variant="outline" size="lg">
            {c.hero.secondaryCta}
          </ActionLink>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 font-rpk-mono text-[13px] tracking-[0.02em] text-rpk-slate">
          <ReadTicks className="text-rpk-signal-deep" />
          {c.hero.install}
        </p>
        {platforms.length > 0 && (
          <Link
            to="/download"
            className="group/apps mt-4 inline-flex min-h-11 items-center gap-3 rounded-full px-2 text-[15px] font-semibold text-rpk-ink"
          >
            <span aria-hidden="true" className="flex items-center gap-1.5 text-rpk-ink">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="grid size-8 place-items-center rounded-full bg-rpk-paper ring-1 ring-rpk-mist ring-inset"
                >
                  <PlatformGlyph platform={platform} className="size-4" />
                </span>
              ))}
            </span>
            <span className="underline decoration-rpk-mist decoration-2 underline-offset-[6px] transition-colors group-hover/apps:decoration-rpk-signal">
              {c.hero.appsCta}
            </span>
            <ArrowRight
              aria-hidden="true"
              strokeWidth={2.4}
              className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/apps:translate-x-0.5"
            />
          </Link>
        )}
      </Container>
      <Stage c={c} />
    </section>
  );
}

/* ── Stage: the widget on a website ─────────────────────────────────────── */

function StagePanel({ c, className }: { c: HomeContent; className?: string }) {
  const { brand } = useRespok();
  const chat = c.hero.chat;
  return (
    <ChatPanel
      agent={chat.agent}
      status={chat.status}
      today={THREAD_COPY.home.today}
      composer={chat.composer}
      poweredBy={THREAD_COPY.home.poweredBy}
      className={className}
    >
      {chat.messages.map((message, index) => (
        <Bubble key={index} from={message.from}>
          {message.text}
        </Bubble>
      ))}
      {c.video ? (
        <div className="flex w-[88%] items-center gap-3 self-start rounded-[21px] rounded-es-[4px] bg-white p-3 shadow-[0_1px_0_#E4E3EC]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rpk-signal-soft text-rpk-ink">
            <Video className="size-5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] leading-[1.3] font-bold text-rpk-ink">
              {THREAD_COPY.home.callInvite.title}
            </span>
            <span className="block truncate text-[13px] leading-[1.35] text-rpk-slate">
              {brand} · {THREAD_COPY.home.callInvite.body}
            </span>
          </span>
          <span
            className={cx(
              "inline-flex h-9 shrink-0 items-center bg-rpk-signal px-4 text-[14px] font-semibold text-rpk-ink",
              SHAPE.answer,
            )}
          >
            {THREAD_COPY.home.callInvite.join}
          </span>
        </div>
      ) : (
        <TypingBubble />
      )}
    </ChatPanel>
  );
}

function Stage({ c }: { c: HomeContent }) {
  const [ref, stage] = useStage<HTMLDivElement>();
  return (
    <Container wide className="pt-14 pb-16 sm:pt-20 sm:pb-20 lg:pb-24">
      <figure className="m-0">
        <div
          ref={ref}
          data-stage={stage}
          role="img"
          aria-label={THREAD_COPY.home.stageLabel}
          className="relative overflow-hidden rounded-[32px] bg-rpk-paper px-4 pt-8 pb-6 ring-1 ring-rpk-mist sm:rounded-[44px] sm:px-8 sm:pt-10 md:pb-10 lg:px-14 lg:pt-14 lg:pb-14"
        >
          {/* Phones: the panel and the launcher, as on a small screen. */}
          <div className="relative mx-auto flex max-w-[372px] flex-col items-end gap-4 md:hidden">
            <StagePanel c={c} className="w-full" />
            <Launcher
              unread={1}
              size={52}
              accentClassName="tt-st-accent"
              badgeClassName="tt-st-badge"
            />
          </div>

          {/* Tablets and up: the widget on a website. */}
          <BrowserFrame className="relative mx-auto hidden max-w-[1040px] md:block">
            <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_348px] lg:gap-10 lg:p-8">
              <SkeletonSite className="py-2" />
              <div className="flex flex-col items-end gap-4">
                <StagePanel c={c} className="w-full" />
                <Launcher unread={1} accentClassName="tt-st-accent" badgeClassName="tt-st-badge" />
              </div>
            </div>
          </BrowserFrame>
        </div>
        <figcaption className="mt-5 text-center font-rpk-mono text-[12px] leading-[1.6] tracking-[0.04em] text-rpk-slate sm:text-[13px]">
          {c.hero.note}
        </figcaption>
      </figure>
    </Container>
  );
}

/* ── Channels ───────────────────────────────────────────────────────────── */

function ChannelIcon({ item }: { item: ChannelCopy }) {
  if (item.path)
    return (
      <svg
        aria-hidden="true"
        viewBox={item.viewBox ?? "0 0 24 24"}
        fill="currentColor"
        focusable="false"
        className="size-[22px] shrink-0"
      >
        <path d={item.path} />
      </svg>
    );
  if (item.img)
    return (
      <img
        src={item.img}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        className="size-5 shrink-0 [filter:brightness(0)]"
      />
    );
  return null;
}

function ChannelGroups({ c, duplicate = false }: { c: HomeContent; duplicate?: boolean }) {
  const kinds = (["inbox", "email", "store"] as const).filter((kind) =>
    c.channels.items.some((item) => item.kind === kind),
  );
  return (
    <ul
      aria-hidden={duplicate || undefined}
      aria-label={duplicate ? undefined : THREAD_COPY.home.channelsLabel}
      className={cx("flex shrink-0 items-center gap-10 pr-10", duplicate && "tt-marquee-dup")}
    >
      {kinds.map((kind) => (
        <li key={kind} className="flex shrink-0 items-center gap-3">
          <span className="font-rpk-mono text-[12px] tracking-[0.08em] whitespace-nowrap text-rpk-slate uppercase">
            {c.channels.groups[kind]}
          </span>
          <ul className="flex items-center gap-2.5">
            {c.channels.items
              .filter((item) => item.kind === kind)
              .map((item) => (
                <li
                  key={item.name}
                  className={cx(
                    "inline-flex h-12 items-center gap-2.5 bg-white pr-5 pl-4 text-[15px] font-semibold whitespace-nowrap text-rpk-ink shadow-[0_1px_2px_rgb(22_20_43/0.05)] ring-1 ring-rpk-mist ring-inset",
                    SHAPE.question,
                  )}
                >
                  <ChannelIcon item={item} />
                  {item.name}
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Channels({ c }: { c: HomeContent }) {
  const [paused, setPaused] = useState(false);
  const headingId = useId();
  return (
    <Section
      tone="white"
      labelledBy={headingId}
      className="!pt-4 !pb-12 sm:!pt-6 sm:!pb-16 lg:!pt-8"
    >
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            id={headingId}
            question={c.channels.question}
            meta={c.channels.eyebrow}
            title={c.channels.title}
            className="lg:max-w-[34rem]"
          />
          <p className="max-w-[32rem] text-[16px] leading-[1.6] text-pretty text-rpk-slate sm:text-[17px]">
            {c.channels.lede}
          </p>
        </div>
      </Container>
      <div
        className="tt-marquee-wrap relative mt-12 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] sm:mt-14"
        data-paused={paused}
      >
        <div className="tt-marquee flex w-max">
          <ChannelGroups c={c} />
          <ChannelGroups c={c} duplicate />
        </div>
      </div>
      <Container className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase transition-colors hover:text-rpk-ink motion-reduce:hidden"
        >
          {paused ? (
            <Play aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
          ) : (
            <Pause aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
          )}
          {paused ? "Play" : "Pause"}
        </button>
      </Container>
    </Section>
  );
}

/* ── Apps ───────────────────────────────────────────────────────────────── */

function Apps({ c, apps, tone }: { c: HomeContent; apps: AppDto[]; tone: Tone }) {
  const headingId = useId();
  const sorted = sortApps(apps);
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            id={headingId}
            question={c.apps.question}
            meta={c.apps.eyebrow}
            title={c.apps.title}
            lede={c.apps.lede}
          />
          <ActionLink
            href="/download"
            variant="secondary"
            arrow
            className="self-start lg:self-auto"
          >
            {c.apps.allApps}
          </ActionLink>
        </div>
        <ul
          className={cx(
            "-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-6 [scrollbar-width:none] sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pt-0 sm:pb-0 lg:gap-6 [&::-webkit-scrollbar]:hidden",
            sorted.length === 1 && "sm:max-w-sm sm:grid-cols-1",
            sorted.length === 3 && "lg:grid-cols-3",
            sorted.length >= 4 && "lg:grid-cols-4",
          )}
        >
          {sorted.map((app, index) => (
            <Reveal
              as="li"
              key={app.id}
              delay={(index % 4) * 80}
              className={cx(
                "shrink-0 snap-start sm:w-auto",
                sorted.length > 1 ? "w-[84%]" : "w-full",
              )}
            >
              <AppCard app={app} detailsLabel={THREAD_COPY.home.appDetails} store />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ── Live chat (#features) ──────────────────────────────────────────────── */

function InboxCard({ c }: { c: HomeContent }) {
  const conversations = c.chat.conversations;
  const first = conversations[0];
  return (
    <AnswerCard className="overflow-hidden" tone="white">
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-3 border-b border-rpk-mist px-5 py-4">
          <span className="flex items-center gap-2.5 text-[16px] font-bold text-rpk-ink">
            {THREAD_COPY.home.inbox}
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rpk-ink px-2 font-rpk-mono text-[12px] text-white">
              {conversations.length}
            </span>
          </span>
          <span
            className={cx(
              "inline-flex h-8 items-center bg-rpk-paper px-3.5 text-[13px] font-semibold text-rpk-ink ring-1 ring-rpk-mist ring-inset",
              SHAPE.question,
            )}
          >
            {THREAD_COPY.home.inboxOpen}
          </span>
        </div>
        <ul>
          {conversations.map((conversation, index) => (
            <li
              key={conversation.name}
              className={cx(
                "flex items-center gap-3.5 px-5 py-3.5",
                index === 0 ? "bg-rpk-paper" : "border-t border-rpk-mist/70",
              )}
            >
              <img
                src={conversation.avatar}
                alt=""
                width={44}
                height={44}
                loading="lazy"
                className="size-11 shrink-0 rounded-full object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px] font-semibold text-rpk-ink">
                    {conversation.name}
                  </span>
                  <span className="shrink-0 font-rpk-mono text-[12px] text-rpk-slate">
                    {conversation.time}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[14px] text-rpk-slate">
                  {conversation.message}
                </span>
              </span>
              {index === 0 && <span className="size-2.5 shrink-0 rounded-full bg-rpk-signal" />}
            </li>
          ))}
        </ul>
        {first && (
          <div className="flex items-center gap-2.5 border-t border-rpk-mist px-5 py-3.5 text-[13px] text-rpk-slate">
            <TypingDots tone="slate" className="tt-typing" />
            {THREAD_COPY.home.typing(first.name.split(" ")[0] ?? first.name)}
          </div>
        )}
      </div>
    </AnswerCard>
  );
}

function LiveChat({ c, tone }: { c: HomeContent; tone: Tone }) {
  const headingId = useId();
  return (
    <Section id="features" tone={tone} labelledBy={headingId}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionHeader
              id={headingId}
              question={c.chat.question}
              meta={c.chat.eyebrow}
              title={c.chat.title}
              lede={c.chat.lede}
            />
            <div className="mt-10 lg:sticky lg:top-28">
              <Reveal effect="rise">
                <InboxCard c={c} />
              </Reveal>
            </div>
          </div>
          <ol className="relative space-y-7 sm:space-y-8 lg:pt-2">
            {c.chat.features.map((feature, index) => (
              <li key={feature.title} className="flex flex-col gap-2">
                <Reveal effect="from-left" className="flex items-center gap-3">
                  <QuestionPill as="h3" size="md">
                    {feature.title}
                  </QuestionPill>
                  <Timestamp>{clock(index * 2)}</Timestamp>
                </Reveal>
                <Reveal
                  effect="from-right"
                  delay={120}
                  className="ml-8 self-end sm:ml-16 lg:max-w-[30rem]"
                >
                  <AnswerCard
                    className={cx("px-6 pt-5 pb-4", tone === "white" && "ring-1 ring-rpk-mist/60")}
                  >
                    <p className="text-[16px] leading-[1.6] text-rpk-ink/85">{feature.body}</p>
                    <p className="mt-2 flex items-center justify-end gap-1.5 text-rpk-signal-deep">
                      <Timestamp>{clock(index * 2 + 1)}</Timestamp>
                      <ReadTicks />
                    </p>
                  </AnswerCard>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/* ── Calls ──────────────────────────────────────────────────────────────── */

function Calls({ video, tone }: { video: NonNullable<HomeContent["video"]>; tone: Tone }) {
  const headingId = useId();
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div>
            <SectionHeader
              id={headingId}
              question={video.question}
              meta={video.eyebrow}
              title={video.title}
              lede={video.lede}
            />
            <ul className="mt-10 space-y-5">
              {video.features.map((feature) => (
                <li key={feature.title} className="flex gap-4">
                  <CheckDot className="mt-[3px]" />
                  <div>
                    <h3 className="text-[17px] leading-[1.35] font-bold text-rpk-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[15px] leading-[1.6] text-rpk-slate">{feature.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Reveal effect="from-right">
            <AnswerCard className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-rpk-ink">
                  <span aria-hidden="true" className="size-2 rounded-full bg-rpk-signal" />
                  {THREAD_COPY.home.callInvite.title}
                </span>
                <Timestamp>00:42</Timestamp>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-[20px] bg-rpk-ink">
                <LoopVideo
                  src={video.video.src}
                  poster={video.video.poster}
                  title={THREAD_COPY.home.videoTitle}
                  width={960}
                  height={540}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-rpk-ink/70 px-3 font-rpk-mono text-[12px] tracking-[0.06em] text-white backdrop-blur"
                >
                  HD
                </span>
                <div className="absolute right-3 bottom-3 aspect-video w-[30%] overflow-hidden rounded-[14px] rounded-ee-[4px] bg-rpk-ink-raised shadow-[0_10px_24px_-10px_rgb(22_20_43/0.6)] ring-2 ring-white">
                  <LoopVideo
                    src={video.video.operator}
                    poster=""
                    title={THREAD_COPY.home.operatorTitle}
                    width={320}
                    height={180}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div aria-hidden="true" className="flex items-center justify-center gap-3 pt-4 pb-1">
                <span className="grid size-12 place-items-center rounded-full bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset">
                  <Mic className="size-5" strokeWidth={2} />
                </span>
                <span className="grid size-12 place-items-center rounded-full bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset">
                  <Video className="size-5" strokeWidth={2} />
                </span>
                <span
                  className={cx(
                    "grid h-12 w-16 place-items-center bg-rpk-signal-deep text-white",
                    SHAPE.answer,
                  )}
                >
                  <PhoneOff className="size-5" strokeWidth={2} />
                </span>
              </div>
            </AnswerCard>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ── Platform ───────────────────────────────────────────────────────────── */

function Platform({ c, tone }: { c: HomeContent; tone: Tone }) {
  const headingId = useId();
  const features = c.platform.features;
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <SectionHeader
          id={headingId}
          question={c.platform.question}
          meta={c.platform.eyebrow}
          title={c.platform.title}
          lede={c.platform.lede}
          center
        />
        <ol className="relative mt-14 flex flex-col gap-4 sm:mt-16 lg:grid lg:grid-cols-2 lg:gap-x-24 lg:gap-y-0 lg:before:absolute lg:before:inset-y-0 lg:before:left-1/2 lg:before:w-px lg:before:bg-rpk-mist">
          {features.map((feature, index) => {
            const right = index % 2 === 1;
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="relative lg:pb-6"
                style={{ gridColumn: right ? 2 : 1, gridRow: `${index + 1} / span 2` }}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute top-[42px] hidden size-3 rounded-full ring-4 lg:block",
                    tone === "paper" ? "ring-rpk-paper" : "ring-white",
                    right ? "-left-[54px] bg-rpk-ink" : "-right-[54px] bg-rpk-signal",
                  )}
                />
                <Reveal effect={right ? "from-right" : "from-left"}>
                  <article
                    className={cx(
                      "bg-white p-5 shadow-rpk-card sm:p-6",
                      tone === "white" && "ring-1 ring-rpk-mist/70",
                      right ? SHAPE.questionCard : SHAPE.answerCard,
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      {Icon && <IconBadge icon={Icon} tone={right ? "paper" : "soft"} />}
                      <h3 className="min-w-0 flex-1 text-[18px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink sm:text-[19px]">
                        {feature.title}
                      </h3>
                      <Timestamp className="hidden sm:inline">{clock(index + 3)}</Timestamp>
                    </div>
                    <p className="mt-3 text-[15px] leading-[1.6] text-rpk-slate sm:mt-4 sm:text-[16px]">
                      {feature.body}
                    </p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

/* ── Steps ──────────────────────────────────────────────────────────────── */

function Steps({ c, tone }: { c: HomeContent; tone: Tone }) {
  const headingId = useId();
  const last = c.steps.items.length - 1;
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <SectionHeader
          id={headingId}
          question={c.steps.question}
          meta={c.steps.eyebrow}
          title={c.steps.title}
        />
        <ol className="mt-12 grid gap-8 sm:mt-14 lg:grid-cols-3 lg:gap-6">
          {c.steps.items.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 120} className="flex flex-col">
              <div className="flex items-center gap-3">
                <span
                  className={cx(
                    "inline-flex h-10 shrink-0 items-center px-4 font-rpk-mono text-[15px] tabular-nums",
                    index === last
                      ? cx(SHAPE.answer, "bg-rpk-signal text-rpk-ink")
                      : cx(SHAPE.question, "bg-rpk-ink text-white"),
                  )}
                >
                  {step.time}
                </span>
                {index < last && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 border-t-2 border-dotted border-rpk-haze lg:block"
                  />
                )}
              </div>
              <AnswerCard
                className={cx(
                  "mt-5 flex flex-1 flex-col p-6 sm:p-7",
                  tone === "white" && "ring-1 ring-rpk-mist/70",
                )}
              >
                <h3 className="text-[20px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-rpk-slate sm:text-[16px]">
                  {step.body}
                </p>
                <p className="mt-auto flex justify-end pt-5 text-rpk-signal-deep">
                  <ReadTicks />
                </p>
              </AnswerCard>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* ── Modules ────────────────────────────────────────────────────────────── */

function Modules({ c, tone }: { c: HomeContent; tone: Tone }) {
  const headingId = useId();
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            id={headingId}
            question={c.modules.question}
            meta={c.modules.eyebrow}
            title={c.modules.title}
            lede={c.modules.lede}
          />
          <ActionLink href="/pricing" variant="text" arrow className="self-start lg:self-auto">
            {c.modules.cta}
          </ActionLink>
        </div>
        <ul className="mt-12 columns-1 gap-6 sm:mt-14 md:columns-2 lg:columns-3">
          {c.modules.groups.map((group, index) => (
            <Reveal
              as="li"
              key={group.title}
              delay={(index % 3) * 90}
              className="mb-6 break-inside-avoid"
            >
              <article
                className={cx(
                  "p-6 sm:p-7",
                  index % 3 === 1
                    ? cx(SHAPE.questionCard, "bg-rpk-ink text-white")
                    : cx(
                        SHAPE.answerCard,
                        "bg-white shadow-rpk-card",
                        tone === "white" && "ring-1 ring-rpk-mist/70",
                      ),
                )}
              >
                <div className="flex items-center gap-3.5">
                  <IconBadge icon={group.icon} tone={index % 3 === 1 ? "signal" : "paper"} />
                  <h3 className="text-[19px] leading-[1.25] font-bold tracking-[-0.01em]">
                    {group.title}
                  </h3>
                </div>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className={cx(
                        "inline-flex min-h-9 items-center px-3.5 py-1.5 text-[14px] leading-[1.3] font-medium",
                        index % 3 === 1
                          ? cx(SHAPE.answerSoft, "bg-rpk-ink-raised text-white")
                          : cx(
                              SHAPE.answerSoft,
                              "bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset",
                            ),
                      )}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────── */

function FaqThread({ items }: { items: HomeContent["faq"]["items"] }) {
  const baseId = useId();
  const [open, setOpen] = useState<Record<number, "typing" | "open">>({});
  const timers = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const toggle = (index: number) => {
    window.clearTimeout(timers.current.get(index));
    if (open[index]) {
      setOpen(({ [index]: _closed, ...rest }) => rest);
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOpen((state) => ({ ...state, [index]: "open" }));
      return;
    }
    setOpen((state) => ({ ...state, [index]: "typing" }));
    timers.current.set(
      index,
      window.setTimeout(() => {
        setOpen((state) => (state[index] === "typing" ? { ...state, [index]: "open" } : state));
      }, 700),
    );
  };

  return (
    <ul className="space-y-5">
      {items.map((item, index) => {
        const state = open[index];
        const questionId = `${baseId}-q${index}`;
        const answerId = `${baseId}-a${index}`;
        return (
          <li key={item.q}>
            <h3>
              <button
                id={questionId}
                type="button"
                aria-expanded={!!state}
                aria-controls={answerId}
                onClick={() => toggle(index)}
                className={cx(
                  "group/faq inline-flex min-h-12 max-w-full items-center gap-3 py-3 pr-3 pl-5 text-left text-[16px] leading-[1.35] font-semibold transition-[transform,background-color,box-shadow] duration-200 ease-rpk-spring hover:-translate-y-px active:scale-[.98] sm:text-[17px]",
                  SHAPE.question,
                  state
                    ? "bg-rpk-ink text-white"
                    : "bg-rpk-ink text-white hover:shadow-[0_10px_24px_-12px_rgb(22_20_43/0.7)]",
                )}
              >
                <span className="min-w-0">{item.q}</span>
                <span
                  aria-hidden="true"
                  className={cx(
                    "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
                    state ? "bg-rpk-signal text-rpk-ink" : "bg-white/12 text-white",
                  )}
                >
                  <Plus
                    className={cx(
                      "size-4 transition-transform duration-200 ease-rpk-spring",
                      state && "rotate-45",
                    )}
                    strokeWidth={2.6}
                  />
                </span>
              </button>
            </h3>
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              aria-busy={state === "typing" || undefined}
              hidden={!state}
              className="mt-2 flex justify-end pl-8 sm:pl-20"
            >
              {state === "typing" ? (
                <AnswerPill as="span" className="tt-faq-answer min-w-[92px] justify-center">
                  <TypingDots className="tt-typing" />
                  <span className="sr-only">{THREAD_COPY.home.faqTyping}</span>
                </AnswerPill>
              ) : (
                <AnswerCard className="tt-faq-answer max-w-[38rem] px-6 py-5">
                  <p className="text-[16px] leading-[1.65] text-rpk-ink/85">{item.a}</p>
                </AnswerCard>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Faq({ c, tone }: { c: HomeContent; tone: Tone }) {
  const headingId = useId();
  return (
    <Section tone={tone} labelledBy={headingId}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              id={headingId}
              question={c.faq.question}
              meta={c.faq.eyebrow}
              title={c.faq.title}
            />
            <ActionLink href="/contact" variant="text" arrow className="mt-6">
              {THREAD_COPY.footer.answer}
            </ActionLink>
          </div>
          <FaqThread items={c.faq.items} />
        </div>
      </Container>
    </Section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */

const MARK = RESPOK_SYMBOL.thread;
const MARK_ANSWER = "path" in MARK.accent ? MARK.accent.path : "";

function FinalCta({ c, tone }: { c: HomeContent; tone: Tone }) {
  const auth = useRespokAuth();
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cx("py-16 sm:py-20 lg:py-24", tone === "paper" ? "bg-rpk-paper" : "bg-white")}
    >
      <Container wide>
        <div className="relative overflow-hidden rounded-[36px] rounded-ee-[10px] bg-rpk-ink px-5 py-16 text-center text-white sm:rounded-[48px] sm:rounded-ee-[12px] sm:px-12 sm:py-20 lg:py-28">
          {/* The brand cover: the two pills, huge and quiet, cropped by the edges. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 62 42"
            focusable="false"
            className="pointer-events-none absolute -top-24 -left-40 hidden w-[460px] md:block"
          >
            <path d={MARK.main} fill="#1F1C3A" />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="22 50 82 42"
            focusable="false"
            className="pointer-events-none absolute -right-40 -bottom-28 hidden w-[560px] md:block"
          >
            <path d={MARK_ANSWER} fill="#29264A" />
          </svg>
          <div className="relative">
            <Exchange
              className="mx-auto text-left"
              question={
                <Reveal effect="from-left">
                  <QuestionPill
                    tone="white"
                    className="min-h-16 px-7 py-4 text-[22px] leading-[1.2] font-bold sm:min-h-20 sm:px-9 sm:text-[32px] lg:min-h-24 lg:px-11 lg:text-[44px] lg:tracking-[-0.02em]"
                  >
                    {c.finalCta.question}
                  </QuestionPill>
                </Reveal>
              }
              answer={
                <Reveal effect="from-right" delay={160}>
                  <ActionLink
                    href={auth.ctaUrl}
                    arrow
                    className="!h-16 !px-8 !text-[20px] sm:!h-20 sm:!px-10 sm:!text-[26px] lg:!h-24 lg:!px-12 lg:!text-[32px]"
                  >
                    {c.hero.primaryCta}
                  </ActionLink>
                </Reveal>
              }
            />
            <h2
              id={headingId}
              className="mx-auto mt-14 max-w-[30ch] text-[28px] leading-[1.12] font-bold tracking-[-0.02em] text-balance sm:mt-16 sm:text-[36px]"
            >
              {c.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-[36rem] text-[17px] leading-[1.6] text-pretty text-white/70">
              {c.finalCta.lede}
            </p>
            <ActionLink
              href="/pricing"
              variant="text"
              arrow
              className="mt-5 !text-white hover:!text-white/80"
            >
              {c.hero.secondaryCta}
            </ActionLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function HomePage({ settings, seoOverride, apps }: HomePageData) {
  const { brand } = useRespok();
  const c = useContent(getHomeContent);
  const video = c.video;

  // Bands alternate White / Paper whatever the switches remove, so two neighbours
  // never share a background.
  const order: { key: string; render: (tone: Tone) => ReactNode }[] = [
    ...(apps.length > 0
      ? [{ key: "apps", render: (tone: Tone) => <Apps c={c} apps={apps} tone={tone} /> }]
      : []),
    { key: "chat", render: (tone: Tone) => <LiveChat c={c} tone={tone} /> },
    ...(video
      ? [{ key: "video", render: (tone: Tone) => <Calls video={video} tone={tone} /> }]
      : []),
    { key: "platform", render: (tone: Tone) => <Platform c={c} tone={tone} /> },
    { key: "steps", render: (tone: Tone) => <Steps c={c} tone={tone} /> },
    { key: "modules", render: (tone: Tone) => <Modules c={c} tone={tone} /> },
    { key: "faq", render: (tone: Tone) => <Faq c={c} tone={tone} /> },
    { key: "cta", render: (tone: Tone) => <FinalCta c={c} tone={tone} /> },
  ];

  return (
    <>
      <ThreadMotion />
      <JsonLd
        data={withOverride(seoOverride, homeJsonLd(settings, brand, c.hero.lede, c.faq.items))}
      />
      <Hero c={c} apps={apps} />
      <Channels c={c} />
      {order.map((section, index) => (
        <Fragment key={section.key}>{section.render(index % 2 === 0 ? "paper" : "white")}</Fragment>
      ))}
    </>
  );
}
