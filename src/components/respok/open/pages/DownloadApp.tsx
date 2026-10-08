import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AppDto } from "@/lib/apps.functions";
import { useContent, type ContentFlags } from "../../content";
import { getDownloadContent } from "../../content/download";
import { getHomeContent } from "../../content/home";
import { PLATFORM_EN, sortApps } from "../../shared/apps";
import { useRespok } from "../../shared/context";
import { isAllowedText } from "../../shared/gating";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { appJsonLd, breadcrumbs } from "../../shared/structured";
import type { DownloadAppPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { Badge, Card, Container, CornerDot, Dot, Eyebrow, GiantBubble, SectionHeader } from "../ui";
import { AppIllustration, PlatformTile, StoreBadge } from "../widget";
import { BALANCED_GRID, balancedSpans, cx, displayClass, pad } from "../tokens";

export function DownloadAppPage({ app, others, settings }: DownloadAppPageData) {
  const { brand, t, callEnabled, aiEnabled } = useRespok();
  const platforms = [app.platform, ...others.map((o) => o.platform)].join(",");
  const build = useCallback(
    (flags: ContentFlags) =>
      getDownloadContent(flags, platforms.split(",") as AppDto["platform"][]),
    [platforms],
  );
  const c = useContent(build);
  const home = useContent(getHomeContent);
  const flags = { callEnabled, aiEnabled };

  const name = t(app.name);
  const subtitle = t(app.subtitle);
  const about = t(app.description || app.shortDesc);
  const features = app.features
    .filter((feature) => isAllowedText(flags, feature, t(feature)))
    .map((feature) => t(feature));
  const shots = app.screenshots.map((src) => src.trim()).filter(Boolean);
  const devices = sortApps(others);
  const platform = PLATFORM_EN[app.platform];

  const chips = [
    { label: OPEN_COPY.download.platform, value: platform.label },
    ...(app.version ? [{ label: c.app.version, value: app.version }] : []),
    ...(app.size ? [{ label: c.app.size, value: t(app.size) }] : []),
    ...(app.minOs ? [{ label: c.app.requires, value: t(app.minOs) }] : []),
  ];

  // In the app the operator writes the replies: the hero conversation, seen from inside.
  const conversations = home.chat.conversations;
  const messages = home.hero.chat.messages;

  // Chapters after the hero (01) follow the sections that are really there.
  const hasAbout = !!about || features.length > 0;
  const indexOf = { preview: pad(2), about: pad(3), others: pad(hasAbout ? 4 : 3) };
  const spans = balancedSpans(devices.length, 3);

  return (
    <>
      <JsonLd
        data={[
          appJsonLd(settings, app, name, t(app.shortDesc || app.subtitle || app.description)),
          breadcrumbs(settings, [
            { name: "Home", path: "/" },
            { name: c.app.back, path: "/download" },
            { name, path: `/download/${app.slug}` },
          ]),
        ]}
      />

      <section className="relative isolate overflow-hidden bg-rpk-ink text-white">
        <GiantBubble size="md" />
        <Container className="relative pb-20 sm:pb-24">
          <div className="flex items-center justify-between gap-4 border-b border-rpk-ink-line py-3">
            <Link
              to="/download"
              className="group/back -ml-1 inline-flex min-h-11 items-center gap-2 rounded-[6px] px-1 font-rpk-mono text-[12px] tracking-[0.08em] text-white/70 uppercase transition-colors hover:text-white"
            >
              <ArrowLeft
                aria-hidden="true"
                className="size-4 transition-transform group-hover/back:-translate-x-1"
              />
              {c.app.back}
            </Link>
            <span
              dir="ltr"
              className="min-w-0 truncate font-rpk-mono text-[12px] tracking-[0.08em] text-white/60"
            >
              /download/{app.slug}
            </span>
          </div>

          <div className="pt-12 sm:pt-16 lg:pt-20">
            <PlatformTile platform={app.platform} tone="white" size={88} />
            <Eyebrow surface="ink" index="01" className="mt-10">
              {platform.label}
            </Eyebrow>
            <h1 className={cx(displayClass("lg"), "mt-5 max-w-[16ch] text-balance text-white")}>
              {name}
            </h1>
            {subtitle ? (
              <p className="mt-5 max-w-[50ch] text-[18px] leading-[1.55] text-white/72 sm:text-[20px]">
                {subtitle}
              </p>
            ) : null}
            <ul className="mt-8 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Badge tone="glass" className="normal-case">
                    <span className="text-white/55 uppercase">{chip.label}</span>
                    <span className="text-white">{chip.value}</span>
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <StoreBadge app={app} surface="ink" className="w-full min-[480px]:w-auto" />
            </div>
          </div>
        </Container>
      </section>

      {/* Preview: the real screenshots, or the app drawn by the template. */}
      <section aria-labelledby="preview-title" className="bg-rpk-paper">
        <Container className="py-20 sm:py-28">
          <SectionHeader
            index={indexOf.preview}
            eyebrow={OPEN_COPY.download.preview}
            title={c.app.preview}
            id="preview-title"
          />
          {shots.length > 0 ? (
            <div
              role="region"
              aria-label={OPEN_COPY.download.gallery(name)}
              tabIndex={0}
              className="mt-10 -mr-4 overflow-x-auto pb-4 sm:-mr-6 sm:mt-12 lg:-mr-10"
            >
              <ul className="flex snap-x snap-mandatory gap-4 pr-4 sm:gap-6 sm:pr-6 lg:pr-10">
                {shots.map((src, i) => (
                  <li key={`${src}-${i}`} className="shrink-0 snap-start">
                    <img
                      src={src}
                      alt={c.app.screenshot(name, i + 1)}
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding="async"
                      className="block h-[440px] w-auto max-w-[86vw] rounded-[28px] rounded-br-[6px] border border-rpk-mist bg-white object-contain sm:h-[540px]"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Reveal effect="corner" className="mt-10 sm:mt-12">
              <div className="relative mr-6 rounded-[40px] rounded-br-[8px] bg-rpk-haze/60 px-4 py-10 sm:mr-9 sm:px-10 sm:py-14 lg:px-16">
                <AppIllustration
                  platform={app.platform}
                  conversations={conversations}
                  messages={messages}
                  label={OPEN_COPY.mock.app(name)}
                />
                <CornerDot size={24} />
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {hasAbout ? (
        <section aria-labelledby="about-title" className="bg-white">
          <Container className="py-20 sm:py-28">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
              {about ? (
                <div className="min-w-0 lg:col-span-7">
                  <div className="border-t-2 border-rpk-ink pt-5">
                    <Eyebrow index={indexOf.about}>{name}</Eyebrow>
                  </div>
                  <h2
                    id="about-title"
                    className="mt-6 text-[30px] leading-[1.1] font-extrabold tracking-[-0.025em] text-rpk-ink sm:text-[36px]"
                  >
                    {c.app.about}
                  </h2>
                  <p className="mt-6 max-w-[62ch] text-[18px] leading-[1.7] whitespace-pre-line text-rpk-slate">
                    {about}
                  </p>
                </div>
              ) : null}
              {features.length > 0 ? (
                <div
                  className={cx(
                    "min-w-0",
                    about ? "lg:col-span-4 lg:col-start-9" : "lg:col-span-8",
                  )}
                >
                  <div className="relative mr-6">
                    <Card tone="paper" size="xl" className="p-7 sm:p-9">
                      <h2
                        {...(about ? {} : { id: "about-title" })}
                        className="text-[22px] leading-[1.2] font-bold tracking-[-0.015em] text-rpk-ink"
                      >
                        {c.app.features}
                      </h2>
                      <ul className="mt-5 border-t border-rpk-mist">
                        {features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-3 border-b border-rpk-mist py-3.5 text-[16px] leading-[1.5] text-rpk-ink last:border-b-0"
                          >
                            <Dot size={7} className="mt-[8px]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </Card>
                    <CornerDot size={18} />
                  </div>
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      ) : null}

      {devices.length > 0 ? (
        <section aria-labelledby="devices-title" className="bg-rpk-paper">
          <Container className="py-20 sm:py-28">
            <SectionHeader
              index={indexOf.others}
              eyebrow={OPEN_COPY.download.apps}
              title={c.app.others}
              id="devices-title"
            />
            <ul className={cx(BALANCED_GRID, "mt-10 sm:mt-12")}>
              {devices.map((device, i) => {
                const deviceName = t(device.name);
                return (
                  <li key={device.id} className={cx("min-w-0", spans[i])}>
                    <Link
                      to="/download/$slug"
                      params={{ slug: device.slug }}
                      className="group/dev flex h-full items-center gap-5 rounded-[28px] rounded-br-[6px] bg-white p-5 transition-shadow duration-300 hover:shadow-rpk-card sm:p-6"
                    >
                      <PlatformTile platform={device.platform} size={56} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                          {PLATFORM_EN[device.platform].label}
                          {device.version ? ` · v${device.version.replace(/^v/i, "")}` : ""}
                        </span>
                        <span className="mt-1 block truncate text-[18px] font-bold tracking-[-0.01em] text-rpk-ink">
                          {deviceName}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-rpk-slate transition-transform group-hover/dev:translate-x-1 group-hover/dev:text-rpk-ink"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
