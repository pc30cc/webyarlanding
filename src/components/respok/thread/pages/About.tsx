import { useId } from "react";
import type { AboutPageData } from "../../types";
import { useContent } from "../../content";
import { getAboutContent } from "../../content/about";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import { aboutJsonLd, withOverride } from "../../shared/structured";
import { THREAD_COPY } from "../copy";
import { SHAPE, TYPE, cx } from "../classes";
import {
  ActionLink,
  AnswerCard,
  Container,
  IconBadge,
  PageOpener,
  QuestionPill,
  ReadTicks,
  Section,
  Timestamp,
} from "../ui";

/** An abstract transcript: question and answer pills without words. */
function TranscriptSketch() {
  const rows: { q: string; a: string }[] = [
    { q: "w-[46%]", a: "w-[62%]" },
    { q: "w-[34%]", a: "w-[78%]" },
    { q: "w-[52%]", a: "w-[44%]" },
  ];
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2">
          <span className={cx("block h-10 bg-rpk-ink-raised", SHAPE.question, row.q)} />
          <span
            className={cx(
              "ml-auto block h-10",
              SHAPE.answer,
              row.a,
              index === rows.length - 1 ? "bg-rpk-signal" : "bg-rpk-ink-line",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function AboutPage({ settings, seoOverride }: AboutPageData) {
  const { brand } = useRespok();
  const c = useContent(getAboutContent);
  const valuesId = useId();
  const teamId = useId();

  return (
    <>
      <JsonLd data={withOverride(seoOverride, aboutJsonLd(settings, brand))} />
      <PageOpener question={c.question} eyebrow={c.eyebrow} title={c.title} lede={c.lede} />

      <Section tone="paper" labelledBy={valuesId}>
        <Container>
          <Reveal effect="from-left">
            <QuestionPill as="h2" size="lg" className="scroll-mt-24">
              <span id={valuesId}>{THREAD_COPY.about.valuesQuestion}</span>
            </QuestionPill>
          </Reveal>
          <ol className="mt-12 grid gap-6 sm:mt-14 md:grid-cols-3 md:items-start lg:gap-8">
            {c.values.map((value, index) => (
              <Reveal
                as="li"
                key={value.title}
                effect="from-right"
                delay={index * 120}
                className={cx(index === 1 && "md:mt-12", index === 2 && "md:mt-24")}
              >
                <AnswerCard className="flex flex-col p-7 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    {value.icon && (
                      <IconBadge icon={value.icon} tone={index === 0 ? "signal" : "soft"} />
                    )}
                    <span className="font-rpk-mono text-[13px] tracking-[0.08em] text-rpk-slate">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-7 text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-rpk-ink">
                    {value.title}
                  </h3>
                  <p className={cx(TYPE.body, "mt-3 text-pretty")}>{value.body}</p>
                  <p className="mt-6 flex items-center justify-end gap-1.5 text-rpk-signal-deep">
                    <Timestamp>{`09:4${index + 2}`}</Timestamp>
                    <ReadTicks />
                  </p>
                </AnswerCard>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <section aria-labelledby={teamId} className="bg-white py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid items-center gap-12 overflow-hidden rounded-[36px] rounded-ee-[10px] bg-rpk-ink px-6 py-12 text-white sm:rounded-[44px] sm:rounded-ee-[12px] sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:px-16">
            <div>
              <Reveal effect="from-left">
                <QuestionPill tone="white" size="md">
                  {THREAD_COPY.about.teamQuestion}
                </QuestionPill>
              </Reveal>
              <h2
                id={teamId}
                className="mt-8 text-[30px] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[40px]"
              >
                {c.team.title}
              </h2>
              <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.6] text-pretty text-white/70 sm:text-[18px]">
                {c.team.body}
              </p>
              <ActionLink href="/contact" size="lg" arrow className="mt-9">
                {c.team.cta}
              </ActionLink>
            </div>
            <div className="hidden lg:block">
              <TranscriptSketch />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
