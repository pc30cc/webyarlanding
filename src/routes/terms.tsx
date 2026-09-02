import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";

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
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/terms",
      override: loaderData.seoOverride,
      fallbackTitle: "شرایط استفاده | وب‌یار",
      fallbackDescription: "شرایط و ضوابط استفاده از خدمات وب‌یار را مطالعه کنید.",
    });
  },
  component: TermsPage,
});

function sections(brand: string) {
  return [
    {
      title: "۱. پذیرش شرایط",
      content: `با استفاده از خدمات ${brand}، شما شرایط و ضوابط زیر را می‌پذیرید.`,
    },
    {
      title: "۲. حساب کاربری",
      content: "شما مسئول حفظ امنیت حساب کاربری و اطلاعات ورود خود هستید.",
    },
    {
      title: "۳. استفاده مجاز",
      content: "استفاده از خدمات باید مطابق با قوانین جاری کشور و بدون سوءاستفاده باشد.",
    },
    {
      title: "۴. مالکیت معنوی",
      content: `تمامی محتوا و کدهای ${brand} تحت حمایت قوانین مالکیت معنوی است.`,
    },
    {
      title: "۵. محدودیت مسئولیت",
      content: `${brand} تلاش می‌کند خدمات را بدون وقفه ارائه دهد اما مسئولیتی در قبال خسارات غیرمستقیم ندارد.`,
    },
    {
      title: "۶. تغییرات در شرایط",
      content: `${brand} حق تغییر این شرایط را دارد. تغییرات از طریق وب‌سایت اطلاع‌رسانی می‌شود.`,
    },
  ];
}

function TermsPage() {
  const { settings } = Route.useLoaderData();
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "شرایط استفاده",
      url: base ? `${base}/terms` : undefined,
      isPartOf: { "@type": "WebSite", name: settings.brand.name, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "شرایط استفاده", path: "/terms" },
    ]),
  ];
  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div className="container-page max-w-3xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            شرایط استفاده
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">آخرین بروزرسانی: مرداد ۱۴۰۵</p>
        </motion.div>
        <div className="space-y-8">
          {sections(settings.brand.name).map((s, i) => (
            <motion.section
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">{s.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{s.content}</p>
            </motion.section>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
