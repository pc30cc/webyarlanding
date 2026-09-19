import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getBrandNameEn } from "@/lib/settings";

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
    const english = loaderData.settings.brand.legalEnglishChrome !== false;
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/privacy",
      override: loaderData.seoOverride,
      fallbackTitle: english ? "Privacy Policy | Webyar" : "سیاست حریم خصوصی | وب‌یار",
      fallbackDescription: english
        ? "How Webyar collects, uses, stores, protects and deletes personal data, and how you can exercise your privacy rights."
        : "وب‌یار چگونه اطلاعات شخصی را جمع‌آوری، استفاده، ذخیره، محافظت و حذف می‌کند و چطور می‌توانید حقوق حریم خصوصی خود را اعمال کنید.",
    });
  },
  component: PrivacyPage,
});

const EFFECTIVE_DATE_EN = "September 1, 2026";
const EFFECTIVE_DATE_FA = "۱۰ شهریور ۱۴۰۵";

function sectionsEn(brand: string, email: string, address: string) {
  return [
    {
      title: "1. Introduction",
      body: [
        `This Privacy Policy explains how ${brand} ("we", "us", "our") collects, uses, discloses, stores and protects personal information when you use our website, mobile applications and related services (together, the "Services").`,
        `By using the Services you agree to this Policy. If you do not agree, please stop using the Services.`,
      ],
    },
    {
      title: "2. Information We Collect",
      body: [
        "Account data: name, email address, phone number (if you provide it) and the password hash used to sign you in.",
        "Content data: messages, tickets, files, contacts and other content you or your end users submit to the Services.",
        "Usage data: pages viewed, features used, approximate location derived from IP address, device type, operating system, browser and crash reports.",
        "Transaction data: subscription plan, billing status and invoice records. Full payment card numbers are never stored by us; they are handled by our payment processors.",
      ],
    },
    {
      title: "3. How We Use Information",
      body: [
        "To create and maintain your account and authenticate you.",
        "To provide, operate, support, secure and improve the Services.",
        "To communicate with you about service updates, security notices and support requests.",
        "To detect, prevent and investigate fraud, abuse and violations of our Terms of Use.",
        "To comply with legal obligations.",
      ],
    },
    {
      title: "4. Legal Bases",
      body: [
        "Where required by law, we process personal data on the basis of contract performance (delivering the Services you requested), legitimate interests (security, product improvement), consent (optional communications) and legal obligations.",
      ],
    },
    {
      title: "5. Sharing and Disclosure",
      body: [
        "We do not sell your personal information and we do not share it with third parties for their own advertising.",
        "We share data only with service providers acting on our behalf (hosting, storage, email delivery, analytics, payment processing) under contractual confidentiality obligations, and when required by applicable law or valid legal process.",
      ],
    },
    {
      title: "6. Children's Privacy",
      body: [
        "The Services are not directed to children under 13 years of age, and we do not knowingly collect personal information from them. If you believe a child has provided us personal data, contact us and we will delete it.",
      ],
    },
    {
      title: "7. Data Security",
      body: [
        "We use encryption in transit (TLS), password hashing, access controls, audit logging and regular backups to protect your data. No method of transmission or storage is completely secure, but we work to protect your information and will notify you of a breach where required by law.",
      ],
    },
    {
      title: "8. Data Retention",
      body: [
        "We keep personal data for as long as your account is active and for as long as needed to provide the Services. After account deletion we remove or anonymize personal data within 30 days, except where longer retention is required for legal, accounting or security reasons.",
      ],
    },
    {
      title: "9. Your Rights and Account Deletion",
      body: [
        "You may request access to, correction of, export of, or deletion of your personal data at any time. You may also object to or restrict certain processing and withdraw consent where processing is based on consent.",
        `To delete your account and all associated personal data, email ${email} from the address linked to your account with the subject "Account Deletion Request". We confirm and complete verified requests within 30 days.`,
      ],
    },
    {
      title: "10. Cookies and Similar Technologies",
      body: [
        "We use strictly necessary cookies to keep you signed in and to secure the Services, and optional analytics cookies to understand usage. You can control cookies through your browser settings; disabling necessary cookies may break parts of the Services.",
      ],
    },
    {
      title: "11. International Transfers",
      body: [
        "Your data may be processed on servers located in countries other than your own. Where such transfers occur, we apply appropriate safeguards required by applicable data protection law.",
      ],
    },
    {
      title: "12. Changes to This Policy",
      body: [
        "We may update this Policy from time to time. Material changes will be announced on this page with a new effective date, and where appropriate by email or in-app notice.",
      ],
    },
    {
      title: "13. Contact Us",
      body: [
        `Questions, privacy requests or complaints: ${email}`,
        address ? `Postal address: ${address}` : "",
        "We respond to privacy requests within 30 days.",
      ].filter(Boolean),
    },
  ];
}

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

function PrivacyPage() {
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
      name: english ? "Privacy Policy" : "سیاست حریم خصوصی",
      url: base ? `${base}/privacy` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: english ? "Home" : "خانه", path: "/" },
      { name: english ? "Privacy Policy" : "سیاست حریم خصوصی", path: "/privacy" },
    ]),
  ];
  const items = english
    ? sectionsEn(brand, email, settings.brand.address || "")
    : sectionsFa(brand, email, settings.brand.address || "");
  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div
        dir={english ? "ltr" : "rtl"}
        className={`container-page max-w-3xl py-16 sm:py-24 ${english ? "text-left" : "text-right"}`}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            {english ? "Privacy Policy" : "سیاست حریم خصوصی"}
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
