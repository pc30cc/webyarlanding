import { HELP_FAQS_EN } from "@/lib/legal-en";
import { RespokPage } from "@/components/respok/RespokPage";
import { getSiteLanguage } from "@/lib/site-i18n";
import { localizeStructuredData } from "@/lib/site-i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, LifeBuoy, Clock, Trash2 } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getBrandNameEn, isEnglishChrome } from "@/lib/settings";

export const Route = createFileRoute("/help")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/help" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const english = isEnglishChrome(loaderData.settings, "/help");
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/help",
      override: loaderData.seoOverride,
      fallbackTitle: english
        ? "Support & Help Center | Webyar"
        : "پشتیبانی و راهنما | وب‌یار",
      fallbackDescription: english
        ? "Get help with Webyar: contact support by email, report a problem, request account deletion and read answers to common questions."
        : "راهنمای وب‌یار: تماس با پشتیبانی از طریق ایمیل، گزارش مشکل، درخواست حذف حساب و پاسخ پرسش‌های پرتکرار.",
    });
  },
  component: HelpPage,
});

const FAQS_FA = [
  {
    q: "چطور حساب کاربری بسازم؟",
    a: "اپلیکیشن یا وب‌سایت را باز کنید، گزینه ثبت‌نام را بزنید، ایمیل و رمز عبور وارد کنید و ایمیل خود را تأیید نمایید. می‌توانید با طرح رایگان شروع کنید و بعداً ارتقا دهید.",
  },
  {
    q: "رمز عبورم را فراموش کرده‌ام، چه کنم؟",
    a: "در صفحه ورود روی «فراموشی رمز عبور» بزنید. لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود و تا ۶۰ دقیقه معتبر است.",
  },
  {
    q: "چطور اشتراکم را مدیریت یا لغو کنم؟",
    a: "اشتراک‌هایی که داخل اپلیکیشن خریداری شده‌اند از تنظیمات حساب اپ‌استور یا گوگل‌پلی مدیریت می‌شوند. اشتراک‌های خریداری‌شده از وب‌سایت را می‌توانید از بخش صورتحساب حساب کاربری لغو کنید؛ لغو در پایان دوره جاری اعمال می‌شود.",
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

function PersianHelpPage() {
  const { settings } = Route.useLoaderData();
  const english = isEnglishChrome(settings, "/help");
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const brandEn = getBrandNameEn(settings);
  const brand = english ? brandEn : settings.brand.name || brandEn;
  const email = settings.brand.email || "support@webyar.ai";
  const phone = settings.brand.phone;
  const faqs = english ? HELP_FAQS_EN : FAQS_FA;

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
      name: english ? `${brand} Support` : `پشتیبانی ${brand}`,
      url: base ? `${base}/help` : undefined,
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
    buildBreadcrumbJsonLd(settings, [
      { name: english ? "Home" : "خانه", path: "/" },
      { name: english ? "Support" : "پشتیبانی", path: "/help" },
    ]),
  ];

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
          <h1 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            {english ? "Support & Help Center" : "پشتیبانی و مرکز راهنما"}
          </h1>
          <p className="mb-10 text-sm leading-7 text-muted-foreground">
            {english
              ? `Need help with ${brand}? Our support team answers every message. Use the contact details below for technical issues, billing questions, privacy requests or account deletion.`
              : `برای استفاده از ${brand} کمک لازم دارید؟ تیم پشتیبانی به همه پیام‌ها پاسخ می‌دهد. برای مشکلات فنی، پرسش‌های مالی، درخواست‌های حریم خصوصی یا حذف حساب از راه‌های تماس زیر استفاده کنید.`}
          </p>
        </motion.div>

        <section className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Mail className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {english ? "Support email" : "ایمیل پشتیبانی"}
            </div>
            <a
              href={`mailto:${email}`}
              dir="ltr"
              className="mt-1 block text-sm text-primary underline underline-offset-4"
            >
              {email}
            </a>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {english
                ? "Primary support channel for all users, including App Store reviewers."
                : "کانال اصلی پشتیبانی برای همه کاربران."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Clock className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {english ? "Response time" : "زمان پاسخ‌گویی"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {english
                ? "Within 1 business day (Saturday to Thursday)."
                : "حداکثر یک روز کاری (شنبه تا پنجشنبه)."}
            </p>
            {phone ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {english ? "Phone: " : "تلفن: "}
                {phone}
              </p>
            ) : null}
            {settings.brand.address ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {english ? "Address: " : "نشانی: "}
                {settings.brand.address}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Trash2 className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {english ? "Account deletion" : "حذف حساب کاربری"}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {english ? (
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
              {english ? "Policies" : "قوانین و سیاست‌ها"}
            </div>
            <p className="mt-1 space-x-3 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="text-primary underline underline-offset-4"
              >
                {english ? "Privacy Policy" : "سیاست حریم خصوصی"}
              </Link>
              <Link
                to="/terms"
                className="text-primary underline underline-offset-4"
              >
                {english ? "Terms of Use" : "قوانین استفاده"}
              </Link>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-bold text-foreground">
            {english ? "Frequently asked questions" : "پرسش‌های پرتکرار"}
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
          {english ? (
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

/** English site: the active Respok template; Persian site: the page above. */
function HelpPage() {
  const data = Route.useLoaderData();
  if (getSiteLanguage(data.settings) === "en")
    return <RespokPage page="help" data={data} />;
  return <PersianHelpPage />;
}
