import { useId, useState } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { useContent, type ContentFlags } from "../../content";
import { getPricingContent } from "../../content/pricing";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { usePricingModel, type RespokPlan } from "../../shared/pricing";
import { Reveal } from "../../shared/Reveal";
import { pricingJsonLd, withOverride } from "../../shared/structured";
import type { PricingPageData } from "../../types";
import { CtaBubble } from "../blocks";
import { OPEN_COPY } from "../copy";
import {
  ActionLink,
  Badge,
  Card,
  ChapterHero,
  Container,
  CornerDot,
  Dot,
  SectionHeader,
  type Surface,
} from "../ui";
import { buttonClass, cx } from "../tokens";

type PricingCopy = ReturnType<typeof getPricingContent>;

const pricingCopy = (f: ContentFlags) => getPricingContent(f.brand, f.callEnabled, f.aiEnabled);

/** Long feature lists fold after this many items. */
const FOLD_AFTER = 6;
const FOLD_WHEN = 8;

export function PricingPage(data: PricingPageData) {
  const { settings, brand } = useRespok();
  const copy = useContent(pricingCopy);
  const model = usePricingModel(data);
  const { plans, comparison, currency, showYearly, period, setPeriod, yearlyBadge } = model;

  // Desktop columns follow the number of plans: never a lonely card on its own row.
  const n = plans.length;
  const grid =
    n <= 1
      ? "mx-auto max-w-[460px]"
      : n === 2
        ? "mx-auto max-w-[920px] md:grid-cols-2"
        : n === 3
          ? "md:grid-cols-2 lg:grid-cols-3"
          : n === 4
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <JsonLd
        data={withOverride(data.seoOverride, pricingJsonLd(settings, brand, plans, currency))}
      />
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path="/pricing"
        question={copy.question}
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
        className="pb-24 sm:pb-28"
      >
        {showYearly || currency === "Toman" ? (
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            {showYearly ? (
              <div
                role="group"
                aria-label={OPEN_COPY.pricing.period}
                className="inline-flex rounded-[20px] rounded-br-[6px] bg-white/[0.08] p-1.5"
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
                        "inline-flex h-11 items-center gap-2 rounded-[15px] rounded-br-[4px] px-4 text-[15px] font-semibold transition-colors duration-200 sm:px-5",
                        active ? "bg-white text-rpk-ink" : "text-white/75 hover:text-white",
                      )}
                    >
                      <Dot
                        size={7}
                        className={cx(
                          "transition-transform duration-300 ease-rpk-pop",
                          active ? "scale-100" : "-mr-2 scale-0",
                        )}
                      />
                      {value === "monthly" ? copy.monthly : copy.yearly}
                      {value === "yearly" && yearlyBadge ? (
                        <span className="rounded-[8px] rounded-br-[2px] bg-rpk-signal px-1.5 py-0.5 font-rpk-mono text-[11px] font-normal tracking-[0.02em] text-rpk-ink">
                          {yearlyBadge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {currency === "Toman" ? (
              <p className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
                {OPEN_COPY.pricing.toman}
              </p>
            ) : null}
          </div>
        ) : null}
      </ChapterHero>

      {/* The plans rise out of the Ink chapter. */}
      <section aria-labelledby="plans-title" className="bg-rpk-paper">
        <h2 id="plans-title" className="sr-only">
          {OPEN_COPY.pricing.plans}
        </h2>
        <Container className="relative -mt-16 sm:-mt-20">
          <ul className={cx("grid items-stretch gap-6 lg:gap-8", grid)}>
            {plans.map((plan, i) => (
              <li
                key={plan.slug}
                className={cx(
                  "min-w-0",
                  plan.popular && "mr-6 md:mr-0",
                  n === 3 && i === 2 && "md:col-span-2 lg:col-span-1",
                )}
              >
                <Reveal effect="corner" delay={i * 80} className="relative h-full">
                  <PlanCard plan={plan} copy={copy} />
                  {plan.popular ? <CornerDot size={20} /> : null}
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {comparison.rows.length > 0 && comparison.columns.length > 0 ? (
        <Comparison comparison={comparison} plans={plans} copy={copy} />
      ) : null}

      <section aria-labelledby="questions-title" className="bg-rpk-paper">
        <Container className="pb-24 sm:pb-32">
          <CtaBubble
            size="md"
            index="03"
            eyebrow={OPEN_COPY.pricing.questions}
            title={copy.questionsTitle}
            titleId="questions-title"
            body={copy.questionsBody}
            actions={
              <ActionLink to="/contact" variant="primary" size="lg">
                {copy.questionsCta}
              </ActionLink>
            }
          />
        </Container>
      </section>
    </>
  );
}

/* ─── Plan card ─────────────────────────────────────────────────────────── */

function PlanCta({ plan, surface }: { plan: RespokPlan; surface: Surface }) {
  const ink = surface === "ink";
  if (plan.cta.state === "current") {
    return (
      <p
        className={cx(
          "flex h-[52px] items-center justify-center gap-2.5 rounded-[22px] rounded-br-[6px] border text-[15px] font-semibold",
          ink ? "border-white/25 text-white" : "border-rpk-ink/20 text-rpk-ink",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "grid size-5 place-items-center rounded-full",
            ink ? "bg-white text-rpk-ink" : "bg-rpk-ink text-white",
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
        {plan.cta.label}
      </p>
    );
  }
  if (plan.cta.state === "blocked") {
    return (
      <button
        type="button"
        disabled
        className={cx(buttonClass("secondary", surface, "lg"), "w-full")}
      >
        {plan.cta.label}
      </button>
    );
  }
  return (
    <ActionLink
      to={plan.cta.href}
      variant={plan.cta.primary ? "primary" : ink ? "secondary" : "ink"}
      surface={surface}
      size="lg"
      className="w-full"
    >
      {plan.cta.label}
    </ActionLink>
  );
}

function PlanCard({ plan, copy }: { plan: RespokPlan; copy: PricingCopy }) {
  const ink = plan.popular;
  const surface: Surface = ink ? "ink" : "paper";
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const foldable = plan.features.length > FOLD_WHEN;
  const features = foldable && !expanded ? plan.features.slice(0, FOLD_AFTER) : plan.features;
  const label = cx(
    "font-rpk-mono text-[12px] tracking-[0.08em] uppercase",
    ink ? "text-white/60" : "text-rpk-slate",
  );
  const rule = ink ? "border-rpk-ink-line" : "border-rpk-mist";
  const titleId = `plan-${plan.slug}`;

  return (
    <Card
      as="article"
      tone={ink ? "ink" : "white"}
      size="xl"
      aria-labelledby={titleId}
      className={cx(
        "flex h-full flex-col p-7 sm:p-9",
        ink ? "shadow-rpk-panel" : "shadow-rpk-card",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={titleId} className="text-[24px] leading-[1.2] font-bold tracking-[-0.015em]">
          {plan.name}
        </h3>
        {plan.popular ? (
          <Badge tone="signal">
            <Dot tone="ink" size={6} />
            {copy.popular}
          </Badge>
        ) : null}
      </div>
      {plan.description ? (
        <p
          className={cx(
            "mt-2 text-[15px] leading-[1.55]",
            ink ? "text-white/70" : "text-rpk-slate",
          )}
        >
          {plan.description}
        </p>
      ) : null}

      <div className={cx("mt-8 border-t pt-6", rule)}>
        <p
          className={cx(
            "flex min-h-[52px] items-end font-extrabold tracking-[-0.035em] tabular-nums",
            plan.price.kind === "amount"
              ? "text-[44px] leading-none sm:text-[52px]"
              : "text-[40px] leading-none sm:text-[46px]",
          )}
        >
          {plan.price.amount}
        </p>
        <p className={cx(label, "mt-3 min-h-[18px]")}>
          {[plan.price.unit, plan.price.note].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="mt-6">
        <PlanCta plan={plan} surface={surface} />
      </div>

      {plan.limits.length > 0 ? (
        <div className="mt-9">
          <h4 className={label}>{copy.limits}</h4>
          <dl className={cx("mt-3 border-t", rule)}>
            {plan.limits.map((limit) => (
              <div
                key={limit.label}
                className={cx("flex items-baseline justify-between gap-4 border-b py-3", rule)}
              >
                <dt className={cx("text-[15px]", ink ? "text-white/75" : "text-rpk-slate")}>
                  {limit.label}
                </dt>
                <dd className="text-right font-rpk-mono text-[14px]">{limit.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {plan.features.length > 0 ? (
        <div className="mt-9">
          <h4 className={label}>{copy.features}</h4>
          <ul id={listId} className="mt-4 grid gap-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                <Dot size={7} tone={ink ? "signal" : "ink"} className="mt-[7px]" />
                <span className={ink ? "text-white/88" : "text-rpk-ink"}>{feature}</span>
              </li>
            ))}
          </ul>
          {foldable ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((value) => !value)}
              className={cx(
                "mt-4 inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[14px] font-semibold",
                ink ? "text-white" : "text-rpk-ink",
              )}
            >
              {expanded
                ? copy.showLess
                : `${copy.showAll} (${OPEN_COPY.pricing.more(plan.features.length - FOLD_AFTER)})`}
              <ChevronDown
                aria-hidden="true"
                className={cx("size-4 transition-transform", expanded && "rotate-180")}
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

/* ─── Comparison ────────────────────────────────────────────────────────── */

function Comparison({
  comparison,
  plans,
  copy,
}: {
  comparison: { columns: string[]; rows: { label: string; values: (string | boolean)[] }[] };
  plans: RespokPlan[];
  copy: PricingCopy;
}) {
  const popular = comparison.columns.map(
    (column) => plans.find((plan) => plan.name === column)?.popular === true,
  );
  const cell = "px-5 py-4 text-center align-middle sm:px-6";
  return (
    <section aria-labelledby="compare-title" className="bg-rpk-paper">
      <Container className="py-20 sm:py-28">
        <SectionHeader
          index="02"
          eyebrow={OPEN_COPY.pricing.compare}
          title={copy.comparisonTitle}
          id="compare-title"
        />
        <div className="relative mt-10 mr-6 sm:mt-14 sm:mr-8">
          <div
            role="region"
            aria-labelledby="compare-title"
            tabIndex={0}
            className="overflow-x-auto rounded-[32px] rounded-br-[6px] bg-white shadow-rpk-card"
          >
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">{copy.comparisonTitle}</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-white px-5 py-5 font-rpk-mono text-[12px] font-normal tracking-[0.08em] text-rpk-slate uppercase sm:px-8"
                  >
                    {copy.comparisonFeature}
                  </th>
                  {comparison.columns.map((column, i) => (
                    <th
                      key={column}
                      scope="col"
                      className={cx(
                        cell,
                        "py-5 text-[16px] font-bold text-rpk-ink",
                        popular[i] && "bg-rpk-paper",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {popular[i] ? <Dot size={7} /> : null}
                        {column}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.label} className="border-t border-rpk-mist">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 max-w-[260px] bg-white px-5 py-4 text-[15px] font-semibold text-rpk-ink sm:px-8"
                    >
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={i}
                        className={cx(
                          cell,
                          "text-[15px] text-rpk-ink",
                          popular[i] && "bg-rpk-paper",
                        )}
                      >
                        {typeof value === "boolean" ? (
                          value ? (
                            <>
                              <span
                                aria-hidden="true"
                                className="inline-grid size-6 place-items-center rounded-full bg-rpk-ink text-white"
                              >
                                <Check className="size-3.5" strokeWidth={3} />
                              </span>
                              <span className="sr-only">{copy.included}</span>
                            </>
                          ) : (
                            <>
                              <Minus aria-hidden="true" className="inline size-4 text-rpk-away" />
                              <span className="sr-only">{copy.notIncluded}</span>
                            </>
                          )
                        ) : (
                          <span
                            className={
                              value.length <= 12 ? "font-rpk-mono text-[14px]" : "text-[14px]"
                            }
                          >
                            {value}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CornerDot size={18} />
        </div>
      </Container>
    </section>
  );
}
