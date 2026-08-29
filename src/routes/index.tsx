import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check, ChevronLeft, Mic, MicOff, PhoneOff, Video, MonitorUp, Send, Clock, Users, MessageSquare, UserRound,
} from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, parseSchemaJson } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant, FAQItem } from "@/components/site/animations";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([fetchSettings(), getPublicSeoPage({ data: { path: "/" } })]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/",
      override: loaderData.seoOverride,
      fallbackTitle: "وب‌یار | چت زنده و تماس ویدیویی، فقط با یک خط کد",
      fallbackDescription:
        "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم می‌کند.",
    });
  },
  component: IndexPage,
});

const float = (delay = 0) => ({
  animate: { y: [0, -14, 0] },
  transition: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut" as const, delay },
});

const trustLogos = ["دیجی‌مد", "فروشگاه آفتاب", "کالاباز", "نت‌برگ", "مدیا۲۴"];

const chatFeatures = [
  { title: "گفتگوی بلادرنگ", desc: "پیام‌های بازدیدکننده‌ها را همان لحظه ببینید و پاسخ دهید." },
  { title: "اپلیکیشن موبایل و دسکتاپ", desc: "از هر جا به گفتگوها دسترسی داشته باشید." },
  { title: "تاریخچه کامل مشتریان", desc: "سابقه بازدید و مکالمات قبلی هر مشتری را ببینید." },
  { title: "پیام خودکار خوش‌آمدگویی", desc: "با قوانین ساده، اولین پیام را خودکار ارسال کنید." },
];

const videoFeatures = [
  { title: "تماس یک‌کلیکی", desc: "مستقیم از پنجره چت، بدون لینک یا نرم‌افزار جدا." },
  { title: "اشتراک‌گذاری صفحه", desc: "صفحه نمایش را برای راهنمایی بهتر مشتری به اشتراک بگذارید." },
  { title: "بدون نصب برای مشتری", desc: "تماس مستقیم در مرورگر، بدون دانلود اپ." },
  { title: "کیفیت HD", desc: "تصویر روشن حتی با اینترنت محدود." },
];

const conversations = [
  { name: "سارا احمدی", msg: "قیمت پلن حرفه‌ای چقدره؟", time: "۲ دقیقه" },
  { name: "رضا کریمی", msg: "مشکل در پرداخت دارم", time: "۱۰ دقیقه" },
  { name: "مریم توکلی", msg: "ممنون از راهنمایی‌تون", time: "۲۵ دقیقه" },
  { name: "امیر رضایی", msg: "امکان تماس ویدیویی هست؟", time: "۱ ساعت" },
];

const steps = [
  { n: "۱", title: "کد ابزارک را کپی کنید", desc: "یک قطعه کد کوچک از پنل مدیریت دریافت کنید." },
  { n: "۲", title: "در سایت خود قرار دهید", desc: "کد را پیش از تگ بسته body در سایتتان جای‌گذاری کنید." },
  { n: "۳", title: "گفتگو را شروع کنید", desc: "از همان لحظه، پیام‌ها و تماس‌ها را در پنل ببینید." },
];

function getPlans(period: "monthly" | "yearly") {
  return [
    {
      name: "شروع", tagline: "برای سایت‌های کوچک و شروع کار", price: "رایگان", unit: "", cta: "شروع کنید",
      features: ["۱ اپراتور", "چت زنده نامحدود", "تاریخچه ۳۰ روزه", "ابزارک قابل شخصی‌سازی", "پشتیبانی ایمیلی"],
      highlight: false,
    },
    {
      name: "حرفه‌ای", tagline: "برای تیم‌های در حال رشد",
      price: period === "yearly" ? "۳۹۲٬۰۰۰" : "۴۹۰٬۰۰۰",
      unit: period === "yearly" ? "تومان / ماه، سالانه" : "تومان / ماهانه",
      cta: "۱۴ روز رایگان",
      features: ["۵ اپراتور", "تماس ویدیویی HD", "اشتراک‌گذاری صفحه", "تاریخچه نامحدود", "گزارش‌های پیشرفته", "پشتیبانی اولویت‌دار"],
      highlight: true,
    },
    {
      name: "سازمانی", tagline: "برای کسب‌وکارهای بزرگ", price: "تماس بگیرید", unit: "", cta: "گفتگو با فروش",
      features: ["اپراتور نامحدود", "نصب روی سرور اختصاصی", "SSO و کنترل دسترسی", "SLA اختصاصی", "مدیر حساب اختصاصی"],
      highlight: false,
    },
  ];
}

const testimonials = [
  { name: "سارا محمدی", role: "مدیر پشتیبانی — دیجی‌استایل", text: "از زمانی که وب‌یار رو جایگزین سیستم قبلی‌مون کردیم، زمان پاسخ‌دهی ۶۰٪ کاهش پیدا کرد." },
  { name: "امیر حسینی", role: "بنیان‌گذار — تکنوشاپ", text: "هوش مصنوعی وب‌یار ۴۰٪ از سوالات رو بدون دخالت اپراتور جواب میده. فوق‌العاده‌ست!" },
  { name: "مریم رضایی", role: "مدیر بازاریابی — فین‌تک‌پلاس", text: "ابزار کمپین و CRM وب‌یار بهترین ترکیبی‌ه که دیدم. نرخ تبدیل ما ۳۵٪ رشد کرد." },
];

const faqs = [
  { q: "وب‌یار چیست و چه کاربردی دارد؟", a: "وب‌یار یک پلتفرم جامع مدیریت ارتباط با مشتری (CRM) است که شامل چت زنده، هوش مصنوعی، اتوماسیون، کمپین، چت تصویری، ابزارهای سئو و گزارش‌دهی پیشرفته می‌شود." },
  { q: "آیا پلن رایگان محدودیتی دارد؟", a: "پلن رایگان شامل ۱ اپراتور، چت زنده، CRM پایه و ۱٬۰۰۰ گفتگو در ماه است." },
  { q: "آیا می‌توانم وب‌یار را روی سایت خودم نصب کنم؟", a: "بله! فقط کافیه یک قطعه کد ساده را قبل از تگ </body> سایتتان قرار دهید." },
  { q: "هوش مصنوعی وب‌یار چگونه کار می‌کند؟", a: "دستیار هوشمند وب‌یار بر اساس پایگاه دانش شما آموزش می‌بیند و می‌تواند به سوالات متداول مشتریان پاسخ دهد." },
  { q: "آیا امکان اتصال به واتساپ و تلگرام وجود دارد؟", a: "بله، وب‌یار از ارتباط چندکاناله پشتیبانی می‌کند." },
  { q: "امنیت اطلاعات ما چگونه تضمین می‌شود؟", a: "وب‌یار از رمزنگاری end-to-end، کنترل دسترسی مبتنی بر نقش (RBAC) با ۱۸ سطح مختلف استفاده می‌کند." },
  { q: "آیا API برای یکپارچه‌سازی دارید؟", a: "بله، وب‌یار دارای REST API کامل و سیستم Webhook برای اتصال به هر سرویس خارجی است." },
];

function eyebrow(text: string) {
  return <div className="mb-3 text-sm font-bold text-primary">{text}</div>;
}

/** Real, self-hosted looping video of the brand's "live video call" screen — no third-party embed, no stock footage. */
function VideoCallMock({ className }: { className?: string }) {
  return (
    <video
      className={`h-full w-full object-cover ${className ?? ""}`}
      src="/videos/video-call.mp4"
      poster="/videos/video-call-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="نمایش تماس ویدیویی زنده در ابزارک وب‌یار"
    />
  );
}

/** Picture-in-picture "operator" avatar — a plain static icon, not a photo. */
function OperatorAvatar({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-foreground ${className ?? ""}`}>
      <UserRound className="h-4 w-4 text-background/85" />
    </div>
  );
}

function IndexPage() {
  const { settings, seoOverride } = Route.useLoaderData();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: settings.brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "چت زنده، CRM، هوش مصنوعی، اتوماسیون، چت تصویری، سئو و کمپین — همه در وب‌یار",
    offers: [{ "@type": "Offer", price: "0", priceCurrency: "IRR", name: "شروع" }],
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "340" },
  };
  const jsonLd = parseSchemaJson(seoOverride?.schemaJson) ?? defaultJsonLd;

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="container-page relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div aria-hidden className="pointer-events-none absolute -top-40 -start-48 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-32 -end-32 h-[340px] w-[340px] rounded-full bg-primary/15 blur-3xl" />

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"
            >
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-[7px] w-[7px] rounded-full bg-success"
              />
              همین حالا ۲٬۰۰۰+ کسب‌وکار از وب‌یار استفاده می‌کنند
            </motion.div>

            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              چت زنده و تماس ویدیویی،
              <br />
              <span className="text-brand">فقط با یک خط کد</span>
            </h1>

            <p className="mb-9 max-w-xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم
              می‌کند. نصب در کمتر از ۵ دقیقه، بدون نیاز به برنامه‌نویس.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                شروع رایگان <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                مشاهده دمو
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">بدون نیاز به کارت بانکی · لغو در هر زمان</p>
          </div>

          <div className="relative hidden h-[430px] sm:block sm:h-[520px]">
            <motion.div
              {...float(0)}
              className="absolute end-[10%] top-5 w-[320px] overflow-hidden rounded-[20px] bg-card shadow-card"
            >
              <div className="flex items-center gap-3 bg-brand p-5">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/90" />
                <div>
                  <div className="text-sm font-bold text-primary-foreground">پشتیبانی وب‌یار</div>
                  <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    آنلاین
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 bg-muted px-4 py-4">
                <div className="max-w-[80%] self-start rounded-[14px] rounded-es-sm bg-card px-3.5 py-2.5 text-xs text-card-foreground shadow-sm">
                  سلام! چطور می‌تونم کمکتون کنم؟
                </div>
                <div className="max-w-[80%] self-end rounded-[14px] rounded-ee-sm bg-primary px-3.5 py-2.5 text-xs text-primary-foreground">
                  قیمت پلن حرفه‌ای چقدره؟
                </div>
                <div className="max-w-[80%] self-start rounded-[14px] rounded-es-sm bg-card px-3.5 py-2.5 text-xs text-card-foreground shadow-sm">
                  الان با تماس تصویری راهنماییتون می‌کنم 👇
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border px-4 py-3.5">
                <div className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-xs text-muted-foreground">پیام خود را بنویسید...</div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </motion.div>

            <motion.div {...float(1)} className="absolute end-0 bottom-0 w-[280px] rounded-[18px] bg-foreground/90 p-3.5 shadow-2xl">
              <div className="relative h-[150px] overflow-hidden rounded-xl">
                <VideoCallMock />
                <OperatorAvatar className="absolute start-2.5 bottom-2.5 h-12 w-16 rounded-lg border-2 border-background/40" />
              </div>
              <div className="mt-3.5 flex items-center justify-center gap-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10">
                  <Mic className="h-4 w-4 text-background" />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10">
                  <Video className="h-4 w-4 text-background" />
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive">
                  <PhoneOff className="h-5 w-5 text-destructive-foreground" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST LOGOS */}
      <section className="border-y border-border px-4 py-9 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-5">
          {trustLogos.map((logo) => (
            <span key={logo} className="text-base font-bold tracking-wide text-muted-foreground/70">{logo}</span>
          ))}
        </div>
      </section>

      {/* LIVE CHAT */}
      <section id="features" className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-[70px]">
        <ScrollReveal className="lg:order-1">
          {eyebrow("چت زنده")}
          <h2 className="mb-5 text-2xl font-extrabold leading-[1.35] text-foreground sm:text-4xl">
            تمام مکالمات مشتریان، در یک پنل
          </h2>
          <p className="mb-7 text-base leading-[1.9] text-muted-foreground">
            هر پیامی که از سایت شما ارسال می‌شود، همان‌جا در پنل مدیریت وب‌یار قابل مشاهده و پاسخ‌گویی است؛ از موبایل یا دسکتاپ.
          </p>
          <div className="space-y-4">
            {chatFeatures.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-primary/15">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </span>
                <div>
                  <div className="mb-0.5 text-sm font-bold text-foreground">{f.title}</div>
                  <div className="text-sm leading-[1.7] text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="rounded-3xl bg-secondary/30 p-5 lg:order-2 sm:p-7">
          <div className="rounded-2xl bg-card p-5 shadow-card">
            {conversations.map((row, i) => (
              <div key={row.name} className={`flex items-center gap-3 py-3.5 ${i ? "border-t border-border" : ""}`}>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {row.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{row.msg}</div>
                </div>
                <div className="flex flex-none items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {row.time}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* VIDEO CALL */}
      <section className="relative overflow-hidden bg-foreground px-4 py-20 sm:px-8 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-24 h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-[70px]">
          <ScrollReveal>
            {eyebrow("تماس ویدیویی")}
            <h2 className="mb-5 text-2xl font-extrabold leading-[1.35] text-background sm:text-4xl">
              وقتی متن کافی نیست، تصویر را روشن کنید
            </h2>
            <p className="mb-7 text-base leading-[1.9] text-background/70">
              با یک کلیک از داخل همان چت، تماس تصویری HD با مشتری برقرار کنید؛ بدون نصب اپلیکیشن یا افزونه از طرف او.
            </p>
            <div className="space-y-4">
              {videoFeatures.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-accent/25">
                    <Check className="h-3.5 w-3.5 text-background" />
                  </span>
                  <div>
                    <div className="mb-0.5 text-sm font-bold text-background">{f.title}</div>
                    <div className="text-sm leading-[1.7] text-background/65">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal className="rounded-[20px] bg-background/5 p-4 shadow-2xl">
            <div className="relative h-[280px] overflow-hidden rounded-[14px]">
              <VideoCallMock />
              <OperatorAvatar className="absolute start-4 bottom-4 h-20 w-28 rounded-xl border-2 border-background/30" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/10">
                <MicOff className="h-5 w-5 text-background" />
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/10">
                <Video className="h-5 w-5 text-background" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
                <PhoneOff className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/10">
                <MonitorUp className="h-5 w-5 text-background" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STEPS */}
      <section className="container-page py-20 sm:py-28">
        <ScrollReveal className="mb-14 text-center">
          {eyebrow("شروع سریع")}
          <h2 className="text-2xl font-extrabold text-foreground sm:text-4xl">سه قدم تا اولین گفتگو</h2>
        </ScrollReveal>
        <StaggerChildren className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <motion.div key={s.n} variants={childVariant} className="px-5 py-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="mb-2.5 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mx-auto max-w-xs text-sm leading-[1.8] text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-secondary/30 px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            {eyebrow("قیمت‌گذاری")}
            <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">پلنی متناسب با کسب‌وکار شما</h2>
          </ScrollReveal>

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

          <StaggerChildren className="grid gap-6 md:grid-cols-3">
            {getPlans(period).map((plan) => (
              <motion.div
                key={plan.name}
                variants={childVariant}
                className={`relative rounded-[20px] border bg-card p-8 ${plan.highlight ? "border-primary shadow-glow" : "border-border shadow-card"}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 end-7 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-primary-foreground">
                    پیشنهادی
                  </span>
                )}
                <div className="mb-2 text-lg font-extrabold text-foreground">{plan.name}</div>
                <p className="mb-6 text-sm leading-[1.7] text-muted-foreground">{plan.tagline}</p>
                <div className="mb-7 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  {plan.unit && <span className="text-sm text-muted-foreground">{plan.unit}</span>}
                </div>
                <Link
                  to="/pricing"
                  className={`mb-7 block rounded-xl py-3.5 text-center text-sm font-bold transition-opacity hover:opacity-90 ${
                    plan.highlight ? "bg-brand text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/85">
                      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-primary/15">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-20 sm:py-28">
        <ScrollReveal className="mb-14 text-center">
          {eyebrow("اعتماد مشتریان")}
          <h2 className="text-2xl font-extrabold text-foreground sm:text-4xl">آنچه کاربران می‌گویند</h2>
        </ScrollReveal>
        <StaggerChildren className="grid gap-7 md:grid-cols-2">
          {testimonials.map((tm) => (
            <motion.figure key={tm.name} variants={childVariant} className="rounded-[20px] bg-secondary/30 p-8">
              <blockquote className="mb-6 text-base leading-[1.9] text-foreground sm:text-lg">«{tm.text}»</blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {tm.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">{tm.name}</span>
                  <span className="block text-xs text-muted-foreground">{tm.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </StaggerChildren>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/30 px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="mb-14 text-center">
            {eyebrow("پرسش‌های متداول")}
            <h2 className="text-2xl font-extrabold text-foreground sm:text-4xl">سوالی دارید؟</h2>
          </ScrollReveal>
          <div className="space-y-3.5">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 0.04}>
                <FAQItem q={faq.q} a={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <ScrollReveal className="container-page my-16">
        <div className="relative overflow-hidden rounded-[28px] bg-brand px-6 py-16 text-center sm:px-10">
          <div aria-hidden className="pointer-events-none absolute -top-20 -start-20 h-72 w-72 rounded-full bg-primary-foreground/15" />
          <h2 className="relative mb-4 text-2xl font-extrabold text-primary-foreground sm:text-3xl">
            همین امروز وب‌یار را روی سایتتان نصب کنید
          </h2>
          <p className="relative mb-8 text-base text-primary-foreground/90">
            ۱۴ روز استفاده رایگان از تمام امکانات، بدون نیاز به کارت بانکی
          </p>
          <Link to="/contact" className="relative inline-block rounded-xl bg-card px-9 py-4 text-base font-bold text-primary">
            شروع رایگان
          </Link>
        </div>
      </ScrollReveal>
    </SiteLayout>
  );
}
