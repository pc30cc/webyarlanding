import { LEGAL_EFFECTIVE_DATE_EN, termsSectionsEn } from "@/lib/legal-en";
import { RespokPage } from "@/components/respok/RespokPage";
import { getSiteLanguage } from "@/lib/site-i18n";
import { localizeStructuredData } from "@/lib/site-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getBrandNameEn, isEnglishChrome } from "@/lib/settings";

export const Route = createFileRoute("/terms")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/terms" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const english = isEnglishChrome(loaderData.settings, "/terms");
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/terms",
      override: loaderData.seoOverride,
      fallbackTitle: english
        ? "Terms of Use | Webyar"
        : "قوانین و شرایط استفاده | وب‌یار",
      fallbackDescription: english
        ? "The terms and conditions that govern your use of the Webyar website, mobile apps and services, including subscriptions, acceptable use and liability."
        : "شرایط و قوانین استفاده از وب‌سایت، اپلیکیشن‌ها و سرویس‌های وب‌یار، شامل اشتراک‌ها، استفاده مجاز و مسئولیت‌ها.",
    });
  },
  component: TermsPage,
});

const EFFECTIVE_DATE_FA = "۱۰ شهریور ۱۴۰۵";

function sectionsFa(brand: string, email: string) {
  return [
    {
      title: "۱. پذیرش قوانین",
      body: [
        `این قوانین استفاده، توافقی الزام‌آور میان شما و ${brand} درباره استفاده از وب‌سایت، اپلیکیشن‌ها و سرویس‌های مرتبط («سرویس‌ها») است. با ساخت حساب یا استفاده از سرویس‌ها، این قوانین را می‌پذیرید.`,
      ],
    },
    {
      title: "۲. شرایط استفاده",
      body: [
        "برای استفاده از سرویس‌ها باید حداقل ۱۳ سال داشته باشید و اهلیت قانونی برای انعقاد قرارداد داشته باشید. اگر از طرف یک سازمان استفاده می‌کنید، تأیید می‌کنید که اختیار لازم را دارید.",
      ],
    },
    {
      title: "۳. حساب کاربری و امنیت",
      body: [
        "مسئولیت صحت اطلاعات ثبت‌نام، حفظ محرمانگی اطلاعات ورود و تمام فعالیت‌های انجام‌شده با حساب شما بر عهده شماست. در صورت مشاهده دسترسی غیرمجاز، فوراً از طریق نشانی تماس زیر به ما اطلاع دهید.",
      ],
    },
    {
      title: "۴. استفاده مجاز",
      body: [
        "شما می‌پذیرید که: قوانین را نقض نکنید؛ هرزنامه، بدافزار یا پیام انبوه ناخواسته ارسال نکنید؛ دیگران را آزار ندهید؛ محتوای غیرقانونی، ناقض حقوق، نفرت‌پراکن یا مستهجن بارگذاری نکنید؛ به داده سایر کاربران دسترسی نگیرید؛ سرویس را مهندسی معکوس، برداشت خودکار یا بیش از حد بارگذاری نکنید و بدون اجازه کتبی آن را بازفروش نکنید.",
        "حساب‌هایی که این بند را نقض کنند ممکن است تعلیق یا حذف شوند.",
      ],
    },
    {
      title: "۵. محتوای کاربر",
      body: [
        "مالکیت محتوایی که ثبت می‌کنید نزد شما باقی می‌ماند. شما مجوزی محدود و غیرانحصاری به ما می‌دهید تا صرفاً برای اجرا و پشتیبانی سرویس‌ها، آن محتوا را میزبانی، پردازش، منتقل و نمایش دهیم.",
        "مسئولیت محتوا و داشتن حقوق لازم برای انتشار آن بر عهده شماست.",
      ],
    },
    {
      title: "۶. اشتراک، صورتحساب و لغو",
      body: [
        "طرح‌های پولی به‌صورت دوره‌ای و پیش‌پرداخت صورتحساب می‌شوند و تا زمان لغو به‌طور خودکار تمدید می‌گردند. می‌توانید هر زمان از تنظیمات حساب یا با تماس با پشتیبانی لغو کنید؛ لغو در پایان دوره جاری اعمال می‌شود.",
        "خریدهای انجام‌شده از طریق اپ‌استور اپل یا گوگل‌پلی توسط همان فروشگاه صورتحساب می‌شوند و تابع قوانین تمدید و بازپرداخت آن فروشگاه هستند.",
      ],
    },
    {
      title: "۷. سرویس‌های شخص ثالث",
      body: [
        "سرویس‌ها ممکن است با پلتفرم‌ها و افزونه‌های شخص ثالث یکپارچه شوند. آن سرویس‌ها تابع قوانین و سیاست حریم خصوصی خودشان هستند و ما مسئول در دسترس بودن یا عملکرد آن‌ها نیستیم.",
      ],
    },
    {
      title: "۸. مالکیت فکری",
      body: [
        `تمام نرم‌افزار، طراحی، علائم تجاری و محتوای ارائه‌شده توسط ${brand} متعلق به ما یا صاحبان مجوز ماست و تحت حمایت قوانین مالکیت فکری قرار دارد. جز آنچه صراحتاً در این قوانین آمده، حقی واگذار نمی‌شود.`,
      ],
    },
    {
      title: "۹. در دسترس بودن سرویس",
      body: [
        "تلاش می‌کنیم سرویس‌ها همواره در دسترس و پایدار باشند، اما آن‌ها «همان‌گونه که هست» ارائه می‌شوند و تا حدی که قانون اجازه می‌دهد، تضمینی همراه ندارند. نگهداری برنامه‌ریزی‌شده در صورت امکان از قبل اعلام می‌شود.",
      ],
    },
    {
      title: "۱۰. محدودیت مسئولیت",
      body: [
        `تا بیشترین حد مجاز قانونی، ${brand} مسئول خسارات غیرمستقیم، تبعی یا از دست رفتن سود و داده نیست. مجموع مسئولیت ما برای هر ادعا، محدود به مبلغی است که در دوازده ماه پیش از آن ادعا بابت سرویس پرداخت کرده‌اید.`,
      ],
    },
    {
      title: "۱۱. خاتمه",
      body: [
        "شما هر زمان می‌توانید استفاده را متوقف و حساب خود را حذف کنید. ما نیز می‌توانیم در صورت نقض این قوانین، الزام قانونی یا عدم فعالیت طولانی، دسترسی را تعلیق یا قطع کنیم و در حد امکان از پیش اطلاع می‌دهیم.",
      ],
    },
    {
      title: "۱۲. تغییرات این قوانین",
      body: [
        "ممکن است این قوانین را به‌روزرسانی کنیم. تغییرات مهم با تاریخ اجرای جدید در همین صفحه و در صورت لزوم از طریق ایمیل یا اعلان درون‌برنامه‌ای اعلام می‌شود. ادامه استفاده به معنای پذیرش تغییرات است.",
      ],
    },
    {
      title: "۱۳. قانون حاکم",
      body: [
        "این قوانین تابع مقررات محل اصلی فعالیت ما است. حمایت‌های الزامی مصرف‌کننده در کشور محل سکونت شما همچنان معتبر باقی می‌ماند.",
      ],
    },
    {
      title: "۱۴. تماس",
      body: [`برای پرسش درباره این قوانین با ${email} تماس بگیرید.`],
    },
  ];
}

function PersianTermsPage() {
  const { settings } = Route.useLoaderData();
  const english = isEnglishChrome(settings, "/terms");
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const brandEn = getBrandNameEn(settings);
  const brand = english ? brandEn : settings.brand.name || brandEn;
  const email = settings.brand.email || "support@webyar.ai";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: english ? "Terms of Use" : "قوانین و شرایط استفاده",
      url: base ? `${base}/terms` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: english ? "Home" : "خانه", path: "/" },
      {
        name: english ? "Terms of Use" : "قوانین و شرایط استفاده",
        path: "/terms",
      },
    ]),
  ];
  const items = english ? termsSectionsEn(brand, email) : sectionsFa(brand, email);
  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLdHtml(
          localizeStructuredData(settings, jsonLd),
        )}
      />
      <div
        dir={english ? "ltr" : "rtl"}
        className={`container-page max-w-3xl py-16 sm:py-24 ${english ? "text-left" : "text-right"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            {english ? "Terms of Use" : "قوانین و شرایط استفاده"}
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">
            {english
              ? `Effective date: ${LEGAL_EFFECTIVE_DATE_EN} · ${brand}`
              : `تاریخ اجرا: ${EFFECTIVE_DATE_FA} · ${brand}`}
          </p>
        </motion.div>
        <div className="space-y-8">
          {items.map((s, i) => (
            <motion.section
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">
                {s.title}
              </h2>
              <div className="space-y-2">
                {s.body.map((p) => (
                  <p
                    key={p}
                    className="text-sm leading-7 text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

/** English site: the active Respok template; Persian site: the page above. */
function TermsPage() {
  const data = Route.useLoaderData();
  if (getSiteLanguage(data.settings) === "en")
    return <RespokPage page="terms" data={data} />;
  return <PersianTermsPage />;
}
