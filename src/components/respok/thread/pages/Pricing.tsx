import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PricingPageData } from "../../types";
import { getPricingContent } from "../../content/pricing";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { usePricingModel, type RespokPlan } from "../../shared/pricing";
import { Reveal } from "../../shared/Reveal";
import { pricingJsonLd, withOverride } from "../../shared/structured";
import { THREAD_COPY } from "../copy";
import { SHAPE, actionClass, cx } from "../classes";
import {
  ActionLink,
  AnswerPill,
  CheckDot,
  CheckList,
  Container,
  Exchange,
  PageOpener,
  QuestionPill,
  Section,
  SectionHeader,
} from "../ui";

type PricingCopy = ReturnType<typeof getPricingContent>;

/** Features shown before "Show all features". */
const FEATURE_PREVIEW = 6;

function PeriodToggle({
  period,
  setPeriod,
  copy,
  badge,
}: {
  period: "monthly" | "yearly";
  setPeriod: (period: "monthly" | "yearly") => void;
  copy: PricingCopy;
  badge: string;
}) {
  return (
    <div
      role="group"
      aria-label={THREAD_COPY.pricing.period}
      className="inline-flex items-center gap-1 rounded-full bg-rpk-paper p-1.5 ring-1 ring-rpk-mist ring-inset"
    >
      {(["monthly", "yearly"] as const).map((value) => {
        const active = period === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setPeriod(value)}
            className={cx(
              "inline-flex h-11 items-center gap-2 px-5 text-[15px] font-semibold transition-colors duration-200",
              active
                ? cx(SHAPE.question, "bg-rpk-ink text-white")
                : "rounded-full text-rpk-ink hover:bg-white",
            )}
          >
            {value === "monthly" ? copy.monthly : copy.yearly}
            {value === "yearly" && badge && (
              <span
                className={cx(
                  "inline-flex h-6 items-center px-2.5 font-rpk-mono text-[11px] tracking-[0.04em] text-rpk-ink uppercase",
                  SHAPE.answer,
                  active ? "bg-rpk-signal" : "bg-rpk-signal-soft",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanAction({ plan, dark }: { plan: RespokPlan; dark: boolean }) {
  const { cta } = plan;
  if (cta.state === "current")
    return (
      <p
        className={cx(
          "inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold",
          dark
            ? "bg-white/10 text-white"
            : "bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset",
        )}
      >
        <CheckDot tone={dark ? "signal" : "ink"} />
        {cta.label}
      </p>
    );
  if (cta.state === "blocked")
    return (
      <button type="button" disabled className={actionClass("outline", "md", "w-full")}>
        {cta.label}
      </button>
    );
  return (
    <ActionLink
      href={cta.href}
      variant={cta.primary ? "primary" : dark ? "outline" : "secondary"}
      arrow={cta.primary}
      className="w-full"
    >
      {cta.label}
    </ActionLink>
  );
}

function PlanCard({ plan, copy }: { plan: RespokPlan; copy: PricingCopy }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const dark = plan.popular;
  const extra = plan.features.length - FEATURE_PREVIEW;
  const features = expanded || extra <= 0 ? plan.features : plan.features.slice(0, FEATURE_PREVIEW);
  const price = plan.price;

  return (
    <article
      className={cx(
        "relative flex h-full flex-col p-7 sm:p-8",
        dark
          ? cx(
              SHAPE.questionCard,
              "bg-rpk-ink text-white shadow-[0_30px_60px_-30px_rgb(22_20_43/0.55)]",
            )
          : cx(SHAPE.answerCard, "bg-white text-rpk-ink shadow-rpk-card"),
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-[22px] leading-[1.2] font-bold tracking-[-0.01em]">{plan.name}</h2>
        {plan.popular && (
          <AnswerPill as="span" size="sm" className="shrink-0 whitespace-nowrap">
            {copy.popular}
          </AnswerPill>
        )}
      </div>
      <p
        className={cx(
          "mt-2 min-h-[46px] text-[15px] leading-[1.5]",
          dark ? "text-white/70" : "text-rpk-slate",
        )}
      >
        {plan.description}
      </p>

      <div className="mt-6 min-h-[92px]">
        <p
          className={cx(
            "leading-none font-extrabold tracking-[-0.03em] tabular-nums",
            price.amount.length > 7 ? "text-[40px] sm:text-[44px]" : "text-[48px]",
          )}
        >
          {price.amount}
        </p>
        {(price.unit || price.note) && (
          <p
            className={cx(
              "mt-3 font-rpk-mono text-[12px] leading-[1.5] tracking-[0.02em]",
              dark ? "text-white/65" : "text-rpk-slate",
            )}
          >
            {price.unit}
            {price.unit && price.note && <span aria-hidden="true"> · </span>}
            {price.note}
          </p>
        )}
      </div>

      <div className="mt-6">
        <PlanAction plan={plan} dark={dark} />
      </div>

      {plan.limits.length > 0 && (
        <div className={cx("mt-8 border-t pt-6", dark ? "border-rpk-ink-line" : "border-rpk-mist")}>
          <h3
            className={cx(
              "font-rpk-mono text-[12px] tracking-[0.08em] uppercase",
              dark ? "text-white/60" : "text-rpk-slate",
            )}
          >
            {copy.limits}
          </h3>
          <dl className="mt-3">
            {plan.limits.map((limit) => (
              <div
                key={limit.label}
                className={cx(
                  "flex items-baseline justify-between gap-3 border-b border-dashed py-2.5 last:border-0",
                  dark ? "border-rpk-ink-line" : "border-rpk-mist",
                )}
              >
                <dt
                  className={cx(
                    "text-[15px] lg:text-[14px] xl:text-[15px]",
                    dark ? "text-white/80" : "text-rpk-ink",
                  )}
                >
                  {limit.label}
                </dt>
                <dd className="shrink-0 text-right font-rpk-mono text-[14px] tabular-nums lg:text-[13px] xl:text-[14px]">
                  {limit.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {plan.features.length > 0 && (
        <div className={cx("mt-6 border-t pt-6", dark ? "border-rpk-ink-line" : "border-rpk-mist")}>
          <h3
            className={cx(
              "font-rpk-mono text-[12px] tracking-[0.08em] uppercase",
              dark ? "text-white/60" : "text-rpk-slate",
            )}
          >
            {copy.features}
          </h3>
          <div id={listId}>
            <CheckList items={features} size="sm" tone={dark ? "dark" : "light"} className="mt-4" />
          </div>
          {extra > 0 && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((value) => !value)}
              className={cx(
                "mt-4 inline-flex min-h-11 items-center gap-2 rounded-full text-[14px] font-semibold",
                dark ? "text-white" : "text-rpk-ink",
              )}
            >
              {expanded
                ? copy.showLess
                : `${copy.showAll} (${THREAD_COPY.pricing.featureCount(extra)})`}
              <ChevronDown
                aria-hidden="true"
                strokeWidth={2.4}
                className={cx("size-4 transition-transform duration-200", expanded && "rotate-180")}
              />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function Comparison({
  comparison,
  copy,
  popularIndex,
}: {
  comparison: ReturnType<typeof usePricingModel>["comparison"];
  copy: PricingCopy;
  popularIndex: number;
}) {
  const headingId = useId();
  if (comparison.rows.length === 0 || comparison.columns.length === 0) return null;
  return (
    <Section tone="white" labelledBy={headingId}>
      <Container>
        <SectionHeader
          id={headingId}
          question={THREAD_COPY.pricing.compareQuestion}
          title={copy.comparisonTitle}
        />
        <div
          role="region"
          aria-labelledby={headingId}
          tabIndex={0}
          className={cx(
            "mt-10 overflow-x-auto bg-white shadow-rpk-card ring-1 ring-rpk-mist sm:mt-12",
            "rounded-[28px] rounded-ee-[6px]",
          )}
        >
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rpk-mist">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-[148px] bg-white px-4 py-5 font-rpk-mono text-[12px] font-normal tracking-[0.08em] text-rpk-slate uppercase shadow-[1px_0_0_var(--color-rpk-mist)] sm:w-auto sm:px-7 sm:shadow-none"
                >
                  {copy.comparisonFeature}
                </th>
                {comparison.columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={cx(
                      "px-4 py-5 text-center text-[16px] font-bold text-rpk-ink",
                      index === popularIndex && "bg-rpk-signal-soft/45",
                    )}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.label} className="border-b border-rpk-mist last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 w-[148px] bg-white px-4 py-4 text-[14px] leading-[1.4] font-medium text-rpk-ink shadow-[1px_0_0_var(--color-rpk-mist)] sm:w-auto sm:px-7 sm:text-[15px] sm:shadow-none"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={index}
                      className={cx(
                        "px-4 py-4 text-center text-[15px] leading-[1.4] text-rpk-ink",
                        index === popularIndex && "bg-rpk-signal-soft/45",
                      )}
                    >
                      {typeof value === "boolean" ? (
                        value ? (
                          <>
                            <CheckDot className="mx-auto" />
                            <span className="sr-only">{copy.included}</span>
                          </>
                        ) : (
                          <>
                            <span
                              aria-hidden="true"
                              className="mx-auto block h-[2px] w-3 rounded-full bg-rpk-away"
                            />
                            <span className="sr-only">{copy.notIncluded}</span>
                          </>
                        )
                      ) : (
                        <span className="font-medium">{value}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}

export function PricingPage(data: PricingPageData) {
  const { settings, seoOverride } = data;
  const { brand, callEnabled, aiEnabled } = useRespok();
  const copy = getPricingContent(brand, callEnabled, aiEnabled);
  const model = usePricingModel(data);
  const { plans } = model;
  const count = plans.length;
  const popularIndex =
    model.comparison.columns.length === count ? plans.findIndex((plan) => plan.popular) : -1;
  const questionsId = useId();

  return (
    <>
      <JsonLd
        data={withOverride(seoOverride, pricingJsonLd(settings, brand, plans, model.currency))}
      />
      <PageOpener
        question={copy.question}
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
      >
        {(model.showYearly || model.currency === "Toman") && (
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            {model.showYearly && (
              <PeriodToggle
                period={model.period}
                setPeriod={model.setPeriod}
                copy={copy}
                badge={model.yearlyBadge}
              />
            )}
            {model.currency === "Toman" && (
              <p className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                {THREAD_COPY.pricing.toman}
              </p>
            )}
          </div>
        )}
      </PageOpener>

      {count > 0 && (
        <section
          aria-label={THREAD_COPY.pricing.plansLabel}
          className="bg-rpk-paper py-14 sm:py-16 lg:py-20"
        >
          <Container>
            <ul
              className={cx(
                "mx-auto grid gap-6",
                count === 1 && "max-w-md",
                count === 2 && "max-w-4xl md:grid-cols-2",
                count === 3 && "max-w-xl lg:max-w-none lg:grid-cols-3",
                count >= 4 && "md:grid-cols-2 xl:grid-cols-4",
              )}
            >
              {plans.map((plan, index) => (
                <Reveal as="li" key={plan.slug} delay={(index % 4) * 90}>
                  <PlanCard plan={plan} copy={copy} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <Comparison comparison={model.comparison} copy={copy} popularIndex={popularIndex} />

      <section aria-labelledby={questionsId} className="bg-rpk-paper py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <Exchange
              question={
                <Reveal effect="from-left">
                  <QuestionPill as="h2" size="xl">
                    <span id={questionsId}>{copy.questionsTitle}</span>
                  </QuestionPill>
                </Reveal>
              }
              answer={
                <Reveal effect="from-right" delay={120}>
                  <AnswerPill size="lg">{copy.questionsBody}</AnswerPill>
                </Reveal>
              }
            />
            <ActionLink
              href="/contact"
              variant="secondary"
              size="lg"
              arrow
              className="self-start lg:self-auto"
            >
              {copy.questionsCta}
            </ActionLink>
          </div>
        </Container>
      </section>
    </>
  );
}
