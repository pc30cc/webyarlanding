import { Link } from "@tanstack/react-router";
import { ArrowRight, Mic, PhoneOff, Plus, Video } from "lucide-react";
import type { AppDto } from "@/lib/apps.functions";
import { LoopVideo } from "@/components/site/LoopVideo";
import { useContent } from "../../content";
import { getHomeContent, type ChannelCopy, type HomeContent } from "../../content/home";
import { PLATFORM_EN, sortApps } from "../../shared/apps";
import { useRespokAuth } from "../../shared/auth";
import { DeviceLineup } from "../../shared/DeviceLineup";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { homeJsonLd, withOverride } from "../../shared/structured";
import type { HomePageData } from "../../types";
import { CtaBubble, IndexRows } from "../blocks";
import { OPEN_COPY } from "../copy";
import {
  ActionLink,
  Card,
  Container,
  CornerDot,
  Dot,
  Eyebrow,
  GiantBubble,
  IconTile,
  QuestionBubble,
  SectionHeader,
} from "../ui";
import { ChatPanel, InboxCard, Launcher, PlatformTile, StoreBadge } from "../widget";
import { BALANCED_GRID, balancedSpans, cx, pad } from "../tokens";

/** Chapter numbers follow the sections that are really on the page. */
type Chapter = "channels" | "apps" | "chat" | "calls" | "platform" | "steps" | "modules" | "faq";

export function HomePage(data: HomePageData) {
  const { settings, brand } = useRespok();
  const c = useContent(getHomeContent);
  const apps = sortApps(data.apps);

  const chapters: Chapter[] = [
    "channels",
    ...(apps.length > 0 ? (["apps"] as const) : []),
    "chat",
    ...(c.video ? (["calls"] as const) : []),
    "platform",
    "steps",
    "modules",
    "faq",
  ];
  const n = (chapter: Chapter) => pad(chapters.indexOf(chapter) + 1);

  return (
    <>
      <JsonLd
        data={withOverride(data.seoOverride, homeJsonLd(settings, brand, c.hero.lede, c.faq.items))}
      />
      <Hero c={c} apps={apps} />
      <Channels c={c} index={n("channels")} />
      {apps.length > 0 ? <Apps c={c} apps={apps} index={n("apps")} /> : null}
      <LiveChat c={c} index={n("chat")} />
      {c.video ? <Calls video={c.video} index={n("calls")} /> : null}
      <Platform c={c} index={n("platform")} />
      <Steps c={c} index={n("steps")} />
      <Modules c={c} index={n("modules")} />
      <Faq c={c} index={n("faq")} />
      <FinalCta c={c} />
    </>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */

/** "…with one line of code." — the full stop becomes the Signal dot. */
function DotStop({ text }: { text: string }) {
  const match = /^(.*?)(\S+)\.$/.exec(text);
  if (!match) return <>{text}</>;
  return (
    <>
      {match[1]}
      <span className="whitespace-nowrap">
        {match[2]}
        <span className="sr-only">.</span>
        <span
          aria-hidden="true"
          className="rpk-o-pop ml-[0.07em] inline-block size-[0.19em] rounded-full bg-rpk-signal"
          style={{ animationDelay: "250ms" }}
        />
      </span>
    </>
  );
}

function Hero({ c, apps }: { c: HomeContent; apps: AppDto[] }) {
  const { brand } = useRespok();
  const auth = useRespokAuth();
  const [first = "", ...rest] = c.hero.title;

  return (
    <section
      aria-labelledby="home-title"
      className="relative isolate overflow-hidden bg-rpk-ink text-white"
    >
      <GiantBubble />
      <Container className="relative pb-16 sm:pb-24 lg:pb-28">
        <div className="flex items-center justify-between gap-4 border-b border-rpk-ink-line py-4 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
          <span className="min-w-0 truncate">
            {brand} · {c.hero.badge}
          </span>
          <span className="shrink-0">01</span>
        </div>

        <div className="grid items-center gap-14 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-20 xl:gap-12">
          <div className="min-w-0 lg:col-span-6">
            <Eyebrow surface="ink" className="flex items-center gap-2.5">
              <Dot size={8} className="rpk-o-live" />
              {c.hero.eyebrow}
            </Eyebrow>
            <h1
              id="home-title"
              className="mt-6 text-[44px] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-white sm:text-[60px] lg:text-[58px] xl:text-[70px]"
            >
              {first}{" "}
              {rest.map((line, index) => (
                <DotStop key={index} text={line} />
              ))}
            </h1>
            <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.6] text-white/72 sm:text-[19px]">
              {c.hero.lede}
            </p>
            <div className="mt-10 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
              <ActionLink to={auth.ctaUrl} variant="primary" size="lg">
                {c.hero.primaryCta}
              </ActionLink>
              <ActionLink to="/pricing" variant="secondary" surface="ink" size="lg">
                {c.hero.secondaryCta}
              </ActionLink>
            </div>
            <ul className="mt-10 grid gap-2.5 border-t border-rpk-ink-line pt-6 font-rpk-mono text-[12px] leading-[1.5] tracking-[0.06em] text-white/60 uppercase">
              <li className="flex items-start gap-3">
                <Dot size={6} className="mt-[5px]" />
                {c.hero.install}
              </li>
              <li className="flex items-start gap-3">
                <Dot size={6} tone="away" className="mt-[5px]" />
                {c.hero.note}
              </li>
            </ul>
            {apps.length > 0 ? (
              <div className="mt-10">
                <DeviceLineup
                  apps={apps}
                  brand={brand}
                  surface="ink"
                  avatars={c.chat.conversations.map((row) => row.avatar)}
                />
                <Link
                  to="/download"
                  className="group/apps mt-4 inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-semibold text-white"
                >
                  <span className="underline decoration-white/30 decoration-[1.5px] underline-offset-[5px] transition-colors group-hover/apps:decoration-rpk-signal">
                    {c.hero.appsCta}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-white/70 transition-transform group-hover/apps:translate-x-1"
                  />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 lg:col-span-6">
            <HeroWidget c={c} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Kit timing: the dot pops, then the panel grows out of the button's corner. */
const POP_AT = 300;
const OPEN_AT = 720;

/**
 * "Panel + button = the logo": a website with the launcher in its corner. The panel
 * opens up-left of the button with its square corner pointing back at it.
 */
function HeroWidget({ c }: { c: HomeContent }) {
  const { brand, callEnabled } = useRespok();
  const corner = "calc(var(--i) + var(--l) * 1.083)";
  return (
    <div
      role="img"
      aria-label={OPEN_COPY.mock.hero(brand)}
      className="relative mx-auto w-full max-w-[620px] [--i:14px] [--l:48px] sm:[--i:22px] sm:[--l:60px]"
    >
      <div className="relative h-[584px] overflow-hidden rounded-[28px] rounded-br-[8px] bg-rpk-paper shadow-[0_50px_100px_-40px_rgb(0_0_0/0.75)] sm:h-[620px]">
        <SiteSkeleton />
        <ChatPanel
          agent={c.hero.chat.agent}
          status={c.hero.chat.status}
          messages={c.hero.chat.messages}
          composer={c.hero.chat.composer}
          ending={callEnabled ? "call" : "typing"}
          start={OPEN_AT + 420}
          className="rpk-o-grow-br absolute h-[448px] sm:h-[460px]"
          style={{
            right: corner,
            bottom: corner,
            width: `min(332px, calc(100% - ${corner} - 14px))`,
            animationDelay: `${OPEN_AT}ms`,
          }}
        />
        <Launcher
          popAt={POP_AT}
          openAt={OPEN_AT}
          className="absolute"
          style={{ right: "var(--i)", bottom: "var(--i)" }}
        />
      </div>
    </div>
  );
}

/** Someone else's website: a quiet wireframe the widget lives on. */
function SiteSkeleton() {
  const bar = "rounded-full bg-rpk-haze";
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-rpk-mist bg-[#ECEBF2] px-4 sm:h-11">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-rpk-away/70" />
          <span className="size-2.5 rounded-full bg-rpk-away/70" />
          <span className="size-2.5 rounded-full bg-rpk-away/70" />
        </span>
        <span className="h-5 w-[46%] max-w-[240px] rounded-full bg-white" />
      </div>
      <div className="flex-1 px-6 pt-7 sm:px-9 sm:pt-9">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="size-5 rounded-[8px] rounded-br-[2px] bg-rpk-ink/85" />
            <span className={cx(bar, "h-2.5 w-14")} />
          </span>
          <span className={cx(bar, "hidden h-2 w-32 sm:block")} />
        </div>
        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2">
          <div>
            <span className={cx(bar, "block h-6 w-[88%] rounded-[10px]")} />
            <span className={cx(bar, "mt-3 block h-6 w-[62%] rounded-[10px]")} />
            <span className={cx(bar, "mt-5 block h-2 w-[92%] bg-rpk-mist")} />
            <span className={cx(bar, "mt-2 block h-2 w-[70%] bg-rpk-mist")} />
            <span className="mt-6 flex gap-2">
              <span className="h-8 w-24 rounded-[12px] rounded-br-[3px] bg-rpk-haze" />
              <span className="h-8 w-16 rounded-[12px] rounded-br-[3px] bg-rpk-mist" />
            </span>
          </div>
          <span className="hidden h-[150px] rounded-[20px] rounded-br-[6px] bg-[#E8E7F0] sm:block" />
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 sm:mt-10">
          <span className="h-24 rounded-[16px] rounded-br-[4px] bg-white" />
          <span className="h-24 rounded-[16px] rounded-br-[4px] bg-white" />
          <span className="h-24 rounded-[16px] rounded-br-[4px] bg-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── 01 · Channels ─────────────────────────────────────────────────────── */

/** OpenCart's simplified cart is a line drawing; every other mark is a filled logo. */
const STROKED_MARKS = new Set(["OpenCart"]);

function ChannelMark({ item }: { item: ChannelCopy }) {
  if (item.img) {
    return <img src={item.img} alt="" width={28} height={28} className="size-7" />;
  }
  const stroked = STROKED_MARKS.has(item.name);
  return (
    <svg
      viewBox={item.viewBox ?? "0 0 24 24"}
      aria-hidden="true"
      focusable="false"
      className={stroked ? "size-6" : "size-7"}
      fill={stroked ? "none" : `#${item.hex}`}
      stroke={stroked ? `#${item.hex}` : undefined}
      strokeWidth={stroked ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={item.path} />
    </svg>
  );
}

function Channels({ c, index }: { c: HomeContent; index: string }) {
  const groups = (["inbox", "email", "store"] as const)
    .map((kind) => ({
      kind,
      title: c.channels.groups[kind],
      items: c.channels.items.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section aria-labelledby="channels-title" className="bg-rpk-paper">
      <Container className="py-20 sm:py-28">
        <SectionHeader
          index={index}
          eyebrow={c.channels.eyebrow}
          title={c.channels.title}
          lede={c.channels.lede}
          id="channels-title"
        />
        <div className="mt-12 sm:mt-16">
          {groups.map((group, groupIndex) => (
            <Reveal
              key={group.kind}
              delay={groupIndex * 80}
              className="grid gap-x-10 gap-y-5 border-t border-rpk-mist py-7 last:border-b md:grid-cols-12 md:items-center"
            >
              <h3 className="flex items-center gap-3 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase md:col-span-4 lg:col-span-3">
                <span className="text-rpk-ink">{group.title}</span>
                <span aria-hidden="true">·</span>
                <span>{pad(group.items.length)}</span>
              </h3>
              <ul className="flex flex-wrap gap-2.5 sm:gap-3 md:col-span-8 lg:col-span-9">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="group/chip inline-flex h-[60px] items-center gap-3 rounded-[20px] rounded-br-[6px] bg-white py-2 pr-5 pl-2 shadow-[0_1px_0_rgb(22_20_43/0.05)] transition-[transform,box-shadow] duration-300 ease-rpk-spring hover:-translate-y-0.5 hover:shadow-rpk-card sm:h-16 sm:pr-6 sm:pl-2.5"
                  >
                    <span className="grid size-11 place-items-center rounded-[14px] rounded-br-[4px] bg-rpk-paper">
                      <ChannelMark item={item} />
                    </span>
                    <span className="text-[15px] font-semibold text-rpk-ink sm:text-[16px]">
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─── 02 · Apps ─────────────────────────────────────────────────────────── */

function Apps({ c, apps, index }: { c: HomeContent; apps: AppDto[]; index: string }) {
  const { t } = useRespok();
  const spans = balancedSpans(apps.length, 4);
  return (
    <section
      aria-labelledby="apps-title"
      className="relative isolate overflow-hidden bg-rpk-ink text-white"
    >
      <Container className="py-20 sm:py-28">
        <SectionHeader
          surface="ink"
          index={index}
          eyebrow={c.apps.eyebrow}
          title={c.apps.title}
          lede={c.apps.lede}
          id="apps-title"
        >
          <Link
            to="/download"
            className="group/all mt-6 inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-semibold text-white"
          >
            <Dot size={7} />
            <span className="underline decoration-white/30 decoration-[1.5px] underline-offset-[5px] group-hover/all:decoration-rpk-signal">
              {c.apps.allApps}
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover/all:translate-x-1"
            />
          </Link>
        </SectionHeader>

        <ul className={cx(BALANCED_GRID, "mt-12 sm:mt-14")}>
          {apps.map((app, i) => {
            const subtitle = t(app.subtitle);
            return (
              <li key={app.id} className={cx("min-w-0", spans[i])}>
                <Reveal effect="corner" delay={i * 70} className="h-full">
                  <article className="relative isolate flex h-full flex-col overflow-hidden rounded-[32px] rounded-br-[6px] bg-rpk-ink-soft p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <PlatformTile platform={app.platform} tone="white" size={56} />
                      <span className="pt-1 text-right font-rpk-mono text-[12px] leading-[1.5] tracking-[0.08em] text-white/60 uppercase">
                        {PLATFORM_EN[app.platform].label}
                        {app.version ? (
                          <>
                            <br />
                            <span className="normal-case">v{app.version.replace(/^v/i, "")}</span>
                          </>
                        ) : null}
                      </span>
                    </div>
                    <h3 className="mt-6 text-[22px] leading-[1.2] font-bold tracking-[-0.01em] sm:mt-8">
                      <Link
                        to="/download/$slug"
                        params={{ slug: app.slug }}
                        className="rounded-[4px] underline decoration-transparent decoration-2 underline-offset-[6px] transition-colors hover:decoration-rpk-signal"
                      >
                        {t(app.name)}
                      </Link>
                    </h3>
                    {subtitle ? (
                      <p className="mt-2 text-[15px] leading-[1.55] text-white/68">{subtitle}</p>
                    ) : null}
                    <div className="mt-auto pt-6 sm:pt-8">
                      <StoreBadge app={app} surface="ink" className="w-full" />
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ─── 03 · Live chat (#features) ────────────────────────────────────────── */

function LiveChat({ c, index }: { c: HomeContent; index: string }) {
  const { brand } = useRespok();
  return (
    <section id="features" aria-labelledby="chat-title" className="scroll-mt-20 bg-white">
      <Container className="py-20 sm:py-28">
        <SectionHeader
          index={index}
          eyebrow={c.chat.eyebrow}
          title={c.chat.title}
          lede={c.chat.lede}
          id="chat-title"
        />
        <div className="mt-12 grid gap-14 sm:mt-16 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-6 xl:col-span-5">
            <IndexRows items={c.chat.features} />
          </div>
          <div className="min-w-0 lg:col-span-6 xl:col-span-6 xl:col-start-7">
            <div className="lg:sticky lg:top-28">
              <Reveal effect="corner">
                <div className="relative mr-5 rounded-[40px] rounded-br-[6px] bg-rpk-paper p-4 sm:mr-7 sm:p-8">
                  <div role="img" aria-label={OPEN_COPY.mock.inbox(brand)}>
                    <InboxCard conversations={c.chat.conversations} />
                  </div>
                  <CornerDot size={22} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─── 04 · Calls ────────────────────────────────────────────────────────── */

function Calls({ video, index }: { video: NonNullable<HomeContent["video"]>; index: string }) {
  const control =
    "grid size-11 place-items-center rounded-full text-white backdrop-blur-md sm:size-12";
  return (
    <section
      aria-labelledby="calls-title"
      className="relative isolate overflow-hidden bg-rpk-ink text-white"
    >
      <Container className="py-20 sm:py-28">
        <SectionHeader
          surface="ink"
          index={index}
          eyebrow={video.eyebrow}
          title={video.title}
          lede={video.lede}
          id="calls-title"
        />
        <div className="mt-12 grid gap-14 sm:mt-16 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-7">
            <Reveal effect="corner">
              <figure className="relative mr-6 sm:mr-8">
                <div className="relative overflow-hidden rounded-[40px] rounded-br-[6px] bg-rpk-ink-soft ring-1 ring-white/10">
                  <LoopVideo
                    src={video.video.src}
                    poster={video.video.poster}
                    title={OPEN_COPY.mock.call}
                    width={960}
                    height={540}
                    className="block aspect-video w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-rpk-ink/70 to-transparent pt-16 pb-5 sm:pb-6"
                  >
                    <span className={cx(control, "bg-rpk-ink/60")}>
                      <Mic className="size-5" strokeWidth={2} />
                    </span>
                    <span className={cx(control, "bg-rpk-ink/60")}>
                      <Video className="size-5" strokeWidth={2} />
                    </span>
                    <span className={cx(control, "bg-rpk-signal-deep")}>
                      <PhoneOff className="size-5" strokeWidth={2} />
                    </span>
                  </div>
                </div>
                <CornerDot size={24} />
              </figure>
            </Reveal>
          </div>
          <div className="min-w-0 lg:col-span-5">
            <IndexRows surface="ink" items={video.features} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─── 05 · Platform ─────────────────────────────────────────────────────── */

function Platform({ c, index }: { c: HomeContent; index: string }) {
  const features = c.platform.features;
  const spans = balancedSpans(features.length, 3);
  return (
    <section aria-labelledby="platform-title" className="bg-rpk-paper">
      <Container className="py-20 sm:py-28">
        <SectionHeader
          index={index}
          eyebrow={c.platform.eyebrow}
          title={c.platform.title}
          lede={c.platform.lede}
          id="platform-title"
        />
        <ul className={cx(BALANCED_GRID, "mt-12 sm:mt-16")}>
          {features.map((feature, i) => (
            <li key={feature.title} className={cx("min-w-0", spans[i])}>
              <Reveal delay={(i % 3) * 70} className="h-full">
                <Card className="group/card relative flex h-full flex-col p-6 sm:p-8">
                  <span className="absolute top-6 right-6 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate sm:top-8 sm:right-8">
                    {pad(i + 1)}
                  </span>
                  <div className="flex items-center gap-4 pr-10 sm:block sm:pr-0">
                    {feature.icon ? (
                      <IconTile
                        icon={feature.icon}
                        size={44}
                        className="transition-colors duration-300 group-hover/card:bg-rpk-signal group-hover/card:text-rpk-ink"
                      />
                    ) : null}
                    <h3 className="text-[19px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink sm:mt-7 sm:text-[21px]">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[16px] leading-[1.6] text-rpk-slate">{feature.body}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ─── 06 · Steps ────────────────────────────────────────────────────────── */

/**
 * A dotted line at 45° from the numeral's corner to a dot, like the logo's construction
 * axis: an empty ring until the last step, where the dot goes live.
 */
function Connector({ live }: { live: boolean }) {
  return (
    <svg
      viewBox="0 0 72 72"
      aria-hidden="true"
      focusable="false"
      className="mt-[0.62em] size-[0.5em] shrink-0 overflow-visible"
    >
      <line
        x1="2"
        y1="2"
        x2="52"
        y2="52"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="0.1 9"
        className="text-rpk-slate"
      />
      {live ? (
        <circle cx="62" cy="62" r="10" fill="#FF5A3C" />
      ) : (
        <circle cx="62" cy="62" r="8.5" fill="none" stroke="#A9A7BC" strokeWidth="3" />
      )}
    </svg>
  );
}

function Steps({ c, index }: { c: HomeContent; index: string }) {
  const items = c.steps.items;
  return (
    <section aria-labelledby="steps-title" className="bg-white">
      <Container className="py-20 sm:py-28">
        <SectionHeader
          index={index}
          eyebrow={c.steps.eyebrow}
          title={c.steps.title}
          id="steps-title"
        />
        <ol className="mt-14 grid gap-14 sm:mt-20 md:grid-cols-3 md:gap-8 lg:gap-12">
          {items.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 120} className="min-w-0">
              <div className="flex items-start text-[112px] sm:text-[132px] lg:text-[156px]">
                <span
                  aria-hidden="true"
                  className="font-rpk-mono leading-[0.8] tracking-[-0.06em] text-rpk-ink"
                >
                  {pad(i + 1)}
                </span>
                <Connector live={i === items.length - 1} />
              </div>
              <p className="mt-8 flex items-center gap-2 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                <span className="text-rpk-ink">{step.time}</span>
              </p>
              <h3 className="mt-3 text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink">
                <span className="sr-only">{pad(i + 1)}. </span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-[36ch] text-[16px] leading-[1.6] text-rpk-slate">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ─── 07 · Modules ──────────────────────────────────────────────────────── */

function Modules({ c, index }: { c: HomeContent; index: string }) {
  const groups = c.modules.groups;
  const spans = balancedSpans(groups.length, 3);
  return (
    <section
      aria-labelledby="modules-title"
      className="relative isolate overflow-hidden bg-rpk-ink text-white"
    >
      <Container className="py-20 sm:py-28">
        <SectionHeader
          surface="ink"
          index={index}
          eyebrow={c.modules.eyebrow}
          title={c.modules.title}
          lede={c.modules.lede}
          id="modules-title"
        >
          <Link
            to="/pricing"
            className="group/cta mt-6 inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-semibold text-white"
          >
            <Dot size={7} />
            <span className="underline decoration-white/30 decoration-[1.5px] underline-offset-[5px] group-hover/cta:decoration-rpk-signal">
              {c.modules.cta}
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover/cta:translate-x-1"
            />
          </Link>
        </SectionHeader>
        <ul className={cx(BALANCED_GRID, "mt-12 sm:mt-16")}>
          {groups.map((group, i) => (
            <li key={group.title} className={cx("min-w-0", spans[i])}>
              <Reveal effect="corner" delay={(i % 3) * 70} className="h-full">
                <article className="group/mod flex h-full flex-col rounded-[32px] rounded-br-[6px] bg-rpk-ink-soft p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <IconTile icon={group.icon} tone="glass" size={48} />
                    <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/55">
                      {pad(i + 1)} / {pad(groups.length)}
                    </span>
                  </div>
                  <h3 className="mt-7 text-[21px] leading-[1.25] font-bold tracking-[-0.01em]">
                    {group.title}
                  </h3>
                  <ul className="mt-5 border-t border-rpk-ink-line">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 border-b border-rpk-ink-line py-3 text-[15px] leading-[1.45] text-white/80 last:border-b-0"
                      >
                        <Dot size={6} className="mt-[7px]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ─── 08 · FAQ ──────────────────────────────────────────────────────────── */

function Faq({ c, index }: { c: HomeContent; index: string }) {
  return (
    <section aria-labelledby="faq-title" className="bg-rpk-paper">
      <Container className="pt-20 pb-16 sm:pt-28 sm:pb-24">
        <SectionHeader index={index} eyebrow={c.faq.eyebrow} title={c.faq.title} id="faq-title" />
        <div className="mt-10 border-t border-rpk-mist sm:mt-14">
          {c.faq.items.map((faq, i) => (
            <details key={faq.q} className="group/faq border-b border-rpk-mist">
              <summary className="grid cursor-pointer list-none grid-cols-[40px_minmax(0,1fr)_40px] items-start gap-x-3 rounded-[6px] py-6 sm:py-7 md:grid-cols-12 md:gap-x-10 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="flex items-center gap-2.5 pt-1.5 font-rpk-mono text-[12px] tracking-[0.06em] text-rpk-slate md:col-span-4 lg:col-span-3"
                >
                  {pad(i + 1)}
                  <Dot
                    size={8}
                    tone="away-ink"
                    className="hidden transition-[background-color,border-color] duration-300 group-open/faq:border-rpk-signal group-open/faq:bg-rpk-signal md:inline-block"
                  />
                </span>
                <span className="text-[19px] leading-[1.3] font-bold tracking-[-0.01em] text-rpk-ink sm:text-[22px] md:col-span-7 lg:col-span-8">
                  {faq.q}
                </span>
                <span
                  aria-hidden="true"
                  className="-mt-1.5 grid size-10 place-items-center justify-self-end rounded-full border border-rpk-ink/15 text-rpk-ink transition-[transform,background-color,color,border-color] duration-300 ease-rpk-spring group-open/faq:rotate-45 group-open/faq:border-rpk-ink group-open/faq:bg-rpk-ink group-open/faq:text-white md:col-span-1"
                >
                  <Plus className="size-4" strokeWidth={2.25} />
                </span>
              </summary>
              <div className="grid pb-8 pl-[52px] md:grid-cols-12 md:gap-x-10 md:pl-0">
                <p className="max-w-[62ch] text-[17px] leading-[1.65] text-rpk-slate md:col-span-7 md:col-start-5 lg:col-start-4">
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─── Final CTA ─────────────────────────────────────────────────────────── */

function FinalCta({ c }: { c: HomeContent }) {
  const auth = useRespokAuth();
  return (
    <section aria-labelledby="cta-title" className="bg-rpk-paper">
      <Container className="pt-4 pb-24 sm:pb-32">
        <CtaBubble
          lead={<QuestionBubble className="mb-10 sm:mb-14">{c.finalCta.question}</QuestionBubble>}
          title={c.finalCta.title}
          titleId="cta-title"
          body={c.finalCta.lede}
          actions={
            <>
              <ActionLink to={auth.ctaUrl} variant="primary" size="lg">
                {c.hero.primaryCta}
              </ActionLink>
              <ActionLink to="/pricing" variant="secondary" surface="ink" size="lg">
                {c.hero.secondaryCta}
              </ActionLink>
            </>
          }
        />
      </Container>
    </section>
  );
}
