import { RespokPage } from "@/components/respok/RespokPage";
import { getSiteLanguage } from "@/lib/site-i18n";
import { localizeStructuredData } from "@/lib/site-i18n";
import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Zap,
  Star,
  Crown,
  ChevronLeft,
} from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { fetchPublicPlans } from "@/lib/plans.functions";
import type { PublicPlan } from "@/lib/plans";
import { useCurrentPlanSlug } from "@/lib/useCurrentPlan";
import { getPublicSeoPage } from "@/lib/seo.functions";
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/pricing")({
  loader: async () => {
    const [settings, seoOverride, remotePlans] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/pricing" } }),
      fetchPublicPlans(),
    ]);
    return { settings, seoOverride, remotePlans };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/pricing",
      override: loaderData.seoOverride,
      fallbackTitle: "امکانات و قیمت | وب‌یار",
      fallbackDescription:
        "پلن مناسب کسب‌وکار خود را از میان پلن‌های شروع، رشد، حرفه‌ای و سازمانی وب‌یار انتخاب کنید.",
    });
  },
  component: PricingPage,
});

interface DisplayPlan {
  slug: string;
  icon: typeof Zap;
  name: string;
  desc: string;
  price: string;
  unit: string;
  cta: string;
  note?: string | undefined;
  popular?: boolean;
  limits: { label: string; value: string }[];
  features: string[];
}

function getPlans(period: "monthly" | "yearly"): DisplayPlan[] {
  return [
    {
      slug: "starter",
      icon: Zap,
      name: "شروع",
      desc: "برای شروع و آزمایش وب‌یار",
      price: "رایگان",
      unit: "",
      cta: "شروع کنید",
      limits: [
        { label: "تعداد اپراتور", value: "۱" },
        { label: "گفتگوی ماهانه", value: "۵۰" },
        { label: "تعداد دامنه", value: "۱" },
      ],
      features: [
        "ابزارک چت سایت",
        "مدیریت مخاطبین (CRM پایه)",
        "گزارش پایه",
        "پشتیبانی ایمیلی",
      ],
    },
    {
      slug: "professional",
      icon: Star,
      name: "حرفه‌ای",
      desc: "برای تیم‌های در حال رشد",
      price: period === "yearly" ? "۳۹۲٬۰۰۰" : "۴۹۰٬۰۰۰",
      unit: period === "yearly" ? "تومان / ماه، سالانه" : "تومان / ماه",
      cta: "شروع رایگان",
      popular: true,
      limits: [
        { label: "تعداد اپراتور", value: "۵" },
        { label: "گفتگوی ماهانه", value: "نامحدود" },
        { label: "تعداد دامنه", value: "۳" },
      ],
      features: [
        "ابزارک چت سایت",
        "تماس تصویری HD + اشتراک‌گذاری صفحه",
        "دستیار هوش مصنوعی",
        "اتوماسیون و پایگاه دانش",
        "CRM کامل + برچسب‌گذاری",
        "اتصال به واتساپ و تلگرام",
        "کمپین بازاریابی",
        "گزارش و تحلیل کامل",
      ],
    },
    {
      slug: "enterprise",
      icon: Crown,
      name: "سازمانی",
      desc: "برای کسب‌وکارهای بزرگ",
      price: "تماس بگیرید",
      unit: "",
      cta: "تماس با فروش",
      limits: [
        { label: "تعداد اپراتور", value: "نامحدود" },
        { label: "گفتگوی ماهانه", value: "نامحدود" },
        { label: "تعداد دامنه", value: "نامحدود" },
      ],
      features: [
        "همه امکانات پلن حرفه‌ای",
        "چند دامنه هم‌زمان",
        "مرکز تماس و صف تماس",
        "API و Webhook کامل",
        "ورود یکپارچه (SSO) و کنترل دسترسی RBAC ۱۸ سطحی",
        "برچسب سفید",
        "SLA و پشتیبانی اختصاصی",
      ],
    },
  ];
}

const staticComparison = {
  plans: ["رایگان", "حرفه‌ای", "سازمانی"],
  rows: [
    { label: "تعداد اپراتور", values: ["۱", "۵", "نامحدود"] },
    { label: "گفتگوی ماهانه", values: ["۵۰", "نامحدود", "نامحدود"] },
    { label: "تعداد دامنه", values: ["۱", "۳", "نامحدود"] },
    { label: "تماس تصویری HD", values: [false, true, true] },
    { label: "اشتراک‌گذاری صفحه", values: [false, true, true] },
    { label: "دستیار هوش مصنوعی", values: [false, true, true] },
    { label: "CRM و مدیریت مشتریان", values: ["پایه", "کامل", "کامل"] },
    { label: "اتوماسیون و پایگاه دانش", values: [false, true, true] },
    { label: "کمپین و بازاریابی", values: [false, true, true] },
    { label: "ارتباط چندکاناله (واتساپ، تلگرام)", values: [false, true, true] },
    { label: "گزارش و تحلیل", values: ["پایه", "کامل", "کامل"] },
    { label: "API و Webhook", values: [false, false, true] },
    { label: "کنترل دسترسی (RBAC / SSO)", values: [false, false, true] },
    { label: "پشتیبانی اختصاصی", values: [false, false, true] },
  ] as { label: string; values: (string | boolean)[] }[],
};

const PLAN_ICONS = [Zap, Star, Crown];

// وقتی videoCall.enabled یا aiMarketing.enabled خاموش است، هر آیتم امکانات/محدودیت یا ردیف
// مقایسه‌ای که به همان موضوع اشاره دارد حذف می‌شود — چه از پلن‌های استاتیک این فایل بیاید، چه از
// پلن‌های همگام‌شده با اپ (mapRemotePlans)، تا هیچ اشاره‌ای در صفحه باقی نماند.
const CALL_KEYWORDS = [
  "تماس تصویری",
  "تماس ویدیویی",
  "ویدیویی",
  "تماس صوتی",
  "مرکز تماس",
  "صف تماس",
  "اشتراک‌گذاری صفحه",
];
const AI_KEYWORDS = ["هوش مصنوعی", "دستیار هوشمند", "ایجنت"];
function mentionsCall(text: string): boolean {
  return CALL_KEYWORDS.some((k) => text.includes(k));
}
function mentionsAi(text: string): boolean {
  return AI_KEYWORDS.some((k) => text.includes(k));
}
function stripMentions(
  plans: DisplayPlan[],
  opts: { call: boolean; ai: boolean },
): DisplayPlan[] {
  const keep = (text: string) =>
    (opts.call || !mentionsCall(text)) && (opts.ai || !mentionsAi(text));
  return plans.map((p) => ({
    ...p,
    features: p.features.filter(keep),
    limits: p.limits.filter((l) => keep(l.label)),
  }));
}

const faNumber = new Intl.NumberFormat("fa-IR");

/** تبدیل پلن‌های همگام‌شده اپلیکیشن به مدل نمایش صفحه قیمت‌گذاری */
function mapRemotePlans(
  remote: PublicPlan[],
  period: "monthly" | "yearly",
  english = false,
): DisplayPlan[] {
  return remote.map((plan, index) => {
    const yearlyTotal = plan.yearly;
    const amount = period === "yearly" ? yearlyTotal : plan.monthly;
    const perMonth =
      period === "yearly" && amount ? Math.round(amount / 12) : amount;
    const isFree = plan.isFree || perMonth === 0;
    return {
      note:
        period === "yearly" && !isFree && yearlyTotal
          ? `مجموع سالانه ${faNumber.format(yearlyTotal)} تومان`
          : undefined,
      slug: plan.slug,
      icon: PLAN_ICONS[Math.min(index, PLAN_ICONS.length - 1)] ?? Star,
      name: english && plan.nameEn ? plan.nameEn : plan.name,
      desc:
        english && plan.descriptionEn ? plan.descriptionEn : plan.description,
      price: isFree
        ? "رایگان"
        : perMonth
          ? faNumber.format(perMonth)
          : "تماس بگیرید",
      unit:
        isFree || !perMonth
          ? ""
          : period === "yearly"
            ? "تومان / ماه، سالانه"
            : "تومان / ماه",
      cta: isFree ? "شروع کنید" : perMonth ? "شروع رایگان" : "تماس با فروش",
      popular: plan.popular,
      limits: plan.limits,
      features: plan.features,
    };
  });
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function toAsciiNumber(input: string): string | null {
  const cleaned = input
    .split("")
    .map((ch) => {
      const idx = PERSIAN_DIGITS.indexOf(ch);
      return idx >= 0 ? String(idx) : ch;
    })
    .join("")
    .replace(/[^\d]/g, "");
  return cleaned || null;
}

function pricingIntro(
  callEnabled: boolean,
  aiEnabled: boolean,
  english = false,
): string {
  if (english)
    return (
      (callEnabled
        ? "From live chat and video calls to "
        : "From live chat to ") +
      (aiEnabled
        ? "an AI assistant, CRM, automation, campaigns and reporting. "
        : "CRM, automation, campaigns and reporting. ") +
      "Choose the right plan from Webyar’s complete feature set."
    );
  const start = callEnabled ? "از چت زنده و تماس تصویری تا" : "از چت زنده تا";
  const mid = aiEnabled
    ? " دستیار هوش مصنوعی، CRM، اتوماسیون، کمپین و گزارش‌گیری"
    : " CRM، اتوماسیون، کمپین و گزارش‌گیری";
  return `${start}${mid}. پلن مناسب کسب‌وکار خود را از میان امکانات کامل وب‌یار انتخاب کنید.`;
}

function ComparisonCell({ value }: { value: string | boolean }) {
  const translateText = useSiteTranslation();

  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-success" />
    ) : (
      <span className="text-muted-foreground">-</span>
    );
  }
  return <span>{translateText(value)}</span>;
}

function PersianPricingPage() {
  const translateText = useSiteTranslation();

  const { settings, remotePlans } = Route.useLoaderData();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  // نمایش همه امکانات برای همه پلن‌ها به‌صورت هم‌زمان تا ارتفاع کارت‌ها هماهنگ بماند
  const [expanded, setExpanded] = useState(false);
  const currentSlug = useCurrentPlanSlug(settings.plans?.apiUrl || "");
  const showYearly = settings.plans?.showYearly === true;
  const activePeriod = showYearly ? period : "monthly";
  const callEnabled = settings.videoCall.enabled;
  const aiEnabled = settings.aiMarketing.enabled;
  const rawPlans = remotePlans
    ? mapRemotePlans(
        remotePlans.plans,
        activePeriod,
        settings.localization.language === "en",
      )
    : getPlans(activePeriod);
  const plans = stripMentions(rawPlans, { call: callEnabled, ai: aiEnabled });
  const currentIndex = currentSlug
    ? plans.findIndex((p) => p.slug === currentSlug)
    : -1;
  const rawComparison = remotePlans?.comparison?.rows.length
    ? remotePlans.comparison
    : staticComparison;
  const comparison = {
    ...rawComparison,
    rows: rawComparison.rows.filter(
      (r) =>
        (callEnabled || !mentionsCall(r.label)) &&
        (aiEnabled || !mentionsAi(r.label)),
    ),
  };
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: settings.brand.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: base ? `${base}/pricing` : undefined,
      offers: plans
        .map((plan) => {
          const price =
            plan.price === "رایگان" ? "0" : toAsciiNumber(plan.price);
          if (!price) return null;
          return {
            "@type": "Offer",
            name: plan.name,
            price,
            priceCurrency: "IRR",
            url: base ? `${base}/pricing` : undefined,
          };
        })
        .filter(Boolean),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "قیمت‌گذاری", path: "/pricing" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLdHtml(
          localizeStructuredData(settings, jsonLd),
        )}
      />
      <div className="container-page max-w-7xl py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">
            {translateText("امکانات و قیمت‌گذاری")}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground">
            {translateText(
              pricingIntro(
                callEnabled,
                aiEnabled,
                settings.localization.language === "en",
              ),
            )}
          </p>
        </motion.div>

        {showYearly && (
          <div className="mb-14 flex justify-center">
            <div className="inline-flex rounded-full bg-card p-1.5 shadow-card">
              {(["monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {translateText(p === "monthly" ? "ماهانه" : "سالانه")}
                  {p === "yearly" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        period === "yearly"
                          ? "bg-primary-foreground/20"
                          : "bg-success/15 text-success"
                      }`}
                    >
                      {translateText("۲۰٪ تخفیف")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <StaggerChildren className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {plans.map((plan, planIndex) => {
            const isCurrent = currentIndex >= 0 && planIndex === currentIndex;
            const isUpgrade = currentIndex >= 0 && planIndex > currentIndex;
            const isDowngrade = currentIndex >= 0 && planIndex < currentIndex;
            const isFreePlan = plan.price === "رایگان";
            // پلن‌های پایین‌تر و پلن رایگان برای کاربر واردشده قابل انتخاب نیستند
            const isBlocked =
              currentIndex >= 0 && !isCurrent && (isDowngrade || isFreePlan);
            const ctaLabel = isCurrent
              ? "پلن فعلی شما"
              : isBlocked
                ? "در دسترس نیست"
                : isUpgrade
                  ? "ارتقاء پلن"
                  : plan.cta;
            const hiddenCount =
              Math.max(0, plan.features.length - 5) +
              Math.max(0, plan.limits.length - 3);

            return (
              <motion.div
                key={plan.slug}
                variants={childVariant}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-transform hover:scale-[1.02] ${plan.popular ? "border-primary ring-2 ring-primary/10" : "border-border"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-brand px-4 py-1 text-xs font-bold text-primary-foreground">
                    {translateText("پیشنهادی")}
                  </div>
                )}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
                    <plan.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {translateText(plan.name)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {translateText(plan.desc)}
                    </p>
                  </div>
                </div>
                <div className="mb-5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">
                    {translateText(plan.price)}
                  </span>
                  {plan.unit && (
                    <span className="text-xs text-muted-foreground">
                      {translateText(plan.unit)}
                    </span>
                  )}
                </div>
                {plan.note && (
                  <p className="-mt-3 mb-5 text-[11px] text-muted-foreground">
                    {translateText(plan.note)}
                  </p>
                )}
                {plan.limits.length > 0 && (
                  <div className="mb-5 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <p className="mb-2 text-[11px] font-bold text-foreground">
                      {translateText("محدودیت‌ها و سقف‌ها")}
                    </p>
                    <ul className="space-y-1.5">
                      {(expanded ? plan.limits : plan.limits.slice(0, 3)).map(
                        (l) => (
                          <li
                            key={l.label}
                            className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"
                          >
                            <span>{translateText(l.label)}</span>
                            <span className="font-bold text-foreground">
                              {translateText(l.value)}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                <p className="mb-2 text-[11px] font-bold text-foreground">
                  {translateText("امکانات")}
                </p>
                <ul className="mb-3 space-y-2">
                  {(expanded ? plan.features : plan.features.slice(0, 5)).map(
                    (f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                        {translateText(f)}
                      </li>
                    ),
                  )}
                </ul>
                <div className="mb-6 grow">
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {translateText(
                        expanded ? "نمایش کمتر" : "مشاهده همه امکانات",
                      )}
                    </button>
                  )}
                </div>
                {isCurrent ? (
                  <div className="flex w-full items-center justify-center gap-1 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm font-bold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                    {translateText(ctaLabel)}
                  </div>
                ) : isBlocked ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm font-bold text-muted-foreground opacity-70"
                  >
                    {translateText(ctaLabel)}
                  </button>
                ) : (
                  <a
                    href={
                      plan.slug === "enterprise"
                        ? "/contact"
                        : isUpgrade
                          ? settings.auth.panelUrl ||
                            settings.auth.signupUrl ||
                            "/contact"
                          : settings.auth.signupUrl || "/contact"
                    }
                    className={`flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                      isUpgrade || (plan.popular && currentIndex < 0)
                        ? "bg-brand text-primary-foreground"
                        : "border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {translateText(ctaLabel)}{" "}
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </a>
                )}
              </motion.div>
            );
          })}
        </StaggerChildren>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-6 text-center text-xl font-bold text-foreground">
            {translateText("مقایسه امکانات")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">
                    {translateText("امکانات")}
                  </th>
                  {comparison.plans.map((name) => (
                    <th
                      key={name}
                      className="px-5 py-3 text-center text-xs font-semibold text-foreground"
                    >
                      {translateText(name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      {translateText(row.label)}
                    </td>
                    {row.values.map((value, i) => (
                      <td
                        key={i}
                        className="px-5 py-3 text-center text-foreground"
                      >
                        <ComparisonCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </SiteLayout>
  );
}

/** English site: the active Respok template; Persian site: the page above. */
function PricingPage() {
  const data = Route.useLoaderData();
  if (getSiteLanguage(data.settings) === "en")
    return <RespokPage page="pricing" data={data} />;
  return <PersianPricingPage />;
}
