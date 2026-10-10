import { useCallback, useId } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { AppPlatform } from "@/lib/apps.functions";
import type { DownloadAppPageData } from "../../types";
import { useContent, type ContentFlags } from "../../content";
import { getDownloadContent } from "../../content/download";
import { PLATFORM_EN, sortApps } from "../../shared/apps";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { appJsonLd } from "../../shared/structured";
import { AppCard, AppIcon, StoreBadge } from "../apps";
import { THREAD_COPY } from "../copy";
import { SHAPE, TYPE, cx } from "../classes";
import { AppIllustration } from "../illustration";
import { useEnglishText, useGatedList } from "../labels";
import { AnswerCard, CheckList, Container, PageOpener, Section, SectionHeader } from "../ui";

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <li
      className={cx(
        "inline-flex h-9 items-center gap-2 bg-rpk-paper px-3.5 text-[13px] ring-1 ring-rpk-mist ring-inset",
        SHAPE.question,
      )}
    >
      <span className="font-rpk-mono text-[11px] tracking-[0.08em] text-rpk-slate uppercase">
        {label}
      </span>
      <span className="font-semibold text-rpk-ink">{value}</span>
    </li>
  );
}

function Gallery({ shots, name, mobile }: { shots: string[]; name: string; mobile: boolean }) {
  const copy = useContent(useCallback((flags: ContentFlags) => getDownloadContent(flags), []));
  return (
    <div
      role="region"
      aria-label={THREAD_COPY.download.gallery(name)}
      tabIndex={0}
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-6 [scrollbar-width:thin] sm:mx-0 sm:px-0"
    >
      {shots.map((src, index) => (
        <figure
          key={src}
          className={cx(
            "m-0 shrink-0 snap-start overflow-hidden bg-rpk-paper ring-1 ring-rpk-mist",
            mobile ? "w-[200px] rounded-[30px] sm:w-[220px]" : "w-[min(420px,85vw)] rounded-[18px]",
          )}
        >
          <img
            src={src}
            alt={copy.app.screenshot(name, index + 1)}
            loading={index < 2 ? "eager" : "lazy"}
            className="block h-auto w-full"
          />
        </figure>
      ))}
    </div>
  );
}

export function DownloadAppPage({ settings, app, others }: DownloadAppPageData) {
  const { brand } = useRespok();
  const en = useEnglishText();
  const gatedList = useGatedList();
  const platformKey = [app.platform, ...others.map((other) => other.platform)].join(",");
  const build = useCallback(
    (flags: ContentFlags) => getDownloadContent(flags, platformKey.split(",") as AppPlatform[]),
    [platformKey],
  );
  const c = useContent(build);
  const aboutId = useId();
  const othersId = useId();

  const meta = PLATFORM_EN[app.platform];
  const name = en(app.name, `${brand} for ${meta.label}`);
  const subtitle = en(app.subtitle);
  const about = en(app.description) || en(app.shortDesc);
  const features = gatedList(app.features);
  const size = en(app.size);
  const minOs = en(app.minOs);
  const version = app.version.trim().replace(/^v/i, "");
  const shots = app.screenshots.map((src) => src.trim()).filter(Boolean);
  const mobile = app.platform === "ios" || app.platform === "android";
  const sortedOthers = sortApps(others);

  const chips = [
    { label: THREAD_COPY.download.platform, value: meta.label },
    ...(version ? [{ label: c.app.version, value: version }] : []),
    ...(size ? [{ label: c.app.size, value: size }] : []),
    ...(minOs ? [{ label: c.app.requires, value: minOs }] : []),
  ];

  const back = (
    <Link
      to="/download"
      className="group/back inline-flex min-h-11 items-center gap-2 rounded-full font-rpk-mono text-[12px] tracking-[0.06em] text-rpk-slate uppercase transition-colors hover:text-rpk-ink"
    >
      <ArrowLeft
        aria-hidden="true"
        strokeWidth={2.4}
        className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/back:-translate-x-0.5"
      />
      {c.app.back}
    </Link>
  );

  return (
    <>
      <JsonLd data={appJsonLd(settings, app, name, en(app.shortDesc) || subtitle || about)} />
      <PageOpener
        before={back}
        question={THREAD_COPY.download.appQuestion(meta.label)}
        eyebrow={
          <span className="flex items-center gap-3">
            <AppIcon size={36} platform={app.platform} />
            {meta.label}
          </span>
        }
        title={name}
        titleSize={name.length > 24 ? "md" : "lg"}
        lede={subtitle}
        meta={
          <div className="mt-2 space-y-7">
            <ul className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Chip key={chip.label} label={chip.label} value={chip.value} />
              ))}
            </ul>
            <StoreBadge app={app} />
          </div>
        }
        aside={
          <section aria-label={c.app.preview}>
            {shots.length > 0 ? (
              <Gallery shots={shots} name={name} mobile={mobile} />
            ) : (
              <AppIllustration
                platform={app.platform}
                label={THREAD_COPY.download.illustration(name)}
              />
            )}
          </section>
        }
      />

      {(about || features.length > 0) && (
        <Section
          tone="paper"
          labelledBy={about ? aboutId : undefined}
          label={about ? undefined : c.app.features}
        >
          <Container>
            <div
              className={cx(
                "grid gap-8 lg:items-start lg:gap-10",
                about && features.length > 0 && "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
              )}
            >
              {about && (
                <AnswerCard className="p-7 sm:p-10">
                  <h2
                    id={aboutId}
                    className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-rpk-ink sm:text-[30px]"
                  >
                    {c.app.about}
                  </h2>
                  <p
                    className={cx(
                      TYPE.body,
                      "mt-5 whitespace-pre-line text-pretty !text-rpk-ink/85",
                    )}
                  >
                    {about}
                  </p>
                </AnswerCard>
              )}
              {features.length > 0 && (
                <div className={cx("bg-rpk-ink p-7 text-white sm:p-10", SHAPE.questionCard)}>
                  <h2 className="text-[22px] leading-[1.2] font-bold tracking-[-0.01em] sm:text-[26px]">
                    {c.app.features}
                  </h2>
                  <CheckList items={features} tone="dark" className="mt-6" />
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {sortedOthers.length > 0 && (
        <Section tone="white" labelledBy={othersId}>
          <Container>
            <SectionHeader
              id={othersId}
              question={THREAD_COPY.download.othersQuestion}
              title={c.app.others}
            />
            <ul
              className={cx(
                "mt-10 grid gap-5 sm:grid-cols-2 lg:gap-6",
                sortedOthers.length >= 3 && "lg:grid-cols-3",
              )}
            >
              {sortedOthers.map((other, index) => (
                <Reveal as="li" key={other.id} delay={(index % 3) * 80}>
                  <AppCard app={other} detailsLabel={c.viewDetails} compact />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
