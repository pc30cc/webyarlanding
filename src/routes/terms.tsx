import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getBrandNameEn } from "@/lib/settings";

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
    const english = loaderData.settings.brand.legalEnglishChrome !== false;
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/terms",
      override: loaderData.seoOverride,
      fallbackTitle: english ? "Terms of Use | Webyar" : "قوانین و شرایط استفاده | وب‌یار",
      fallbackDescription: english
        ? "The terms and conditions that govern your use of the Webyar website, mobile apps and services, including subscriptions, acceptable use and liability."
        : "شرایط و قوانین استفاده از وب‌سایت، اپلیکیشن‌ها و سرویس‌های وب‌یار، شامل اشتراک‌ها، استفاده مجاز و مسئولیت‌ها.",
    });
  },
  component: TermsPage,
});

const EFFECTIVE_DATE_EN = "September 1, 2026";
const EFFECTIVE_DATE_FA = "۱۰ شهریور ۱۴۰۵";

function sectionsEn(brand: string, email: string) {
  return [
    {
      title: "1. Acceptance of Terms",
      body: [
        `These Terms of Use ("Terms") form a binding agreement between you and ${brand} regarding your use of our website, mobile applications and related services (the "Services"). By creating an account or using the Services you accept these Terms.`,
      ],
    },
    {
      title: "2. Eligibility",
      body: [
        "You must be at least 13 years old, and old enough to form a binding contract in your jurisdiction, to use the Services. If you use the Services on behalf of an organization, you confirm that you are authorized to bind that organization.",
      ],
    },
    {
      title: "3. Accounts and Security",
      body: [
        "You are responsible for the accuracy of your registration details, for keeping your credentials confidential and for all activity under your account. Notify us immediately at the contact address below if you suspect unauthorized access.",
      ],
    },
    {
      title: "4. Acceptable Use",
      body: [
        "You agree not to: break applicable laws; send spam, malware or unsolicited bulk messages; harass, threaten or abuse others; upload unlawful, infringing, hateful or sexually explicit content; attempt to access other users' data; reverse engineer, scrape or overload the Services; or resell the Services without written permission.",
        "We may suspend or terminate accounts that violate this section.",
      ],
    },
    {
      title: "5. User Content",
      body: [
        "You retain ownership of the content you submit. You grant us a limited, worldwide, non-exclusive license to host, process, transmit and display that content solely to operate and support the Services.",
        "You are responsible for your content and for having the rights required to submit it.",
      ],
    },
    {
      title: "6. Subscriptions, Billing and Cancellation",
      body: [
        "Paid plans are billed in advance on a recurring basis and renew automatically until cancelled. You can cancel at any time from your account settings or by contacting support; cancellation takes effect at the end of the current billing period.",
        "Purchases made through the Apple App Store or Google Play are billed by that store and are governed by the store's own billing, renewal and refund rules; manage or cancel those subscriptions in your store account settings.",
      ],
    },
    {
      title: "7. Third-Party Services",
      body: [
        "The Services may integrate with third-party platforms and plugins. Those services are governed by their own terms and privacy policies, and we are not responsible for their availability or conduct.",
      ],
    },
    {
      title: "8. Intellectual Property",
      body: [
        `All software, design, trademarks and content provided by ${brand} remain our property or that of our licensors and are protected by intellectual property laws. No rights are granted except those expressly stated in these Terms.`,
      ],
    },
    {
      title: "9. Service Availability",
      body: [
        "We work to keep the Services available and reliable, but they are provided on an \"as is\" and \"as available\" basis, without warranties of any kind to the extent permitted by law. Planned maintenance is announced in advance where practical.",
      ],
    },
    {
      title: "10. Limitation of Liability",
      body: [
        `To the maximum extent permitted by law, ${brand} is not liable for indirect, incidental, special or consequential damages, or for lost profits or data. Our total liability for any claim is limited to the amount you paid for the Services in the twelve months before the claim.`,
      ],
    },
    {
      title: "11. Termination",
      body: [
        "You may stop using the Services and delete your account at any time. We may suspend or terminate access for breach of these Terms, for legal reasons or for prolonged inactivity, with notice where reasonably possible.",
      ],
    },
    {
      title: "12. Changes to These Terms",
      body: [
        "We may update these Terms. Material changes will be posted on this page with a new effective date and, where appropriate, notified by email or in-app. Continued use after the changes take effect means you accept them.",
      ],
    },
    {
      title: "13. Governing Law",
      body: [
        "These Terms are governed by the laws applicable at our principal place of business, without regard to conflict-of-law rules. Mandatory consumer protections in your country of residence still apply.",
      ],
    },
    {
      title: "14. Contact",
      body: [`For questions about these Terms, contact ${email}.`],
    },
  ];
}

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

function TermsPage() {
  const { settings } = Route.useLoaderData();
  const english = settings.brand.legalEnglishChrome !== false;
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
      { name: english ? "Terms of Use" : "قوانین و شرایط استفاده", path: "/terms" },
    ]),
  ];
  const items = english ? sectionsEn(brand, email) : sectionsFa(brand, email);
  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div
        dir={english ? "ltr" : "rtl"}
        className={`container-page max-w-3xl py-16 sm:py-24 ${english ? "text-left" : "text-right"}`}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            {english ? "Terms of Use" : "قوانین و شرایط استفاده"}
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">
            {english
              ? `Effective date: ${EFFECTIVE_DATE_EN} · ${brand}`
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
