import { useState } from "react";
import { useCurrentPlanSlug } from "@/lib/useCurrentPlan";
import type { PublicPlan } from "@/lib/plans";
import type { PricingPageData } from "../types";
import { STATIC_COMPARISON, STATIC_PLANS } from "../content/pricing";
import { useRespok } from "./context";
import { isAllowedText } from "./gating";
import { useRespokAuth } from "./auth";

export type BillingPeriod = "monthly" | "yearly";

export interface RespokPrice {
  kind: "free" | "amount" | "contact";
  /** "$29" or "490,000" — empty for free/contact. */
  amount: string;
  /** "/ month", "Toman / month" … */
  unit: string;
  /** e.g. "Billed $348 yearly". */
  note: string;
}

export interface RespokPlan {
  slug: string;
  name: string;
  description: string;
  popular: boolean;
  price: RespokPrice;
  limits: { label: string; value: string }[];
  features: string[];
  cta: {
    label: string;
    href: string;
    /** current: the visitor's plan · blocked: not available for them · upgrade · normal */
    state: "current" | "blocked" | "upgrade" | "normal";
    /** Draw this plan's button as the primary one. */
    primary: boolean;
  };
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const plain = new Intl.NumberFormat("en-US");

function priceOf(
  plan: PublicPlan,
  period: BillingPeriod,
  currency: "USD" | "Toman",
): RespokPrice {
  if (plan.isFree) return { kind: "free", amount: "Free", unit: "", note: "" };
  const monthly = currency === "USD" ? plan.usdMonthly : plan.monthly;
  const yearly = currency === "USD" ? plan.usdYearly : plan.yearly;
  const total = period === "yearly" ? yearly : monthly;
  if (!total)
    return { kind: "contact", amount: "Let's talk", unit: "", note: "" };
  const perMonth = period === "yearly" ? total / 12 : total;
  const format = (n: number) =>
    currency === "USD" ? usd.format(n) : plain.format(Math.round(n));
  return {
    kind: "amount",
    amount: format(perMonth),
    unit:
      currency === "USD"
        ? "/ month"
        : period === "yearly"
          ? "Toman / month"
          : "Toman / month",
    note:
      period === "yearly"
        ? `Billed ${format(total)}${currency === "USD" ? "" : " Toman"} yearly`
        : "",
  };
}

function yearlySaving(remote: PublicPlan[] | null): string {
  if (!remote) return "Save 20%";
  const savings = remote
    .filter((p) => p.monthly && p.yearly)
    .map((p) => 1 - (p.yearly as number) / ((p.monthly as number) * 12));
  const best = Math.round(Math.max(0, ...savings) * 100);
  return best > 0 ? `Save up to ${best}%` : "";
}

/**
 * Plans for the English pricing page: the plans synced from the app when available
 * (US-dollar prices when the app provides them, otherwise the app's Toman prices),
 * or the site's built-in plans. Call/AI features follow the admin switches.
 */
export function usePricingModel(data: PricingPageData) {
  const { settings, t, callEnabled, aiEnabled } = useRespok();
  const auth = useRespokAuth();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const showYearly = settings.plans?.showYearly === true;
  const activePeriod: BillingPeriod = showYearly ? period : "monthly";
  const currentSlug = useCurrentPlanSlug(settings.plans?.apiUrl || "");
  const flags = { callEnabled, aiEnabled };
  const keep = (...texts: string[]) => isAllowedText(flags, ...texts);

  const remote = data.remotePlans?.plans ?? null;
  const paid = (remote ?? []).filter((p) => !p.isFree && p.monthly);
  const currency: "USD" | "Toman" =
    paid.length > 0 && paid.every((p) => !!p.usdMonthly) ? "USD" : "Toman";

  const base: Omit<RespokPlan, "cta">[] = remote
    ? remote.map((plan) => ({
        slug: plan.slug,
        name: plan.nameEn || t(plan.name),
        description: plan.descriptionEn || t(plan.description),
        popular: plan.popular,
        price: priceOf(plan, activePeriod, currency),
        limits: plan.limits
          .filter((limit) => keep(limit.label, t(limit.label)))
          .map((limit) => ({ label: t(limit.label), value: t(limit.value) })),
        features: plan.features
          .filter((feature) => keep(feature, t(feature)))
          .map((feature) => t(feature)),
      }))
    : STATIC_PLANS.map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        popular: plan.popular,
        price:
          plan.toman === null
            ? { kind: "contact", amount: "Let's talk", unit: "", note: "" }
            : plan.toman === 0
              ? { kind: "free", amount: "Free", unit: "", note: "" }
              : {
                  kind: "amount",
                  amount: plain.format(
                    activePeriod === "yearly"
                      ? Math.round(plan.toman * 0.8)
                      : plan.toman,
                  ),
                  unit: "Toman / month",
                  note: activePeriod === "yearly" ? "Billed yearly" : "",
                },
        limits: plan.limits.filter((limit) => keep(limit.label)),
        features: plan.features
          .filter((feature) => !feature.needs || flags[`${feature.needs}Enabled`])
          .map((feature) => feature.text),
      }));

  const order = base.map((plan) => plan.slug);
  const currentIndex = currentSlug ? order.indexOf(currentSlug) : -1;
  const plans: RespokPlan[] = base.map((plan, index) => {
    const isCurrent = !!currentSlug && plan.slug === currentSlug;
    const loggedIn = currentIndex >= 0;
    const isBlocked =
      loggedIn &&
      !isCurrent &&
      (index < currentIndex || plan.price.kind === "free");
    const isUpgrade = loggedIn && !isCurrent && !isBlocked;
    const contactSales =
      plan.slug === "enterprise" || plan.price.kind === "contact";
    return {
      ...plan,
      cta: isCurrent
        ? { label: "Your current plan", href: "", state: "current", primary: false }
        : isBlocked
          ? { label: "Not available", href: "", state: "blocked", primary: false }
          : isUpgrade
            ? {
                label: "Upgrade plan",
                href: settings.auth.panelUrl || auth.ctaUrl,
                state: "upgrade",
                primary: true,
              }
            : {
                label: contactSales
                  ? "Contact sales"
                  : plan.price.kind === "free"
                    ? "Get started"
                    : "Start free",
                href: contactSales ? "/contact" : auth.ctaUrl,
                state: "normal",
                primary: !loggedIn && plan.popular,
              },
    };
  });

  const comparison = data.remotePlans
    ? {
        columns: data.remotePlans.plans.map((p) => p.nameEn || t(p.name)),
        rows: data.remotePlans.comparison.rows
          .filter((row) => keep(row.label, t(row.label)))
          .map((row) => ({
            label: t(row.label),
            values: row.values.map((v) => (typeof v === "string" ? t(v) : v)),
          })),
      }
    : {
        columns: STATIC_COMPARISON.columns,
        rows: STATIC_COMPARISON.rows.filter(
          (row) => !row.needs || flags[`${row.needs}Enabled`],
        ),
      };

  return {
    plans,
    comparison,
    currency,
    showYearly,
    period: activePeriod,
    setPeriod,
    /** "Save 20%" style label for the yearly toggle, from the real prices. */
    yearlyBadge: yearlySaving(remote),
  };
}
