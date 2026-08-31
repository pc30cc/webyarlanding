import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Video,
  Sparkles,
  Users,
  Megaphone,
  Share2,
  Palette,
  BarChart3,
  Webhook,
  Check,
  ChevronLeft,
} from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, parseSchemaJson } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/products")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/products" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/products",
      override: loaderData.seoOverride,
      fallbackTitle: "محصولات | چت زنده، تماس ویدیویی، CRM و هوش مصنوعی | وب‌یار",
      fallbackDescription:
        "معرفی کامل محصولات وب‌یار: چت زنده، تماس ویدیویی HD، دستیار هوش مصنوعی، CRM، اتوماسیون و کمپین، ارتباط چندکاناله، گزارش‌های پیشرفته و API — همه در یک پلتفرم.",
    });
  },
  component: ProductsPage,
});

const TINTS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-success/10", text: "text-success" },
];

const products = [
  {
    icon: MessageSquare,
    title: "چت زنده",
    desc: "گفتگوی بلادرنگ با بازدیدکننده‌های سایت، مستقیم از یک ابزارک سبک روی هر صفحه.",
    bullets: [
      "پاسخ‌گویی آنی بدون تأخیر",
      "تاریخچه کامل مکالمات هر مشتری",
      "ارسال فایل، عکس و ایموجی",
      "اختصاص خودکار گفتگو به اپراتور مناسب",
    ],
  },
  {
    icon: Video,
    title: "تماس ویدیویی HD",
    desc: "تماس تصویری یک‌کلیکی از همان پنجره چت، بدون نیاز به نصب اپلیکیشن برای مشتری.",
    bullets: [
      "کیفیت HD حتی با اینترنت محدود",
      "اشتراک‌گذاری صفحه برای راهنمایی بهتر",
      "ضبط و بایگانی تماس‌ها",
      "بدون لینک یا نرم‌افزار جداگانه",
    ],
  },
  {
    icon: Sparkles,
    title: "دستیار هوش مصنوعی",
    desc: "پاسخ‌گویی خودکار به سوالات پرتکرار بر اساس پایگاه دانش اختصاصی کسب‌وکار شما.",
    bullets: [
      "پاسخ فوری به بیش از ۴۰٪ گفتگوها بدون اپراتور",
      "یادگیری از مقالات و مستندات سایت شما",
      "تحویل هوشمند مکالمه به اپراتور در موارد پیچیده",
      "پشتیبانی کامل از زبان فارسی",
    ],
  },
  {
    icon: Users,
    title: "CRM و مدیریت مشتریان",
    desc: "پروفایل کامل هر مشتری، تاریخچه بازدید و مکالمات، در یک پنل یکپارچه.",
    bullets: [
      "پروفایل ۳۶۰ درجه از هر مشتری",
      "برچسب‌گذاری و دسته‌بندی مخاطبین",
      "یادداشت و پیگیری داخلی تیم",
      "جست‌وجوی سریع در تاریخچه گفتگوها",
    ],
  },
  {
    icon: Megaphone,
    title: "اتوماسیون و کمپین",
    desc: "قوانین خودکار برای خوش‌آمدگویی، پیگیری مشتریان و ارسال کمپین‌های هدفمند.",
    bullets: [
      "پیام خودکار خوش‌آمدگویی بر اساس رفتار کاربر",
      "کمپین‌های ایمیلی و پیامکی هدفمند",
      "پیگیری خودکار مشتریان سرد",
      "زمان‌بندی و تحلیل نرخ تبدیل کمپین‌ها",
    ],
  },
  {
    icon: Share2,
    title: "ارتباط چندکاناله",
    desc: "تمام پیام‌های واتساپ، تلگرام و اینستاگرام را در یک صندوق ورودی یکپارچه مدیریت کنید.",
    bullets: [
      "اتصال به واتساپ بیزینس",
      "اتصال به تلگرام و اینستاگرام",
      "مدیریت همه کانال‌ها از یک پنل",
      "گزارش عملکرد به‌تفکیک هر کانال",
    ],
  },
  {
    icon: Palette,
    title: "ابزارک قابل شخصی‌سازی",
    desc: "رنگ، موقعیت، متن و رفتار ابزارک را دقیقاً مطابق هویت بصری برند خود تنظیم کنید.",
    bullets: [
      "تنظیم رنگ و لوگو مطابق برند",
      "موقعیت راست یا چپ صفحه",
      "نصب با یک خط کد، بدون برنامه‌نویس",
      "سازگار با هر سایت و فروشگاه اینترنتی",
    ],
  },
  {
    icon: BarChart3,
    title: "گزارش‌ها و تحلیل‌های پیشرفته",
    desc: "عملکرد تیم پشتیبانی و فروش را با گزارش‌های دقیق و لحظه‌ای رصد کنید.",
    bullets: [
      "میانگین زمان پاسخ‌گویی هر اپراتور",
      "نرخ رضایت مشتریان",
      "گزارش حجم گفتگو در بازه‌های زمانی",
      "خروجی Excel برای تحلیل بیشتر",
    ],
  },
  {
    icon: Webhook,
    title: "API و یکپارچه‌سازی",
    desc: "REST API کامل و سیستم Webhook برای اتصال وب‌یار به سایر ابزارهای کسب‌وکار شما.",
    bullets: [
      "REST API کامل و مستندشده",
      "Webhook برای رویدادهای لحظه‌ای",
      "اتصال به فروشگاه‌ساز و CRM‌های دیگر",
      "کلید API اختصاصی برای هر حساب",
    ],
  },
] as const;

function ProductsPage() {
  const { settings, seoOverride } = Route.useLoaderData();

  const jsonLd = parseSchemaJson(seoOverride?.schemaJson) ?? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "محصولات وب‌یار",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: p.title,
        description: p.desc,
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
            <div className="mb-3 text-sm font-bold text-primary">محصولات</div>
            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              هر چیزی که برای <span className="text-brand">ارتباط با مشتری</span> نیاز دارید
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              چت زنده، تماس ویدیویی، هوش مصنوعی، CRM و اتوماسیون — همه در یک پلتفرم یکپارچه، با نصب
              در کمتر از ۵ دقیقه و بدون نیاز به تیم فنی.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-page pb-16 sm:pb-24">
        <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => {
            const tint = TINTS[i % TINTS.length]!;
            return (
              <motion.div
                key={p.title}
                variants={childVariant}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-glow sm:p-7"
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tint.bg}`}
                >
                  <p.icon className={`h-7 w-7 ${tint.text}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{p.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                <ul className="mt-auto space-y-2">
                  {p.bullets.map((b) => (
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
            راه‌کار مناسب کسب‌وکار خودتان را پیدا کنید
          </h2>
          <p className="mb-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
            محصولات وب‌یار برای صنایع مختلف، از فروشگاه اینترنتی تا کلینیک درمانی، به‌صورت اختصاصی
            چیده می‌شوند.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/solutions"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              مشاهده راه‌کارها <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-xl border border-border px-10 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              مشاهده قیمت‌ها
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
