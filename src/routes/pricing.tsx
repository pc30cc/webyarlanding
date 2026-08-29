import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, TrendingUp, Star, Crown, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant, FAQItem } from "@/components/site/animations";

export const Route = createFileRoute("/pricing")({
  loader: async () => ({ settings: await fetchSettings() }),
  head: () => ({
    meta: [
      { title: "امکانات و قیمت | وب‌یار" },
      { name: "description", content: "پلن مناسب کسب‌وکار خود را از میان پلن‌های شروع، رشد، حرفه‌ای و سازمانی وب‌یار انتخاب کنید." },
      { property: "og:title", content: "امکانات و قیمت | وب‌یار" },
      { property: "og:description", content: "پلن‌های منعطف و مقرون‌به‌صرفه برای هر اندازه از کسب‌وکار." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    slug: "starter", icon: Zap, name: "شروع", desc: "برای سایت‌های کوچک و شروع کار", price: "رایگان",
    features: ["۱ اپراتور", "۱٬۰۰۰ گفتگو در ماه", "چت زنده نامحدود", "پشتیبانی ایمیلی"],
  },
  {
    slug: "growth", icon: TrendingUp, name: "رشد", desc: "برای تیم‌های کوچک در حال رشد", price: "۲۹۰٬۰۰۰ تومان/ماه",
    features: ["۳ اپراتور", "تاریخچه ۹۰ روزه", "پیام خودکار", "پشتیبانی چت آنلاین"],
  },
  {
    slug: "professional", icon: Star, name: "حرفه‌ای", desc: "برای تیم‌های در حال رشد", price: "۴۹۰٬۰۰۰ تومان/ماه", popular: true,
    features: ["۵ اپراتور", "تماس ویدیویی HD", "اشتراک‌گذاری صفحه", "گزارش‌های پیشرفته"],
  },
  {
    slug: "enterprise", icon: Crown, name: "سازمانی", desc: "برای کسب‌وکارهای بزرگ", price: "تماس بگیرید",
    features: ["اپراتور نامحدود", "SSO و کنترل دسترسی", "SLA اختصاصی", "مدیر حساب اختصاصی"],
  },
];

const faqs = [
  { q: "آیا می‌توانم پلن را تغییر دهم؟", a: "بله، هر زمان می‌توانید پلن خود را ارتقا یا تنزل دهید." },
  { q: "آیا بازگشت وجه وجود دارد؟", a: "بله، تا ۳۰ روز پس از خرید امکان بازگشت وجه کامل وجود دارد." },
  { q: "آیا پلن رایگان محدودیت زمانی دارد؟", a: "خیر، پلن رایگان همیشگی است و محدودیت زمانی ندارد." },
];

function PricingPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-7xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">قیمت‌گذاری</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">پلن مناسب کسب‌وکار خود را انتخاب کنید</p>
        </motion.div>

        <StaggerChildren className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <motion.div
              key={plan.slug}
              variants={childVariant}
              className={`relative rounded-2xl border bg-card p-6 shadow-card transition-transform hover:scale-[1.02] ${plan.popular ? "border-primary ring-2 ring-primary/10" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-brand px-4 py-1 text-xs font-bold text-primary-foreground">
                  محبوب‌ترین
                </div>
              )}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
                  <plan.icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{plan.desc}</p>
                </div>
              </div>
              <div className="mb-5 text-2xl font-black text-foreground">{plan.price}</div>
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
                شروع کنید <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </StaggerChildren>

        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-xl font-bold text-foreground">سوالات متداول</h2>
          <div className="space-y-3 text-start">
            {faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
