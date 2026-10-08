import { LEGAL_EFFECTIVE_DATE_EN, privacySectionsEn } from "@/lib/legal-en";
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

export const Route = createFileRoute("/privacy")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/privacy" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const english = isEnglishChrome(loaderData.settings, "/privacy");
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/privacy",
      override: loaderData.seoOverride,
      fallbackTitle: english
        ? "Privacy Policy | Webyar"
        : "سیاست حریم خصوصی | وب‌یار",
      fallbackDescription: english
        ? "How Webyar collects, uses, stores, protects and deletes personal data, and how you can exercise your privacy rights."
        : "وب‌یار چگونه اطلاعات شخصی را جمع‌آوری، استفاده، ذخیره، محافظت و حذف می‌کند و چطور می‌توانید حقوق حریم خصوصی خود را اعمال کنید.",
    });
  },
  component: PrivacyPage,
});

const EFFECTIVE_DATE_FA = "۱۰ شهریور ۱۴۰۵";

function sectionsFa(brand: string, email: string, address: string) {
  return [
    {
      title: "۱. مقدمه",
      body: [
        `این سیاست حریم خصوصی توضیح می‌دهد که ${brand} چگونه هنگام استفاده شما از وب‌سایت، اپلیکیشن‌ها و سرویس‌های مرتبط («سرویس‌ها») اطلاعات شخصی را جمع‌آوری، استفاده، افشا، ذخیره و محافظت می‌کند.`,
        "با استفاده از سرویس‌ها، این سیاست را می‌پذیرید. اگر با آن موافق نیستید، لطفاً از سرویس‌ها استفاده نکنید.",
      ],
    },
    {
      title: "۲. اطلاعاتی که جمع‌آوری می‌کنیم",
      body: [
        "اطلاعات حساب: نام، نشانی ایمیل، شماره تماس (در صورت ارائه) و مقدار هش‌شده رمز عبور برای ورود.",
        "اطلاعات محتوا: پیام‌ها، تیکت‌ها، فایل‌ها، مخاطبین و سایر محتوایی که شما یا کاربران شما در سرویس‌ها ثبت می‌کنید.",
        "اطلاعات استفاده: صفحات بازدیدشده، امکانات استفاده‌شده، موقعیت تقریبی بر اساس IP، نوع دستگاه، سیستم‌عامل، مرورگر و گزارش خطاها.",
        "اطلاعات تراکنش: طرح اشتراک، وضعیت صورتحساب و سوابق فاکتور. شماره کامل کارت بانکی هرگز نزد ما ذخیره نمی‌شود و توسط درگاه پرداخت مدیریت می‌شود.",
      ],
    },
    {
      title: "۳. نحوه استفاده از اطلاعات",
      body: [
        "ایجاد و نگهداری حساب کاربری و احراز هویت شما.",
        "ارائه، اجرا، پشتیبانی، ایمن‌سازی و بهبود سرویس‌ها.",
        "اطلاع‌رسانی درباره به‌روزرسانی‌ها، هشدارهای امنیتی و درخواست‌های پشتیبانی.",
        "شناسایی، پیشگیری و بررسی تقلب، سوءاستفاده و نقض قوانین استفاده.",
        "رعایت الزامات قانونی.",
      ],
    },
    {
      title: "۴. مبانی قانونی پردازش",
      body: [
        "در مواردی که قانون ایجاب کند، پردازش داده‌ها بر پایه اجرای قرارداد (ارائه سرویس درخواستی شما)، منافع مشروع (امنیت و بهبود محصول)، رضایت شما (ارتباطات اختیاری) و تکالیف قانونی انجام می‌شود.",
      ],
    },
    {
      title: "۵. اشتراک‌گذاری و افشای اطلاعات",
      body: [
        "ما اطلاعات شخصی شما را نمی‌فروشیم و آن را برای تبلیغات شخص ثالث در اختیار دیگران قرار نمی‌دهیم.",
        "داده‌ها فقط با ارائه‌دهندگان خدماتی که از طرف ما کار می‌کنند (میزبانی، ذخیره‌سازی، ارسال ایمیل، آنالیز و پرداخت) و تحت تعهد محرمانگی، یا در صورت الزام قانونی، به اشتراک گذاشته می‌شود.",
      ],
    },
    {
      title: "۶. حریم خصوصی کودکان",
      body: [
        "سرویس‌ها برای کودکان زیر ۱۳ سال طراحی نشده‌اند و ما آگاهانه اطلاعات آن‌ها را جمع‌آوری نمی‌کنیم. اگر فکر می‌کنید کودکی اطلاعاتی ارسال کرده است، با ما تماس بگیرید تا آن را حذف کنیم.",
      ],
    },
    {
      title: "۷. امنیت داده‌ها",
      body: [
        "از رمزنگاری در انتقال (TLS)، هش کردن رمز عبور، کنترل دسترسی، ثبت رویدادها و پشتیبان‌گیری منظم استفاده می‌کنیم. هیچ روش انتقال یا ذخیره‌سازی کاملاً ایمن نیست، اما در صورت بروز رخنه، طبق قانون به شما اطلاع می‌دهیم.",
      ],
    },
    {
      title: "۸. مدت نگهداری داده‌ها",
      body: [
        "اطلاعات شخصی تا زمانی که حساب شما فعال است و برای ارائه سرویس لازم باشد نگهداری می‌شود. پس از حذف حساب، داده‌های شخصی حداکثر ظرف ۳۰ روز حذف یا بی‌نام می‌شوند، مگر آنکه نگهداری طولانی‌تر از نظر قانونی، حسابداری یا امنیتی لازم باشد.",
      ],
    },
    {
      title: "۹. حقوق شما و حذف حساب",
      body: [
        "شما می‌توانید هر زمان درخواست دسترسی، اصلاح، دریافت خروجی یا حذف اطلاعات شخصی خود را ثبت کنید و به پردازش‌های خاص اعتراض کرده یا رضایت خود را پس بگیرید.",
        `برای حذف حساب و تمام اطلاعات شخصی مرتبط، از همان ایمیل ثبت‌شده در حساب، پیامی با موضوع «درخواست حذف حساب» به ${email} ارسال کنید. درخواست‌های تأییدشده ظرف ۳۰ روز انجام می‌شوند.`,
      ],
    },
    {
      title: "۱۰. کوکی‌ها و فناوری‌های مشابه",
      body: [
        "از کوکی‌های ضروری برای حفظ ورود شما و امنیت سرویس و از کوکی‌های اختیاری آنالیز برای درک نحوه استفاده بهره می‌گیریم. مدیریت کوکی‌ها از طریق تنظیمات مرورگر ممکن است؛ غیرفعال کردن کوکی‌های ضروری بخش‌هایی از سرویس را مختل می‌کند.",
      ],
    },
    {
      title: "۱۱. انتقال بین‌المللی داده",
      body: [
        "ممکن است داده‌های شما روی سرورهایی خارج از کشور محل سکونت شما پردازش شود. در این موارد، تدابیر حفاظتی لازم مطابق قوانین حفاظت از داده اعمال می‌شود.",
      ],
    },
    {
      title: "۱۲. تغییرات این سیاست",
      body: [
        "ممکن است این سیاست را به‌روزرسانی کنیم. تغییرات مهم با تاریخ اجرای جدید در همین صفحه و در صورت لزوم از طریق ایمیل یا اعلان درون‌برنامه‌ای اطلاع‌رسانی می‌شود.",
      ],
    },
    {
      title: "۱۳. تماس با ما",
      body: [
        `پرسش‌ها، درخواست‌های حریم خصوصی یا شکایات: ${email}`,
        address ? `نشانی پستی: ${address}` : "",
        "به درخواست‌های حریم خصوصی حداکثر ظرف ۳۰ روز پاسخ می‌دهیم.",
      ].filter(Boolean),
    },
  ];
}

function PersianPrivacyPage() {
  const { settings } = Route.useLoaderData();
  const english = isEnglishChrome(settings, "/privacy");
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const brandEn = getBrandNameEn(settings);
  const brand = english ? brandEn : settings.brand.name || brandEn;
  const email = settings.brand.email || "support@webyar.ai";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: english ? "Privacy Policy" : "سیاست حریم خصوصی",
      url: base ? `${base}/privacy` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: english ? "Home" : "خانه", path: "/" },
      {
        name: english ? "Privacy Policy" : "سیاست حریم خصوصی",
        path: "/privacy",
      },
    ]),
  ];
  const items = english
    ? privacySectionsEn(brand, email, settings.brand.address || "")
    : sectionsFa(brand, email, settings.brand.address || "");
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
            {english ? "Privacy Policy" : "سیاست حریم خصوصی"}
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
function PrivacyPage() {
  const data = Route.useLoaderData();
  if (getSiteLanguage(data.settings) === "en")
    return <RespokPage page="privacy" data={data} />;
  return <PersianPrivacyPage />;
}
