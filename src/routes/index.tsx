import operatorAvatar from "@/assets/operator-avatar.jpg";
import { LoopVideo } from "@/components/site/LoopVideo";
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
import { joinFa } from "@/lib/settings";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, parseSchemaJson, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant, FAQItem } from "@/components/site/animations";
import { AuroraBackdrop, Marquee, SectionHeading } from "@/components/site/magic";
import { StoreBadge, AppleIcon, AndroidIcon, WindowsIcon } from "@/components/site/brand-icons";
import { PhoneFrame, DesktopFrame, InboxScreen, CallScreen, WindowsScreen } from "@/components/site/devices";
import { getPublicApps } from "@/lib/apps.functions";
import {
  siWordpress,
  siWoocommerce,
  siShopify,
  siPrestashop,
  siTelegram,
  siWhatsapp,
  siInstagram,
  siGmail,
} from "simple-icons";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [settings, seoOverride, apps] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/" } }),
      getPublicApps(),
    ]);
    return { settings, seoOverride, apps };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const callEnabled = loaderData.settings.videoCall.enabled;
    const meta = buildPageMeta({
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
    const origin = "https://webyar.ai";
    const videoLd = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "تماس تصویری زنده با بازدیدکننده سایت در وب‌یار",
      description:
        "نمونه‌ای کوتاه از تماس تصویری مستقیم اپراتور با بازدیدکننده سایت از طریق ابزارک وب‌یار.",
      thumbnailUrl: [`${origin}/videos/video-call-poster.jpg`],
      contentUrl: `${origin}/videos/video-call.mp4`,
      uploadDate: "2026-09-24T06:00:00Z",
      duration: "PT6S",
      inLanguage: "fa-IR",
    };
    return {
      ...meta,
      scripts: [
        ...((meta as { scripts?: unknown[] }).scripts ?? []),
        { type: "application/ld+json", children: JSON.stringify(videoLd) },
      ],
    } as typeof meta;
  },
  component: IndexPage,
});

const float = (delay = 0) => ({
  animate: { y: [0, -14, 0] },
  transition: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut" as const, delay },
});

type Channel = { name: string; hex: string; path?: string; img?: string; viewBox?: string; ltr?: boolean };
const trustLogos: Channel[] = [
  { name: "تلگرام", hex: "26A5E4", path: siTelegram.path },
  { name: "واتس‌اپ", hex: "25D366", path: siWhatsapp.path },
  { name: "اینستاگرام", hex: "FF0069", path: siInstagram.path },
  { name: "بله", hex: "4CEBB4", img: "/brands/bale.svg" },
  { name: "جیمیل", hex: "EA4335", path: siGmail.path },
  { name: "یاهو", hex: "6001D2", path: "M18.86 1.56L14.27 11.87H19.4L24 1.56H18.86M0 6.71L5.15 18.27L3.3 22.44H7.83L14.69 6.71H10.19L7.39 13.44L4.62 6.71H0M15.62 12.87C13.95 12.87 12.71 14.12 12.71 15.58C12.71 17 13.91 18.19 15.5 18.19C17.18 18.19 18.43 16.96 18.43 15.5C18.43 14.03 17.23 12.87 15.62 12.87Z" },
  { name: "WHMCS", hex: "840FFF", path: "M1.93206 17.9126C-0.935444 14.0008 -0.616832 8.46645 2.92652 4.92173C6.83675 1.02931 13.1607 1.01965 17.0709 4.93139C20.9812 8.84313 20.9715 15.1695 17.0709 19.0716C13.5373 22.6067 8.00499 22.9447 4.0851 20.0665C4.22993 18.7625 4.79957 17.5166 5.79402 16.5217C8.1112 14.2037 11.8476 14.1554 14.1455 16.4541C14.1841 16.4928 14.3676 16.6763 14.522 16.5217C14.6765 16.3672 14.4834 16.174 14.4545 16.1451C12.2338 13.9236 12.1373 10.176 14.4545 7.85796C14.4834 7.82898 14.6765 7.65512 14.5124 7.49093C14.3483 7.32673 14.1648 7.52956 14.1455 7.54888C11.9152 9.78002 8.15947 9.84763 5.86161 7.54888C5.82299 7.51024 5.62023 7.34605 5.48506 7.48127C5.3499 7.61649 5.49472 7.8 5.55265 7.85796C7.82155 10.1277 7.82155 13.8753 5.48506 16.2127C4.50992 17.1882 3.23547 17.7677 1.93206 17.9126Z", viewBox: "-1 0 22 24", ltr: true },
  { name: "وردپرس", hex: "21759B", path: siWordpress.path },
  { name: "ووکامرس", hex: "96588A", path: siWoocommerce.path },
  { name: "شاپیفای", hex: "7AB55C", path: siShopify.path },
  { name: "پرستاشاپ", hex: "DF0067", path: siPrestashop.path },
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
    desc: "تماس صوتی و تصویری، صف زنده تماس، درخواست تماس مجدد، ضبط مکالمه و تنظیمات ساعت پاسخ‌گویی؛ همه در پنل مرکز تماس.",
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

function getFaqs(callEnabled: boolean, aiEnabled: boolean) {
  return [
    {
      q: "وب‌یار دقیقاً چه چیزی به سایت من اضافه می‌کند؟",
      a: `یک ابزارک گفتگو روی سایت شما می‌نشیند و پشت آن یک پنل کامل قرار دارد: ${joinFa(
        "صندوق گفتگوی یکپارچه",
        callEnabled && "مرکز تماس صوتی و تصویری",
        aiEnabled && "ایجنت هوش مصنوعی",
        "مخاطبین",
        "بازدیدکنندگان زنده",
        "پایگاه دانش",
        "ابزارهای سئو و آنالیز",
        "گزارش‌ها",
      )}.`,
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
    ...(aiEnabled
      ? [
          {
            q: "ایجنت هوش مصنوعی چگونه آموزش می‌بیند؟",
            a: "ایجنت را با محتوای صفحات سایت و مقاله‌های پایگاه دانش آموزش می‌دهید، در محیط آزمایش پاسخ‌هایش را می‌سنجید، برایش قانون رفتاری و مسیریابی تعریف می‌کنید و کیفیت پاسخ‌ها را در گزارش‌ها دنبال می‌کنید.",
          },
        ]
      : []),
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
    <LoopVideo
      className={`h-full w-full object-cover ${className ?? ""}`}
      src="/videos/video-call.mp4"
      poster="/videos/video-call-poster.jpg"
      title="تماس تصویری زنده با بازدیدکننده سایت در وب‌یار"
      width={960}
      height={540}
    />
  );
}

function OperatorAvatar({ className }: { className?: string }) {
  return (
    <div className={`overflow-hidden bg-foreground ${className ?? ""}`}>
      <LoopVideo
        src="/videos/operator.mp4"
        poster={operatorAvatar}
        title="اپراتور وب‌یار در حال گوش دادن به مشتری"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function IndexPage() {
  const { settings, seoOverride, apps } = Route.useLoaderData();
  const callEnabled = settings.videoCall.enabled;
  const aiEnabled = settings.aiMarketing.enabled;
  const faqs = getFaqs(callEnabled, aiEnabled);
  const AI_FEATURE_TITLES = ["ایجنت هوش مصنوعی پیشرفته", "کمک هوش مصنوعی به اپراتور"];
  const visiblePlatformFeatures = platformFeatures.filter(
    (f) =>
      (callEnabled || f.title !== "مرکز تماس") &&
      (aiEnabled || !AI_FEATURE_TITLES.includes(f.title)),
  );
  const visibleModuleGroups = moduleGroups.filter(
    (g) => (callEnabled || g.title !== "مرکز تماس") && (aiEnabled || g.title !== "هوش مصنوعی"),
  );
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
      description: `${joinFa(
        "چت زنده",
        "CRM",
        aiEnabled && "هوش مصنوعی",
        "اتوماسیون",
        callEnabled && "چت تصویری",
        "سئو",
        "کمپین",
      )}، همه در وب‌یار`,
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
        <AuroraBackdrop />

        <div className="container-page relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground"
            >
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-[7px] w-[7px] rounded-full bg-success"
              />
              {joinFa(
                "چت زنده",
                callEnabled && "تماس تصویری",
                callEnabled && "مرکز تماس",
                aiEnabled && "ایجنت هوش مصنوعی",
              )}{" "}
              ، در یک پنل
            </motion.div>

            <h1 className="mb-6 text-[34px] font-extrabold leading-[1.3] text-foreground sm:text-5xl lg:text-[64px] lg:leading-[1.2]">
              {callEnabled ? "چت زنده و تماس ویدیویی،" : "چت زنده هوشمند،"}
              <br />
              <span className="text-brand">فقط با یک خط کد</span>
            </h1>

            <p className="mx-auto mb-9 max-w-xl text-base lg:mx-0 leading-[1.9] text-muted-foreground sm:text-lg">
              {callEnabled
                ? "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم می‌کند."
                : "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده مستقیم با بازدیدکننده‌ها را فراهم می‌کند."}{" "}
              نصب در کمتر از ۵ دقیقه، بدون نیاز به برنامه‌نویس.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <a
                href={settings.auth.signupUrl || "/contact"}
                className="btn-shimmer inline-flex min-h-[52px] items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold"
              >
                ۷ روز رایگان از تمام امکانات استفاده کنید <ChevronLeft className="h-4 w-4" />
              </a>
              <Link
                to="/pricing"
                className="glass inline-flex min-h-[52px] items-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                مشاهده امکانات
              </Link>
              <Link
                to="/download"
                className="inline-flex min-h-[52px] items-center gap-2 px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <AppleIcon className="h-4 w-4" />
                <AndroidIcon className="h-4 w-4" />
                <WindowsIcon className="h-3.5 w-3.5" />
                دانلود اپ
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              نصب با یک قطعه کد · افزونه آماده برای وردپرس، ووکامرس، شاپیفای و پرستاشاپ
            </p>
          </div>

          <div className="relative mx-auto hidden h-[500px] w-full max-w-[420px] sm:block">
            <motion.div
              {...float(0)}
              className="beam-border absolute start-0 top-0 w-[300px] overflow-hidden rounded-[20px] bg-card shadow-card"
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
                className="absolute end-0 bottom-0 w-[260px] rounded-[18px] bg-card p-3.5 shadow-2xl"
              >
                <div className="relative h-[150px] overflow-hidden rounded-xl">
                  <VideoCallMock />
                  <OperatorAvatar className="absolute start-2.5 bottom-2.5 h-12 w-16 rounded-lg border-2 border-background/40" />
                </div>
                <div className="mt-3.5 flex items-center justify-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10">
                    <Mic className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10">
                    <Video className="h-4 w-4 text-foreground" />
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

      {/* TRUST LOGOS — صندوق یکپارچه */}
      <section className="relative overflow-hidden border-y border-border py-14 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-3xl rounded-full bg-primary/15 blur-3xl" />
        <div className="container-page relative mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            صندوق گفتگوی یکپارچه
          </span>
          <h2 className="mx-auto max-w-3xl text-2xl font-extrabold leading-[1.4] text-foreground sm:text-4xl">
            همه‌ی پیام‌هایتان را{" "}
            <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">در یک صندوق</span>{" "}
            جواب بدهید
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-[1.9] text-muted-foreground sm:text-base">
            پیام‌های تلگرام، واتس‌اپ، اینستاگرام، بله، ایمیل‌های جیمیل و یاهو، تیکت‌های WHMCS و سفارش‌های
            فروشگاه ووکامرس و شاپیفای، همه یک‌جا کنار چت زنده‌ی سایت؛ بدون جابه‌جایی بین ده‌ها برنامه.
          </p>
        </div>
        <div className="container-page relative flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {trustLogos.map((logo) => (
            <span
              key={logo.name}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-3 py-2 sm:px-3.5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `#${logo.hex}22`, color: `#${logo.hex}` }}
              >
                {logo.img ? (
                  <img src={logo.img} alt="" className="h-6 w-6" loading="lazy" />
                ) : (
                  <svg viewBox={logo.viewBox ?? "0 0 24 24"} className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d={logo.path} />
                  </svg>
                )}
              </span>
              <span dir={logo.ltr ? "ltr" : undefined} className="whitespace-nowrap text-sm font-bold text-foreground sm:text-base">
                {logo.name}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* APPS */}
      <AppsShowcase apps={apps} />

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
        <section className="relative overflow-hidden bg-card px-4 py-20 sm:px-8 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -end-24 h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-[70px]">
            <ScrollReveal>
              {eyebrow("تماس ویدیویی")}
              <h2 className="mb-5 text-2xl font-extrabold leading-[1.35] text-foreground sm:text-4xl">
                وقتی متن کافی نیست، تصویر را روشن کنید
              </h2>
              <p className="mb-7 text-base leading-[1.9] text-foreground/70">
                با یک کلیک از داخل همان چت، تماس تصویری HD با مشتری برقرار کنید؛ بدون نصب اپلیکیشن
                یا افزونه از طرف او.
              </p>
              <div className="space-y-4">
                {videoFeatures.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-accent/25">
                      <Check className="h-3.5 w-3.5 text-foreground" />
                    </span>
                    <div>
                      <div className="mb-0.5 text-sm font-bold text-foreground">{f.title}</div>
                      <div className="text-sm leading-[1.7] text-foreground/65">{f.desc}</div>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10">
                  <MicOff className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10">
                  <Video className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
                  <PhoneOff className="h-5 w-5 text-destructive-foreground" />
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10">
                  <MonitorUp className="h-5 w-5 text-foreground" />
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
            فراتر از چت: یک CRM کامل برای ارتباط با مشتری
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground">
            {callEnabled
              ? "چت زنده و تماس تصویری فقط شروع کار وب‌یار است؛"
              : "چت زنده فقط شروع کار وب‌یار است؛"}{" "}
            {joinFa(aiEnabled && "هوش مصنوعی", "CRM", "اتوماسیون", "کمپین", "گزارش‌گیری")} هم در
            همان پنل، بدون نیاز به هیچ ابزار جداگانه‌ای در اختیار شماست.
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
              فهرست بخش‌های واقعی پنل وب‌یار؛ از گفتگو و تماس تا{" "}
              {joinFa(aiEnabled && "هوش مصنوعی", "سئو", "مخاطبین", "تنظیمات حساب")}.
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
            {joinFa(
              "گفتگو",
              callEnabled && "تماس",
              aiEnabled && "هوش مصنوعی",
              "مخاطبین",
              "سئو",
              "گزارش‌ها",
            )}{" "}
            ، همه از یک پنل
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

function AppsShowcase({ apps }: { apps: import("@/lib/apps.functions").AppDto[] }) {
  if (apps.length === 0) return null;
  const find = (p: string) => apps.find((a) => a.platform === p);
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="اپلیکیشن‌های نیتیو"
          title={
            <>
              وب‌یار <span className="text-brand">همیشه همراه شماست</span>
            </>
          }
          desc="روی آیفون، اندروید و ویندوز به چت‌ها پاسخ دهید، تماس تصویری بگیرید و هیچ مشتری‌ای را از دست ندهید؛ با اعلان لحظه‌ای."
        />
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal className="mx-auto w-full sm:w-[82%]">
            <DesktopFrame>
              <WindowsScreen />
            </DesktopFrame>
          </ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 80, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: -4 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -bottom-16 -start-2 hidden scale-[0.78] md:block lg:start-0 lg:scale-90"
          >
            <PhoneFrame variant="ios">
              <InboxScreen />
            </PhoneFrame>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 80, rotate: 6 }}
            whileInView={{ opacity: 1, y: 0, rotate: 4 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -bottom-20 -end-2 hidden scale-[0.78] md:block lg:end-0 lg:scale-90"
          >
            <PhoneFrame variant="android">
              <CallScreen />
            </PhoneFrame>
          </motion.div>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3 md:mt-28">
          {(["ios", "android", "windows"] as const).map((p) => {
            const a = find(p);
            return a ? <StoreBadge key={p} platform={p} slug={a.slug} available={!!a.downloadUrl} /> : null;
          })}
        </div>
        <div className="mt-5 text-center">
          <Link to="/download" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
            همه برنامه‌ها و تصاویر <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
