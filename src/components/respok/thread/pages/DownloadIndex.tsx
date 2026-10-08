import { useCallback, useId } from "react";
import type { AppPlatform } from "@/lib/apps.functions";
import type { DownloadIndexPageData } from "../../types";
import { useContent, type ContentFlags } from "../../content";
import { getDownloadContent } from "../../content/download";
import { PLATFORM_EN, sortApps } from "../../shared/apps";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { downloadIndexJsonLd, withOverride } from "../../shared/structured";
import { AppCard, StoreBadge } from "../apps";
import { THREAD_COPY } from "../copy";
import { cx } from "../classes";
import { AppIllustration } from "../illustration";
import { useEnglishText } from "../labels";
import {
  AnswerCard,
  AnswerPill,
  Container,
  Exchange,
  IconBadge,
  PageOpener,
  QuestionPill,
  Section,
  SectionHeader,
} from "../ui";

export function DownloadIndexPage({ settings, seoOverride, apps }: DownloadIndexPageData) {
  const { brand } = useRespok();
  const en = useEnglishText();
  const sorted = sortApps(apps);
  const platformKey = sorted.map((app) => app.platform).join(",");
  const build = useCallback(
    (flags: ContentFlags) =>
      getDownloadContent(flags, platformKey ? (platformKey.split(",") as AppPlatform[]) : []),
    [platformKey],
  );
  const c = useContent(build);
  const appsId = useId();
  const perksId = useId();
  const first = sorted[0];

  const jsonLd = downloadIndexJsonLd(
    settings,
    sorted.map((app) => ({
      app,
      name: en(app.name, `${brand} for ${PLATFORM_EN[app.platform].label}`),
      description: en(app.shortDesc) || en(app.subtitle),
    })),
  );

  return (
    <>
      <JsonLd data={withOverride(seoOverride, jsonLd)} />
      <PageOpener
        question={c.question}
        eyebrow={c.eyebrow}
        title={c.title.map((line) => (
          <span key={line} className="sm:block">
            {line}{" "}
          </span>
        ))}
        lede={c.lede}
        titleSize={first ? "md" : "lg"}
        meta={
          sorted.length > 0 && (
            <ul
              aria-label={THREAD_COPY.download.storesLabel}
              className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3"
            >
              {sorted.map((app) => (
                <li key={app.id} className="min-w-0">
                  <StoreBadge app={app} className="w-full sm:w-auto" />
                </li>
              ))}
            </ul>
          )
        }
        aside={
          first ? (
            <AppIllustration
              platform={
                first.platform === "ios" || first.platform === "android" ? first.platform : "ios"
              }
              label={THREAD_COPY.download.illustration(`${brand} app`)}
              className="hidden lg:block"
            />
          ) : undefined
        }
      />

      <Section tone="paper" labelledBy={appsId}>
        <Container>
          {sorted.length === 0 ? (
            <div className="py-4">
              <h2 id={appsId} className="sr-only">
                {c.appsTitle}
              </h2>
              <Exchange
                question={<QuestionPill size="lg">{c.question}</QuestionPill>}
                answer={
                  <AnswerPill size="lg" away>
                    {c.empty}
                  </AnswerPill>
                }
              />
            </div>
          ) : (
            <>
              <SectionHeader
                id={appsId}
                question={THREAD_COPY.download.appsQuestion}
                title={c.appsTitle}
              />
              <ul
                className={cx(
                  "mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:gap-6",
                  sorted.length === 1 && "sm:max-w-sm sm:grid-cols-1",
                  sorted.length === 3 && "lg:grid-cols-3",
                  sorted.length >= 4 && "lg:grid-cols-4",
                )}
              >
                {sorted.map((app, index) => (
                  <Reveal as="li" key={app.id} delay={(index % 4) * 80}>
                    <AppCard app={app} headingLevel="h3" detailsLabel={c.viewDetails} />
                  </Reveal>
                ))}
              </ul>
            </>
          )}
        </Container>
      </Section>

      <Section tone="white" labelledBy={perksId}>
        <Container>
          <Reveal effect="from-left">
            <QuestionPill as="h2" size="lg">
              <span id={perksId}>{THREAD_COPY.download.perksQuestion}</span>
            </QuestionPill>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {c.perks.map((perk, index) => (
              <Reveal as="li" key={perk.title} effect="from-right" delay={index * 90}>
                <AnswerCard className="h-full p-6 ring-1 ring-rpk-mist/70 sm:p-7">
                  {perk.icon && (
                    <IconBadge icon={perk.icon} tone={index === 0 ? "signal" : "soft"} />
                  )}
                  <h3 className="mt-6 text-[19px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-pretty text-rpk-slate">
                    {perk.body}
                  </p>
                </AnswerCard>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
