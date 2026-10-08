import { useContent } from "../../content";
import { getAboutContent } from "../../content/about";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { aboutJsonLd, withOverride } from "../../shared/structured";
import type { AboutPageData } from "../../types";
import { CtaBubble } from "../blocks";
import { OPEN_COPY } from "../copy";
import {
  ActionLink,
  BubbleGlyph,
  Card,
  ChapterHero,
  Container,
  CornerDot,
  IconTile,
  SectionHeader,
} from "../ui";
import { cx, pad } from "../tokens";

export function AboutPage({ settings, seoOverride }: AboutPageData) {
  const { brand } = useRespok();
  const c = useContent(getAboutContent);

  return (
    <>
      <JsonLd data={withOverride(seoOverride, aboutJsonLd(settings, brand))} />
      <ChapterHero
        running={`${brand} · ${c.eyebrow}`}
        path="/about"
        question={c.question}
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
      />

      {/* 02 · Values: three bubbles, the first one Ink with the live dot at its corner. */}
      <section aria-labelledby="values-label" className="bg-rpk-paper">
        <Container className="py-20 sm:py-28">
          <SectionHeader index="02" eyebrow={OPEN_COPY.about.values} />
          <h2 id="values-label" className="sr-only">
            {OPEN_COPY.about.values}
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            {c.values.map((value, i) => {
              const ink = i === 0;
              return (
                <li key={value.title} className={cx("min-w-0", ink && "mr-6 md:mr-0")}>
                  <Reveal effect="corner" delay={i * 90} className="relative h-full">
                    <Card
                      tone={ink ? "ink" : "white"}
                      size="xl"
                      className="relative isolate flex h-full flex-col overflow-hidden p-7 sm:p-9"
                    >
                      {ink ? (
                        <BubbleGlyph className="absolute -right-[18%] -bottom-[30%] -z-10 w-[70%] text-rpk-ink-soft" />
                      ) : null}
                      <div className="flex items-start justify-between gap-4">
                        {value.icon ? (
                          <IconTile icon={value.icon} tone={ink ? "signal" : "ink"} size={52} />
                        ) : null}
                        <span
                          className={cx(
                            "font-rpk-mono text-[12px] tracking-[0.08em]",
                            ink ? "text-white/55" : "text-rpk-slate",
                          )}
                        >
                          {pad(i + 1)} / {pad(c.values.length)}
                        </span>
                      </div>
                      <h3
                        className={cx(
                          "mt-12 font-rpk-mono text-[13px] tracking-[0.08em] uppercase",
                          ink ? "text-rpk-signal" : "text-rpk-slate",
                        )}
                      >
                        {value.title}
                      </h3>
                      <p
                        className={cx(
                          "mt-3 text-[22px] leading-[1.3] font-bold tracking-[-0.015em] sm:text-[26px]",
                          ink ? "text-white" : "text-rpk-ink",
                        )}
                      >
                        {value.body}
                      </p>
                    </Card>
                    {ink ? <CornerDot size={20} /> : null}
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* 03 · Team */}
      <section aria-labelledby="team-title" className="bg-rpk-paper">
        <Container className="pb-24 sm:pb-32">
          <CtaBubble
            size="md"
            index="03"
            eyebrow={OPEN_COPY.about.team}
            title={c.team.title}
            titleId="team-title"
            body={c.team.body}
            actions={
              <ActionLink to="/contact" variant="primary" size="lg">
                {c.team.cta}
              </ActionLink>
            }
          />
        </Container>
      </section>
    </>
  );
}
