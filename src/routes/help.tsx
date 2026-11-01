import { HELP_FAQS_EN } from "@/lib/legal-en";
import { i18nFromMatches, localizeStructuredData } from "@/lib/site-i18n";
import { useSiteI18n } from "@/components/site/SiteLanguage";
import { LOCALE_INFO } from "@/lib/locales";
import { createFileRoute, Link } from "@tanstack/react-router";
import { legalPack } from "@/lib/legal-packs";
import { motion } from "framer-motion";
import { Mail, LifeBuoy, Clock, Trash2 } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  localizedUrl,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  getBrandNameEn,
  getDefaultLocale,
  isEnglishChrome,
  pageContentLocale,
} from "@/lib/settings";

export const Route = createFileRoute("/help")({
  loader: async ({ context }) => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/help", locale: context.urlLocale } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData, matches, match }) => {
    if (!loaderData) return {};
    const i18n = i18nFromMatches(matches, match, loaderData);
    const english = isEnglishChrome(
      loaderData.settings,
      i18n?.locale ?? getDefaultLocale(loaderData.settings),
      "/help",
    );
    const pack = legalPack(
      pageContentLocale(
        loaderData.settings,
        i18n?.locale ?? getDefaultLocale(loaderData.settings),
        "/help",
      ),
    );
    return buildPageMeta({
      i18n,
      settings: loaderData.settings,
      path: "/help",
      override: loaderData.seoOverride,
      fallbackTitle: pack
        ? pack.helpMetaTitle
        : english
        ? "Support & Help Center | Webyar"
        : "پشتیبانی و راهنما | وب‌یار",
      fallbackDescription: pack
        ? pack.helpMetaDescription
        : english
        ? "Get help with Webyar: contact support by email, report a problem, request account deletion and read answers to common questions."
        : "راهنمای وب‌یار: تماس با پشتیبانی از طریق ایمیل، گزارش مشکل، درخواست حذف حساب و پاسخ پرسش‌های پرتکرار.",
    });
  },
  component: HelpPage,
});

const FAQS_FA = [
  {
    q: "چطور حساب کاربری بسازم؟",
    a: "وب‌سایت را باز کنید، گزینه ثبت‌نام را بزنید، ایمیل و رمز عبور وارد کنید و ایمیل خود را تأیید نمایید؛ سپس با همان حساب وارد اپلیکیشن‌ها شوید. می‌توانید با طرح رایگان شروع کنید و بعداً ارتقا دهید.",
  },
  {
    q: "رمز عبورم را فراموش کرده‌ام، چه کنم؟",
    a: "در صفحه ورود روی «فراموشی رمز عبور» بزنید. لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود و تا ۲۴ ساعت معتبر است.",
  },
  {
    q: "چطور اشتراکم را مدیریت یا لغو کنم؟",
    a: "پلن و صورتحساب‌ها را از بخش صورتحساب پنل مدیریت کنید. هر دوره با پرداخت صورتحساب همان دوره تمدید می‌شود؛ اگر صورتحساب دوره بعد پرداخت نشود، پس از مهلت پرداخت، حساب به پلن رایگان برمی‌گردد. انتخاب پلن پایین‌تر در پایان دوره جاری اعمال می‌شود.",
  },
  {
    q: "چطور حساب و اطلاعاتم را حذف کنم؟",
    a: "از همان ایمیلی که با آن ثبت‌نام کرده‌اید، پیامی با موضوع «درخواست حذف حساب» به پشتیبانی بفرستید. پس از تأیید، حساب و اطلاعات شخصی شما حداکثر ظرف ۳۰ روز برای همیشه حذف می‌شود.",
  },
  {
    q: "آیا اطلاعات من امن است؟",
    a: "انتقال داده‌ها با TLS رمزنگاری می‌شود، رمزهای عبور فقط به‌صورت هش ذخیره می‌شوند، دسترسی‌ها بر اساس نقش محدود است و پشتیبان‌گیری منظم انجام می‌شود. جزئیات کامل در سیاست حریم خصوصی آمده است.",
  },
  {
    q: "چطور یک اشکال یا سوءاستفاده را گزارش کنم؟",
    a: "ایمیلی با موضوع «گزارش اشکال» یا «گزارش سوءاستفاده» به پشتیبانی بفرستید و ایمیل حساب، نوع دستگاه، نسخه برنامه، مراحل بازتولید مشکل و در صورت امکان تصویر صفحه را ضمیمه کنید.",
  },
];

function HelpPage() {
  const { settings } = Route.useLoaderData();
  const i18n = useSiteI18n();
  // زبان محتوای صفحه (در سایت فارسی این صفحه ممکن است انگلیسی نمایش داده شود)
  const contentLocale = pageContentLocale(settings, i18n.locale, "/help");
  const english = contentLocale === "en";
  const pack = legalPack(contentLocale);
  const dir = LOCALE_INFO[contentLocale].dir;
  const brandEn = getBrandNameEn(settings);
  const brand = english || pack ? brandEn : settings.brand.name || brandEn;
  const email = settings.brand.email || "support@webyar.ai";
  const phone = settings.brand.phone;
  const faqs = pack ? pack.faqs : english ? HELP_FAQS_EN : FAQS_FA;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: pack
        ? pack.supportName(brand)
        : english
          ? `${brand} Support` : `پشتیبانی ${brand}`,
      url: localizedUrl(settings, i18n.locale, "/help"),
      mainEntity: {
        "@type": "Organization",
        name: brand,
        email,
        ...(phone ? { telephone: phone } : {}),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email,
            availableLanguage: ["en", "fa"],
          },
        ],
      },
    },
    buildBreadcrumbJsonLd(i18n, settings, [
      { name: pack ? pack.home : english ? "Home" : "خانه", path: "/" },
      { name: pack ? pack.supportCrumb : english ? "Support" : "پشتیبانی", path: "/help" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLdHtml(
          localizeStructuredData(i18n, jsonLd),
        )}
      />
      <div
        dir={dir}
        className={`container-page max-w-3xl py-16 sm:py-24 ${dir === "ltr" ? "text-left" : "text-right"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            {pack ? pack.helpTitle : english ? "Support & Help Center" : "پشتیبانی و مرکز راهنما"}
          </h1>
          <p className="mb-10 text-sm leading-7 text-muted-foreground">
            {pack
              ? pack.helpIntro(brand)
              : english
              ? `Need help with ${brand}? Our support team answers every message. Use the contact details below for technical issues, billing questions, privacy requests or account deletion.`
              : `برای استفاده از ${brand} کمک لازم دارید؟ تیم پشتیبانی به همه پیام‌ها پاسخ می‌دهد. برای مشکلات فنی، پرسش‌های مالی، درخواست‌های حریم خصوصی یا حذف حساب از راه‌های تماس زیر استفاده کنید.`}
          </p>
        </motion.div>

        <section className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Mail className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {pack ? pack.supportEmail : english ? "Support email" : "ایمیل پشتیبانی"}
            </div>
            <a
              href={`mailto:${email}`}
              dir="ltr"
              className="mt-1 block text-sm text-primary underline underline-offset-4"
            >
              {email}
            </a>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {pack
                ? pack.supportEmailNote
                : english
                ? "Primary support channel for all users, including App Store reviewers."
                : "کانال اصلی پشتیبانی برای همه کاربران."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Clock className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {pack ? pack.responseTime : english ? "Response time" : "زمان پاسخ‌گویی"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {pack
                ? pack.responseTimeValue
                : english
                ? "Within 1 business day (Saturday to Thursday)."
                : "حداکثر یک روز کاری (شنبه تا پنجشنبه)."}
            </p>
            {phone ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {pack ? pack.phoneLabel : english ? "Phone: " : "تلفن: "}
                {phone}
              </p>
            ) : null}
            {settings.brand.address ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {pack ? pack.addressLabel : english ? "Address: " : "نشانی: "}
                {settings.brand.address}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Trash2 className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {pack ? pack.accountDeletion : english ? "Account deletion" : "حذف حساب کاربری"}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {pack ? (
                <>
                  {pack.deletionBefore}
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(pack.deletionSubject)}`}
                    dir="ltr"
                    className="text-primary underline underline-offset-4"
                  >
                    {email}
                  </a>
                  {pack.deletionAfter}
                </>

              ) : english ? (
                <>
                  Email{" "}
                  <a
                    href={`mailto:${email}?subject=Account%20Deletion%20Request`}
                    className="text-primary underline underline-offset-4"
                  >
                    {email}
                  </a>{" "}
                  with the subject “Account Deletion Request”. Data is erased
                  within 30 days.
                </>
              ) : (
                <>
                  پیامی با موضوع «درخواست حذف حساب» به{" "}
                  <a
                    href={`mailto:${email}?subject=%D8%AF%D8%B1%D8%AE%D9%88%D8%A7%D8%B3%D8%AA%20%D8%AD%D8%B0%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8`}
                    dir="ltr"
                    className="text-primary underline underline-offset-4"
                  >
                    {email}
                  </a>{" "}
                  بفرستید. اطلاعات ظرف ۳۰ روز حذف می‌شود.
                </>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <LifeBuoy className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {pack ? pack.policies : english ? "Policies" : "قوانین و سیاست‌ها"}
            </div>
            <p className="mt-1 space-x-3 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="text-primary underline underline-offset-4"
              >
                {pack ? pack.privacyLink : english ? "Privacy Policy" : "سیاست حریم خصوصی"}
              </Link>
              <Link
                to="/terms"
                className="text-primary underline underline-offset-4"
              >
                {pack ? pack.termsLink : english ? "Terms of Use" : "قوانین استفاده"}
              </Link>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-bold text-foreground">
            {pack ? pack.faqTitle : english ? "Frequently asked questions" : "پرسش‌های پرتکرار"}
          </h2>
          <div className="space-y-6">
            {faqs.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.04 }}
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {f.q}
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-sm leading-7 text-muted-foreground">
          {pack ? (
            <>
              {pack.stuckBefore}
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="text-primary underline underline-offset-4"
              >
                {email}
              </a>
              {pack.stuckAfter}
            </>

          ) : english ? (
            <>
              Still stuck? Write to{" "}
              <a
                href={`mailto:${email}`}
                className="text-primary underline underline-offset-4"
              >
                {email}
              </a>{" "}
              and include your account email, device model, operating system
              version and app version so we can help faster.
            </>
          ) : (
            <>
              هنوز مشکل دارید؟ به{" "}
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="text-primary underline underline-offset-4"
              >
                {email}
              </a>{" "}
              بنویسید و ایمیل حساب، مدل دستگاه، نسخه سیستم‌عامل و نسخه برنامه را
              ذکر کنید تا سریع‌تر کمک کنیم.
            </>
          )}
        </p>
      </div>
    </SiteLayout>
  );
}
