import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Zap, Star, Crown, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/pricing")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([fetchSettings(), getPublicSeoPage({ data: { path: "/pricing" } })]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/pricing",
      override: loaderData.seoOverride,
      fallbackTitle: "امکانات و قیمت | وب‌یار",
      fallbackDescription: "پلن مناسب کسب‌وکار خود را از میان پلن‌های شروع، رشد، حرفه‌ای و سازمانی وب‌یار انتخاب کنید.",
    });
  },
  component: PricingPage,
});

function getPlans(period: "monthly" | "yearly") {
  return [
    {
      slug: "starter", icon: Zap, name: "شروع", desc: "برای شروع و آزمایش وب‌یار", price: "رایگان", unit: "", cta: "شروع کنید",
      features: ["۱ اپراتور پشتیبانی", "۵۰ گفتگو در ماه", "بدون تماس ویدیویی"],
    },
    {
      slug: "professional", icon: Star, name: "حرفه‌ای", desc: "برای تیم‌های در حال رشد",
      price: period === "yearly" ? "۳۹۲٬۰۰۰" : "۴۹۰٬۰۰۰",
      unit: period === "yearly" ? "تومان / ماه، سالانه" : "تومان / ماه",
      cta: "شروع رایگان", popular: true,
      features: ["۵ اپراتور پشتیبانی", "گفتگوی نامحدود", "تماس تصویری HD", "اشتراک‌گذاری صفحه", "گزارش‌گیری کامل"],
    },
    {
      slug: "enterprise", icon: Crown, name: "سازمانی", desc: "برای کسب‌وکارهای بزرگ", price: "تماس بگیرید", unit: "", cta: "تماس با فروش",
      features: ["اپراتور نامحدود", "چند دامنه هم‌زمان", "پشتیبانی اختصاصی", "امکانات یکپارچه‌سازی ویژه"],
    },
  ];
}

const comparisonRows = [
  { label: "تعداد اپراتور", free: "۱", pro: "۵", enterprise: "نامحدود" },
  { label: "گفتگوی ماهانه", free: "۵۰", pro: "نامحدود", enterprise: "نامحدود" },
  { label: "تماس تصویری", free: false, pro: true, enterprise: true },
  { label: "اشتراک‌گذاری صفحه", free: false, pro: true, enterprise: true },
  { label: "چند دامنه", free: false, pro: false, enterprise: true },
  { label: "پشتیبانی اختصاصی", free: false, pro: false, enterprise: true },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-success" />
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  }
  return <span>{value}</span>;
}

function PricingPage() {
  const { settings } = Route.useLoaderData();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const plans = getPlans(period);
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-7xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">قیمت‌گذاری</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">پلن مناسب کسب‌وکار خود را انتخاب کنید</p>
        </motion.div>

        <div className="mb-14 flex justify-center">
          <div className="inline-flex rounded-full bg-card p-1.5 shadow-card">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "monthly" ? "ماهانه" : "سالانه"}
                {p === "yearly" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      period === "yearly" ? "bg-primary-foreground/20" : "bg-success/15 text-success"
                    }`}
                  >
                    ۲۰٪ تخفیف
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <StaggerChildren className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.slug}
              variants={childVariant}
              className={`relative rounded-2xl border bg-card p-6 shadow-card transition-transform hover:scale-[1.02] ${plan.popular ? "border-primary ring-2 ring-primary/10" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-brand px-4 py-1 text-xs font-bold text-primary-foreground">
                  پیشنهادی
                </div>
              )}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{plan.desc}</p>
                </div>
              </div>
              <div className="mb-5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-foreground">{plan.price}</span>
                {plan.unit && <span className="text-xs text-muted-foreground">{plan.unit}</span>}
              </div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                  plan.popular ? "bg-brand text-primary-foreground" : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                {plan.cta} <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </StaggerChildren>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="mb-6 text-center text-xl font-bold text-foreground">مقایسه امکانات</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">امکانات</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-foreground">رایگان</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-foreground">حرفه‌ای</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-foreground">سازمانی</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                    <td className="px-5 py-3 text-center text-foreground"><ComparisonCell value={row.free} /></td>
                    <td className="px-5 py-3 text-center text-foreground"><ComparisonCell value={row.pro} /></td>
                    <td className="px-5 py-3 text-center text-foreground"><ComparisonCell value={row.enterprise} /></td>
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
