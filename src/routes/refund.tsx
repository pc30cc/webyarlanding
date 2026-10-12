import { REFUND_WINDOW_DAYS } from "@/lib/legal-en";
import { RespokPage } from "@/components/respok/RespokPage";
import { getSiteLanguage } from "@/lib/site-i18n";
import { localizeStructuredData } from "@/lib/site-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getBrandNameEn, getRespokBrandName } from "@/lib/settings";

export const Route = createFileRoute("/refund")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/refund" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const english = getSiteLanguage(loaderData.settings) === "en";
    const brand = english
      ? getRespokBrandName(loaderData.settings)
      : loaderData.settings.brand.name || "وب‌یار";
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/refund",
      override: loaderData.seoOverride,
      fallbackTitle: english ? `Refund Policy | ${brand}` : `سیاست بازپرداخت | ${brand}`,
      fallbackDescription: english
        ? `${brand} offers a 14-day money-back guarantee on payments made on our website. How to request a refund, how long it takes and what is covered.`
        : `ضمانت بازگشت وجه ۱۴ روزه ${brand} برای پرداخت‌های انجام‌شده در سایت: نحوه درخواست، زمان واریز و موارد شامل.`,
    });
  },
  component: RefundPage,
});

const EFFECTIVE_DATE_FA = "۲۰ مهر ۱۴۰۵";
const DAYS_FA = REFUND_WINDOW_DAYS.toLocaleString("fa-IR");

function sectionsFa(brand: string, email: string) {
  return [
    {
      title: `۱. ضمانت بازگشت وجه ${DAYS_FA} روزه`,
      body: [
        `می‌خواهیم از ${brand} راضی باشید. اگر پلن پولی مناسب شما نبود، می‌توانید تا ${DAYS_FA} روز پس از تاریخ پرداخت، درخواست بازگشت کامل وجه بدهید؛ بدون پرسش اضافه و بدون کسر هیچ مبلغی.`,
        `این سیاست شامل اشتراک‌ها و ارتقای پلن‌هایی است که مستقیماً از سایت خریداری شده‌اند و برای اولین پرداخت و هر تمدید اعمال می‌شود، به شرط آنکه درخواست ظرف ${DAYS_FA} روز از همان پرداخت به دست ما برسد.`,
      ],
    },
    {
      title: "۲. نحوه درخواست",
      body: [
        `از ایمیل ثبت‌شده در حساب خود به ${email} با موضوع «درخواست بازگشت وجه» پیام دهید. در صورت امکان شماره فاکتور یا تراکنش را بنویسید؛ ذکر دلیل اختیاری است.`,
        "دریافت هر درخواست را معمولاً ظرف یک روز کاری با ایمیل تأیید می‌کنیم.",
      ],
    },
    {
      title: "۳. زمان واریز",
      body: [
        "مبلغ درخواست‌های تأییدشده به همان روش پرداخت اولیه بازگردانده می‌شود و بسته به بانک و روش پرداخت، معمولاً ظرف ۵ تا ۱۰ روز کاری در حساب شما دیده می‌شود.",
        "پس از بازگشت وجه، پلن مربوط به پایان می‌رسد و حساب شما به پلن رایگان منتقل می‌شود. گفتگوها، مخاطبان و تنظیمات شما در حساب باقی می‌مانند.",
      ],
    },
    {
      title: `۴. پس از ${DAYS_FA} روز`,
      body: [
        `پس از گذشت ${DAYS_FA} روز، پرداخت‌ها قابل بازگشت نیستند و بازپرداخت جزئی یا به نسبت زمان استفاده‌نشده انجام نمی‌شود، مگر آنکه قانون چیز دیگری مقرر کند.`,
        "هر زمان می‌توانید اشتراک را از تنظیمات حساب یا با تماس با پشتیبانی لغو کنید. با لغو، تمدیدهای بعدی متوقف می‌شود و تا پایان دوره‌ای که پرداخت کرده‌اید به پلن خود دسترسی دارید.",
      ],
    },
    {
      title: "۵. خرید از اپ‌استور و گوگل‌پلی",
      body: [
        "اشتراک‌هایی که داخل اپلیکیشن آیفون یا اندروید خریده می‌شوند توسط اپل یا گوگل صورتحساب می‌شوند و بازپرداخت آن‌ها طبق قوانین همان فروشگاه و از طریق خود فروشگاه درخواست می‌شود.",
      ],
    },
    {
      title: "۶. استثناها",
      body: [
        "در صورتی که حساب به دلیل نقض قوانین استفاده تعلیق یا بسته شده باشد، یا درخواست‌های مکرر برای یک حساب نشان‌دهنده سوءاستفاده از این سیاست باشد، ممکن است درخواست پذیرفته نشود.",
        `اعتبارهای جبرانی توافقنامه سطح خدمات (SLA) جدا از این سیاست هستند و حق بازگشت وجه در مهلت ${DAYS_FA} روزه را کاهش نمی‌دهند.`,
      ],
    },
    {
      title: "۷. حقوق قانونی شما",
      body: [
        "این سیاست هیچ‌یک از حقوقی را که طبق قوانین حمایت از مصرف‌کننده دارید محدود نمی‌کند. هر جا قانون حق بیشتری به شما بدهد، همان اعمال می‌شود.",
      ],
    },
    {
      title: "۸. تغییرات این سیاست",
      body: [
        "ممکن است این سیاست را به‌روزرسانی کنیم. تغییرات با تاریخ اجرای جدید در همین صفحه منتشر می‌شود و هرگز شامل پرداخت‌های پیش از تغییر نمی‌شود.",
      ],
    },
    {
      title: "۹. تماس",
      body: [`برای پرسش درباره بازگشت وجه یا صورتحساب با ${email} تماس بگیرید.`],
    },
  ];
}

function PersianRefundPage() {
  const { settings } = Route.useLoaderData();
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const brand = settings.brand.name || getBrandNameEn(settings);
  const email = settings.brand.email || "support@webyar.ai";
  const title = "سیاست بازپرداخت";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: base ? `${base}/refund` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: title, path: "/refund" },
    ]),
  ];
  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLdHtml(localizeStructuredData(settings, jsonLd))}
      />
      <div dir="rtl" className="container-page max-w-3xl py-16 text-right sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">{title}</h1>
          <p className="mb-10 text-sm text-muted-foreground">
            {`تاریخ اجرا: ${EFFECTIVE_DATE_FA} · ضمانت بازگشت وجه ${DAYS_FA} روزه`}
          </p>
        </motion.div>
        <div className="space-y-8">
          {sectionsFa(brand, email).map((s, i) => (
            <motion.section
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">{s.title}</h2>
              <div className="space-y-2">
                {s.body.map((p) => (
                  <p key={p} className="text-sm leading-7 text-muted-foreground">
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
function RefundPage() {
  const data = Route.useLoaderData();
  if (getSiteLanguage(data.settings) === "en") return <RespokPage page="refund" data={data} />;
  return <PersianRefundPage />;
}
