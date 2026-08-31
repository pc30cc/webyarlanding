import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Briefcase,
  Rocket,
  GraduationCap,
  HeartPulse,
  Building2,
  Check,
  ChevronLeft,
} from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, parseSchemaJson } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/solutions")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/solutions" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/solutions",
      override: loaderData.seoOverride,
      fallbackTitle: "راه‌کارها | راه‌حل وب‌یار برای هر صنعت | وب‌یار",
      fallbackDescription:
        "راه‌کارهای اختصاصی وب‌یار برای فروشگاه‌های اینترنتی، کسب‌وکارهای خدماتی، استارتاپ‌ها، آموزش آنلاین، کلینیک‌های درمانی و آژانس‌های املاک.",
    });
  },
  component: SolutionsPage,
});

const TINTS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-success/10", text: "text-success" },
];

const solutions = [
  {
    icon: ShoppingCart,
    title: "فروشگاه‌های اینترنتی",
    desc: "کاهش سبدهای خرید رهاشده با پاسخ‌گویی آنی و راهنمایی زنده مشتری حین خرید.",
    bullets: [
      "چت پیش از خرید برای رفع تردید مشتری",
      "پیگیری خودکار سبدهای خرید رهاشده",
      "اتصال به واتساپ برای ارسال فاکتور و کد رهگیری",
      "گزارش نرخ تبدیل بازدیدکننده به خریدار",
    ],
  },
  {
    icon: Briefcase,
    title: "کسب‌وکارهای خدماتی",
    desc: "رزرو وقت، پاسخ به سوالات متداول و پیگیری مشتریان، همه در یک پنل.",
    bullets: [
      "دستیار هوش مصنوعی برای پاسخ به سوالات تکراری",
      "هماهنگی نوبت از طریق چت زنده",
      "CRM برای ثبت تاریخچه کامل هر مشتری",
      "یادآوری خودکار قرارهای ملاقات",
    ],
  },
  {
    icon: Rocket,
    title: "استارتاپ‌ها و شرکت‌های SaaS",
    desc: "پشتیبانی محصول، آنبوردینگ کاربر جدید و جمع‌آوری بازخورد در یک ابزار سبک.",
    bullets: [
      "تماس ویدیویی برای دمو و آنبوردینگ کاربران",
      "اتصال به API برای همگام‌سازی داده کاربران",
      "پیگیری خودکار کاربران دوره آزمایشی",
      "گزارش رضایت و بازخورد کاربران",
    ],
  },
  {
    icon: GraduationCap,
    title: "آموزش آنلاین",
    desc: "پاسخ‌گویی به دانشجویان و برگزاری جلسات مشاوره تصویری با اساتید و مشاوران.",
    bullets: [
      "تماس ویدیویی برای مشاوره و رفع اشکال",
      "دستیار هوش مصنوعی برای سوالات متداول دوره‌ها",
      "پیگیری خودکار ثبت‌نام‌های نیمه‌تمام",
      "گزارش تعامل و رضایت دانشجویان",
    ],
  },
  {
    icon: HeartPulse,
    title: "کلینیک‌ها و مراکز درمانی",
    desc: "هماهنگی نوبت، مشاوره اولیه تصویری و پیگیری بیماران با رعایت کامل محرمانگی.",
    bullets: [
      "مشاوره اولیه با تماس ویدیویی امن",
      "رزرو و یادآوری نوبت از طریق چت",
      "تاریخچه کامل ارتباط با هر بیمار",
      "اطلاع‌رسانی نتایج از طریق واتساپ",
    ],
  },
  {
    icon: Building2,
    title: "آژانس‌های املاک",
    desc: "بازدید تصویری از ملک، پاسخ سریع به مشتری و پیگیری خودکار سرنخ‌های فروش.",
    bullets: [
      "بازدید ملک با تماس ویدیویی زنده",
      "ثبت و دسته‌بندی سرنخ‌های خریدار و مستاجر",
      "پیگیری خودکار مشتریان علاقه‌مند",
      "اشتراک‌گذاری صفحه برای نمایش نقشه و مدارک",
    ],
  },
] as const;

function SolutionsPage() {
  const { settings, seoOverride } = Route.useLoaderData();

  const jsonLd = parseSchemaJson(seoOverride?.schemaJson) ?? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "راه‌کارهای وب‌یار",
    itemListElement: solutions.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.desc,
        provider: { "@type": "Organization", name: settings.brand.name },
      },
    })),
  };

  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-primary/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -start-24 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl xl:-start-10 xl:h-[560px] xl:w-[560px] 2xl:h-[680px] 2xl:w-[680px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-32 -end-16 h-[340px] w-[340px] rounded-full bg-primary/15 blur-3xl xl:top-24 xl:-end-4 xl:h-[460px] xl:w-[460px] 2xl:h-[560px] 2xl:w-[560px]"
        />

        <div className="container-page relative z-10 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-3 text-sm font-bold text-primary">راه‌کارها</div>
            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              راه‌حلی مخصوص <span className="text-brand">کسب‌وکار شما</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              وب‌یار برای هر صنعت به شکل متفاوتی به کار می‌آید. راه‌کار اختصاصی حوزه فعالیت خودتان
              را ببینید.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-page pb-16 sm:pb-24">
        <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((s, i) => {
            const tint = TINTS[i % TINTS.length]!;
            return (
              <motion.div
                key={s.title}
                variants={childVariant}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-glow sm:p-7"
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tint.bg}`}
                >
                  <s.icon className={`h-7 w-7 ${tint.text}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <ul className="mt-auto space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </StaggerChildren>
      </div>

      <div className="bg-secondary/30 px-4 py-16 text-center sm:px-8 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">
            صنعت خودتان را پیدا نکردید؟
          </h2>
          <p className="mb-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
            وب‌یار برای هر کسب‌وکاری که نیاز به ارتباط زنده با مشتری دارد قابل تنظیم است. با ما تماس
            بگیرید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              مشاوره رایگان <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center rounded-xl border border-border px-10 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              مشاهده محصولات
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
