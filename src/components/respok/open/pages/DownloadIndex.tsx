import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AppDto } from "@/lib/apps.functions";
import { useContent, type ContentFlags } from "../../content";
import { getDownloadContent } from "../../content/download";
import { PLATFORM_EN, sortApps } from "../../shared/apps";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { downloadIndexJsonLd, withOverride } from "../../shared/structured";
import type { DownloadIndexPageData } from "../../types";
import { EmptyState } from "../blocks";
import { OPEN_COPY } from "../copy";
import { Card, ChapterHero, Container, Dot, Eyebrow, IconTile, SectionHeader } from "../ui";
import { PlatformTile, StoreBadge } from "../widget";
import { BALANCED_GRID, balancedSpans, cx, pad } from "../tokens";

export function DownloadIndexPage({ apps, settings, seoOverride }: DownloadIndexPageData) {
  const { brand, t } = useRespok();
  const list = sortApps(apps);
  const platforms = list.map((app) => app.platform).join(",");
  const build = useCallback(
    (flags: ContentFlags) =>
      getDownloadContent(flags, platforms ? (platforms.split(",") as AppDto["platform"][]) : []),
    [platforms],
  );
  const c = useContent(build);
  const spans = balancedSpans(list.length, 4);
  const perkSpans = balancedSpans(c.perks.length, 4);

  return (
    <>
      <JsonLd
        data={withOverride(
          seoOverride,
          downloadIndexJsonLd(
            settings,
            list.map((app) => ({
              app,
              name: t(app.name),
              description: t(app.shortDesc || app.subtitle || app.description),
            })),
          ),
        )}
      />
      <ChapterHero
        running={`${brand} · ${c.eyebrow}`}
        path="/download"
        question={c.question}
        eyebrow={c.eyebrow}
        title={c.title.join(" ")}
        lede={c.lede}
      >
        {list.length > 0 ? (
          <div className="mt-12">
            <p className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
              {OPEN_COPY.download.stores}
            </p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {list.map((app) => (
                <li key={app.id} className="w-full min-[480px]:w-auto">
                  <StoreBadge app={app} surface="ink" className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </ChapterHero>

      <section aria-labelledby="apps-title" className="bg-rpk-paper">
        <Container className="py-20 sm:py-28">
          <SectionHeader
            index="02"
            eyebrow={OPEN_COPY.download.apps}
            title={c.appsTitle}
            id="apps-title"
          />
          {list.length === 0 ? (
            <div className="mt-10">
              <EmptyState title={c.empty} />
            </div>
          ) : (
            <ul className={cx(BALANCED_GRID, "mt-10 sm:mt-12")}>
              {list.map((app, i) => {
                const subtitle = t(app.subtitle);
                return (
                  <li key={app.id} className={cx("min-w-0", spans[i])}>
                    <Reveal effect="corner" delay={i * 70} className="h-full">
                      <Card className="group/card relative flex h-full flex-col p-6 transition-shadow duration-300 hover:shadow-rpk-card sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <PlatformTile platform={app.platform} size={60} />
                          <span className="pt-1 text-right font-rpk-mono text-[12px] leading-[1.5] tracking-[0.08em] text-rpk-slate uppercase">
                            {PLATFORM_EN[app.platform].label}
                            {app.version ? (
                              <>
                                <br />
                                <span className="normal-case">
                                  v{app.version.replace(/^v/i, "")}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </div>
                        <h3 className="mt-8 text-[22px] leading-[1.2] font-bold tracking-[-0.015em] text-rpk-ink">
                          {t(app.name)}
                        </h3>
                        {subtitle ? (
                          <p className="mt-2 text-[15px] leading-[1.55] text-rpk-slate">
                            {subtitle}
                          </p>
                        ) : null}
                        <p className="mt-6 flex items-center gap-2 font-rpk-mono text-[12px] tracking-[0.06em] text-rpk-slate uppercase">
                          <Dot size={7} tone={app.downloadUrl ? "signal" : "away-ink"} />
                          {`${app.downloadUrl ? PLATFORM_EN[app.platform].action : PLATFORM_EN[app.platform].soon} ${PLATFORM_EN[app.platform].store}`}
                        </p>
                        <Link
                          to="/download/$slug"
                          params={{ slug: app.slug }}
                          aria-label={`${c.viewDetails}: ${t(app.name)}`}
                          className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-[6px] pt-6 text-[15px] font-semibold text-rpk-ink after:absolute after:inset-0 after:content-['']"
                        >
                          {c.viewDetails}
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-200 group-hover/card:translate-x-1"
                          />
                        </Link>
                      </Card>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>

      {/* 03 · Perks, as an Ink chapter. */}
      <section
        aria-labelledby="perks-title"
        className="relative isolate overflow-hidden bg-rpk-ink text-white"
      >
        <Container className="py-20 sm:py-28">
          <SectionHeader
            surface="ink"
            index="03"
            eyebrow={OPEN_COPY.download.perks}
            title={OPEN_COPY.download.perksTitle}
            id="perks-title"
          />
          <ul className={cx(BALANCED_GRID, "mt-10 sm:mt-12")}>
            {c.perks.map((perk, i) => (
              <li key={perk.title} className={cx("min-w-0", perkSpans[i])}>
                <Reveal delay={i * 70} className="h-full">
                  <div className="flex h-full flex-col rounded-[32px] rounded-br-[6px] bg-rpk-ink-soft p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      {perk.icon ? <IconTile icon={perk.icon} tone="glass" size={48} /> : null}
                      <Eyebrow surface="ink" as="span">
                        {pad(i + 1)}
                      </Eyebrow>
                    </div>
                    <h3 className="mt-8 text-[20px] leading-[1.25] font-bold tracking-[-0.01em]">
                      {perk.title}
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-[1.6] text-white/70">{perk.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
