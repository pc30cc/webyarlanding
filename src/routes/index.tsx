import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  MonitorUp,
  Send,
  Clock,
  Users,
  UserRound,
  Bot,
  Sparkles,
  Search,
  Eye,
  Mail,
  Plug,
  BookOpen,
  Globe,
  Layers,
  Phone,
  MessageSquare,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, parseSchemaJson, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant, FAQItem } from "@/components/site/animations";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const callEnabled = loaderData.settings.videoCall.enabled;
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/",
      override: loaderData.seoOverride,
      fallbackTitle: callEnabled
        ? "وب‌یار | چت زنده و تماس ویدیویی، فقط با یک خط کد"
        : "وب‌یار | چت زنده هوشمند، فقط با یک خط کد",
      fallbackDescription: callEnabled
        ? "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم می‌کند."
        : "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده مستقیم با بازدیدکننده‌ها را فراهم می‌کند.",
    });
  },
  component: IndexPage,
});

const float = (delay = 0) => ({
  animate: { y: [0, -14, 0] },
  transition: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut" as const, delay },
});

const trustLogos = [
  "WordPress",
  "WooCommerce",
  "Shopify",
  "PrestaShop",
  "Telegram",
  "WhatsApp",
  "Instagram",
  "Slack",
];

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

const platformFeatures = [
  {
    icon: MessageSquare,
    title: "صندوق گفتگوی یکپارچه",
    desc: "همه گفتگوهای ابزارک سایت، ایمیل و کانال‌های پیام‌رسان در یک صندوق مشترک؛ با پاسخ‌های آماده، گفتگوی تیمی و ارجاع به دپارتمان مناسب.",
  },
  {
    icon: Phone,
    title: "مرکز تماس",
    desc: "تماس صوتی و تصویری، صف زنده تماس، درخواست تماس مجدد، ضبط مکالمه و تنظیمات ساعت پاسخ‌گویی — همه در پنل مرکز تماس.",
  },
  {
    icon: Bot,
    title: "ایجنت هوش مصنوعی پیشرفته",
    desc: "آموزش ایجنت با محتوای سایت و پایگاه دانش، محیط آزمایش (Playground)، سناریوهای تست، مسیریابی گفتگو، تریگرها و گزارش عملکرد پاسخ‌ها.",
  },
  {
    icon: Sparkles,
    title: "کمک هوش مصنوعی به اپراتور",
    desc: "پیشنهاد پاسخ، خلاصه گفتگو و اصلاح لحن در لحظه برای اپراتور، همراه با تحلیل اینکه چقدر این پیشنهادها استفاده شده‌اند.",
  },
  {
    icon: Users,
    title: "مخاطبین و پروفایل مشتری",
    desc: "پروفایل کامل هر مخاطب، یادداشت و برچسب، ورود گروهی مخاطبین با ویزارد و خروجی گرفتن از فهرست مخاطبین.",
  },
  {
    icon: Eye,
    title: "رهگیری بازدیدکننده",
    desc: "ببینید هر بازدیدکننده در چه صفحه‌ای است، از کجا آمده و چه مسیری را طی کرده؛ و همان لحظه گفتگو را شروع کنید.",
  },
  {
    icon: BookOpen,
    title: "پایگاه دانش و مرکز راهنما",
    desc: "نوشتن مقاله راهنما، ساخت خودکار پایگاه دانش از محتوای سایت و انتشار مرکز راهنما برای پاسخ‌گویی بدون اپراتور.",
  },
  {
    icon: Search,
    title: "سئو و آنالیز وب",
    desc: "کاوشگر سایت، اتصال به سرچ کنسول گوگل، رصد برند، تحلیل رفتار ربات‌ها و آمار بازدید وب‌سایت در یک بخش یکپارچه.",
  },
  {
    icon: Mail,
    title: "ایمیل و کمپین",
    desc: "دریافت و پاسخ ایمیل در همان صندوق گفتگو و ارسال کمپین ایمیلی هدفمند برای بخش‌های مختلف مخاطبان.",
  },
  {
    icon: Plug,
    title: "افزونه‌ها و یکپارچه‌سازی",
    desc: "نصب روی وردپرس، ووکامرس، شاپیفای و پرستاشاپ، اتصال کانال‌های پیام‌رسان و مدیریت دامنه‌های مجاز ابزارک.",
  },
  {
    icon: BarChart3,
    title: "گزارش و تحلیل",
    desc: "زمان پاسخ‌گویی، حجم گفتگو، فعالیت هر اپراتور و عملکرد تماس‌ها با نمودارهای شفاف و قابل خروجی‌گیری.",
  },
  {
    icon: ShieldCheck,
    title: "امنیت، نقش‌ها و حریم خصوصی",
    desc: "دسترسی مبتنی بر نقش برای اعضای تیم، تنظیمات امنیتی حساب، تأیید شماره و رسیدگی به درخواست‌های حریم خصوصی کاربران.",
  },
];

const conversations = [
  { name: "سارا احمدی", msg: "قیمت پلن حرفه‌ای چقدره؟", time: "۲ دقیقه" },
  { name: "رضا کریمی", msg: "مشکل در پرداخت دارم", time: "۱۰ دقیقه" },
  { name: "مریم توکلی", msg: "ممنون از راهنمایی‌تون", time: "۲۵ دقیقه" },
  { name: "امیر رضایی", msg: "امکان تماس ویدیویی هست؟", time: "۱ ساعت" },
];

const steps = [
  { n: "۱", title: "کد ابزارک را کپی کنید", desc: "یک قطعه کد کوچک از پنل مدیریت دریافت کنید." },
  {
    n: "۲",
    title: "در سایت خود قرار دهید",
    desc: "کد را پیش از تگ بسته body در سایتتان جای‌گذاری کنید.",
  },
  {
    n: "۳",
    title: "گفتگو را شروع کنید",
    desc: "از همان لحظه، پیام‌ها و تماس‌ها را در پنل ببینید.",
  },
];

/** ماژول‌های واقعی پنل وب‌یار — همان بخش‌هایی که کاربر پس از ورود می‌بیند */
const moduleGroups = [
  {
    icon: Layers,
    title: "میز کار و گفتگو",
    items: [
      "نمای کلی و شاخص‌های روزانه",
      "صندوق گفتگو با پاسخ‌های آماده",
      "گفتگوی تیمی و ارجاع داخلی",
      "ساعات کاری و پیام خارج از دسترس",
      "ابزارک سایت و شخصی‌سازی ظاهر آن",
    ],
  },
  {
    icon: Phone,
    title: "مرکز تماس",
    items: [
      "تماس صوتی و تصویری از داخل چت",
      "صف زنده تماس‌ها",
      "درخواست تماس مجدد",
      "ضبط و بایگانی تماس",
      "راهنمای نصب و تنظیمات تماس",
    ],
  },
  {
    icon: Bot,
    title: "هوش مصنوعی",
    items: [
      "آموزش ایجنت و منابع دانش",
      "محیط آزمایش و سناریوهای تست",
      "قوانین رفتاری، تریگر و مسیریابی",
      "کمک هوشمند به اپراتور",
      "گزارش عملکرد و موضوعات پرتکرار",
    ],
  },
  {
    icon: Search,
    title: "سئو و آنالیز",
    items: [
      "کاوشگر سایت و بررسی صفحات",
      "اتصال به سرچ کنسول گوگل",
      "رصد برند",
      "تحلیل رفتار ربات‌ها",
      "آمار بازدید وب‌سایت",
    ],
  },
  {
    icon: Users,
    title: "مشتریان و تیم",
    items: [
      "مخاطبین، برچسب و یادداشت",
      "ورود و خروجی گرفتن مخاطبین",
      "بازدیدکنندگان زنده",
      "تیم، دپارتمان و سطح دسترسی",
      "گزارش فعالیت اپراتورها",
    ],
  },
  {
    icon: Globe,
    title: "اتصال‌ها و حساب",
    items: [
      "افزونه وردپرس، ووکامرس، شاپیفای و پرستاشاپ",
      "کانال‌های پیام‌رسان",
      "مدیریت دامنه‌های مجاز",
      "کیف پول، صورتحساب و اعتبار هوش مصنوعی",
      "تنظیمات امنیت و حریم خصوصی",
    ],
  },
];

function getFaqs(callEnabled: boolean) {
  return [
    {
      q: "وب‌یار دقیقاً چه چیزی به سایت من اضافه می‌کند؟",
      a: callEnabled
        ? "یک ابزارک گفتگو روی سایت شما می‌نشیند و پشت آن یک پنل کامل قرار دارد: صندوق گفتگوی یکپارچه، مرکز تماس صوتی و تصویری، ایجنت هوش مصنوعی، مخاطبین، بازدیدکنندگان زنده، پایگاه دانش، ابزارهای سئو و آنالیز، و گزارش‌ها."
        : "یک ابزارک گفتگو روی سایت شما می‌نشیند و پشت آن یک پنل کامل قرار دارد: صندوق گفتگوی یکپارچه، ایجنت هوش مصنوعی، مخاطبین، بازدیدکنندگان زنده، پایگاه دانش، ابزارهای سئو و آنالیز، و گزارش‌ها.",
    },
    {
      q: "نصب چطور انجام می‌شود؟",
      a: "یک قطعه کد کوتاه را پیش از تگ بسته body سایت قرار می‌دهید. برای وردپرس، ووکامرس، شاپیفای و پرستاشاپ هم راهنمای نصب اختصاصی در پنل موجود است.",
    },
    ...(callEnabled
      ? [
          {
            q: "تماس صوتی و تصویری چطور کار می‌کند؟",
            a: "تماس مستقیم از داخل همان پنجره گفتگو و درون مرورگر برقرار می‌شود؛ مشتری نیازی به نصب اپلیکیشن ندارد. صف تماس، درخواست تماس مجدد و ضبط مکالمه هم در بخش مرکز تماس در دسترس است.",
          },
        ]
      : []),
    {
      q: "ایجنت هوش مصنوعی چگونه آموزش می‌بیند؟",
      a: "ایجنت را با محتوای صفحات سایت و مقاله‌های پایگاه دانش آموزش می‌دهید، در محیط آزمایش پاسخ‌هایش را می‌سنجید، برایش قانون رفتاری و مسیریابی تعریف می‌کنید و کیفیت پاسخ‌ها را در گزارش‌ها دنبال می‌کنید.",
    },
    {
      q: "به چه کانال‌ها و سرویس‌هایی وصل می‌شود؟",
      a: "افزونه‌های نصب برای وردپرس، ووکامرس، شاپیفای و پرستاشاپ موجود است و کانال‌های پیام‌رسان مانند تلگرام، واتساپ، اینستاگرام و اسلک در بخش یکپارچه‌سازی‌ها مدیریت می‌شوند؛ برخی از این اتصال‌ها در حال عرضه‌اند.",
    },
    {
      q: "ابزارهای سئو و آنالیز شامل چه چیزهایی است؟",
      a: "کاوشگر سایت برای بررسی صفحات، اتصال به سرچ کنسول گوگل، رصد برند، تحلیل رفتار ربات‌های خزنده و آمار بازدید وب‌سایت.",
    },
    {
      q: "کنترل دسترسی اعضای تیم چگونه است؟",
      a: "اعضای تیم را در دپارتمان‌ها سازمان‌دهی می‌کنید و برای هر نقش سطح دسترسی مشخص تعریف می‌شود؛ فعالیت اپراتورها هم قابل مشاهده و گزارش‌گیری است.",
    },
    {
      q: "درخواست‌های حریم خصوصی کاربران چه می‌شود؟",
      a: "بخش حریم خصوصی پنل، درخواست‌های مربوط به داده‌های کاربران را ثبت و مدیریت می‌کند و امکان تعیین محل ذخیره‌سازی خروجی‌ها را می‌دهد.",
    },
  ];
}

function eyebrow(text: string) {
  return <div className="mb-3 text-sm font-bold text-primary">{text}</div>;
}

/** Real, self-hosted looping video of the brand's "live video call" screen — no third-party embed, no stock footage. */
function VideoCallMock({ className }: { className?: string }) {
  return (
    // این ویدیو کاملاً تزیینی و بی‌صداست (فقط نمایش بصری دمو، بدون گفتار)؛ اطلاعاتش هم در
    // متن اطراف صفحه (تیتر و توضیحات) به‌طور کامل آمده، پس از دید فناوری‌های کمکی مخفی است
    // و به زیرنویس نیاز ندارد.
    <video
      className={`h-full w-full object-cover ${className ?? ""}`}
      src="/videos/video-call.mp4"
      poster="/videos/video-call-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
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
  const callEnabled = settings.videoCall.enabled;
  const faqs = getFaqs(callEnabled);
  const visiblePlatformFeatures = callEnabled
    ? platformFeatures
    : platformFeatures.filter((f) => f.title !== "مرکز تماس");
  const visibleModuleGroups = callEnabled
    ? moduleGroups
    : moduleGroups.filter((g) => g.title !== "مرکز تماس");
  const visibleConversations = callEnabled
    ? conversations
    : conversations.filter((c) => c.name !== "امیر رضایی");

  const defaultJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: settings.brand.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: callEnabled
        ? "چت زنده، CRM، هوش مصنوعی، اتوماسیون، چت تصویری، سئو و کمپین — همه در وب‌یار"
        : "چت زنده، CRM، هوش مصنوعی، اتوماسیون، سئو و کمپین — همه در وب‌یار",
      offers: [{ "@type": "Offer", price: "0", priceCurrency: "IRR", name: "شروع" }],
    },
    // بازتاب همان سوالات و پاسخ‌های واقعی که در بخش FAQ همین صفحه نمایش داده می‌شود
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  const jsonLd = parseSchemaJson(seoOverride?.schemaJson) ?? defaultJsonLd;

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        {/* پس‌زمینه — نسبت به کل عرض section (نه ستون محتوا) تا در نمایش‌های عریض هم کامل باشد */}
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

        <div className="container-page relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
              {callEnabled
                ? "چت زنده، تماس تصویری، مرکز تماس و ایجنت هوش مصنوعی — در یک پنل"
                : "چت زنده و ایجنت هوش مصنوعی — در یک پنل"}
            </motion.div>

            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              {callEnabled ? "چت زنده و تماس ویدیویی،" : "چت زنده هوشمند،"}
              <br />
              <span className="text-brand">فقط با یک خط کد</span>
            </h1>

            <p className="mb-9 max-w-xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              {callEnabled
                ? "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم می‌کند."
                : "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده مستقیم با بازدیدکننده‌ها را فراهم می‌کند."}{" "}
              نصب در کمتر از ۵ دقیقه، بدون نیاز به برنامه‌نویس.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={settings.auth.signupUrl || "/contact"}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                {settings.auth.signupLabel || "شروع رایگان"} <ChevronLeft className="h-4 w-4" />
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                مشاهده امکانات
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              نصب با یک قطعه کد · افزونه آماده برای وردپرس، ووکامرس، شاپیفای و پرستاشاپ
            </p>
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
                  {callEnabled
                    ? "الان با تماس تصویری راهنماییتون می‌کنم 👇"
                    : "الان با یکی از اپراتورهامون وصلتون می‌کنم 👇"}
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border px-4 py-3.5">
                <div className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-xs text-muted-foreground">
                  پیام خود را بنویسید...
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </motion.div>

            {callEnabled && (
              <motion.div
                {...float(1)}
                className="absolute end-0 bottom-0 w-[280px] rounded-[18px] bg-foreground/90 p-3.5 shadow-2xl"
              >
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
            )}
          </div>
        </div>
      </section>

      {/* TRUST LOGOS */}
      <section className="border-y border-border px-4 py-9 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-5">
          {trustLogos.map((logo) => (
            <span key={logo} className="text-base font-bold tracking-wide text-muted-foreground">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* LIVE CHAT */}
      <section
        id="features"
        className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-[70px]"
      >
        <ScrollReveal className="lg:order-1">
          {eyebrow("چت زنده")}
          <h2 className="mb-5 text-2xl font-extrabold leading-[1.35] text-foreground sm:text-4xl">
            تمام مکالمات مشتریان، در یک پنل
          </h2>
          <p className="mb-7 text-base leading-[1.9] text-muted-foreground">
            هر پیامی که از سایت شما ارسال می‌شود، همان‌جا در پنل مدیریت وب‌یار قابل مشاهده و
            پاسخ‌گویی است؛ از موبایل یا دسکتاپ.
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
            {visibleConversations.map((row, i) => (
              <div
                key={row.name}
                className={`flex items-center gap-3 py-3.5 ${i ? "border-t border-border" : ""}`}
              >
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
      {callEnabled && (
        <section className="relative overflow-hidden bg-foreground px-4 py-20 sm:px-8 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -end-24 h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-[70px]">
            <ScrollReveal>
              {eyebrow("تماس ویدیویی")}
              <h2 className="mb-5 text-2xl font-extrabold leading-[1.35] text-background sm:text-4xl">
                وقتی متن کافی نیست، تصویر را روشن کنید
              </h2>
              <p className="mb-7 text-base leading-[1.9] text-background/70">
                با یک کلیک از داخل همان چت، تماس تصویری HD با مشتری برقرار کنید؛ بدون نصب اپلیکیشن
                یا افزونه از طرف او.
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
      )}

      {/* ALL-IN-ONE PLATFORM */}
      <section className="container-page py-20 sm:py-28">
        <ScrollReveal className="mb-14 text-center">
          {eyebrow("همه‌چیز در یک پلتفرم")}
          <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">
            فراتر از چت — یک CRM کامل برای ارتباط با مشتری
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground">
            {callEnabled
              ? "چت زنده و تماس تصویری فقط شروع کار وب‌یار است؛"
              : "چت زنده فقط شروع کار وب‌یار است؛"}{" "}
            هوش مصنوعی، CRM، اتوماسیون، کمپین و گزارش‌گیری هم در همان پنل، بدون نیاز به هیچ ابزار
            جداگانه‌ای در اختیار شماست.
          </p>
        </ScrollReveal>
        <StaggerChildren className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visiblePlatformFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={childVariant}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-glow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-[1.8] text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* STEPS */}
      <section className="container-page py-20 sm:py-28">
        <ScrollReveal className="mb-14 text-center">
          {eyebrow("شروع سریع")}
          <h2 className="text-2xl font-extrabold text-foreground sm:text-4xl">
            سه قدم تا اولین گفتگو
          </h2>
        </ScrollReveal>
        <StaggerChildren className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <motion.div key={s.n} variants={childVariant} className="px-5 py-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="mb-2.5 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mx-auto max-w-xs text-sm leading-[1.8] text-muted-foreground">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* MODULES */}
      <section className="bg-secondary/30 px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-14 text-center">
            {eyebrow("داخل پنل")}
            <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">
              هر چیزی که پس از ورود در اختیار دارید
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground">
              فهرست بخش‌های واقعی پنل وب‌یار؛ از گفتگو و تماس تا هوش مصنوعی، سئو، مخاطبین و تنظیمات
              حساب.
            </p>
          </ScrollReveal>
          <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleModuleGroups.map((g) => (
              <motion.div
                key={g.title}
                variants={childVariant}
                className="rounded-2xl border border-border bg-card p-7 shadow-card"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <g.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-base font-bold text-foreground">{g.title}</h3>
                </div>
                <ul className="space-y-3">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span className="mt-1 flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-primary/15">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </span>
                      <span className="leading-[1.7]">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </StaggerChildren>

          <ScrollReveal className="mt-12 text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-sm font-bold text-primary-foreground"
            >
              مقایسه پلن‌ها و امکانات هر پلن <ChevronLeft className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
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
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -start-20 h-72 w-72 rounded-full bg-primary-foreground/15"
          />
          <h2 className="relative mb-4 text-2xl font-extrabold text-primary-foreground sm:text-3xl">
            همین امروز وب‌یار را روی سایتتان نصب کنید
          </h2>
          <p className="relative mb-8 text-base text-primary-foreground/90">
            {callEnabled
              ? "گفتگو، تماس، هوش مصنوعی، مخاطبین، سئو و گزارش‌ها — همه از یک پنل"
              : "گفتگو، هوش مصنوعی، مخاطبین، سئو و گزارش‌ها — همه از یک پنل"}
          </p>
          <a
            href={settings.auth.signupUrl || "/contact"}
            className="relative inline-block rounded-xl bg-card px-9 py-4 text-base font-bold text-primary"
          >
            {settings.auth.signupLabel || "شروع رایگان"}
          </a>
        </div>
      </ScrollReveal>
    </SiteLayout>
  );
}
