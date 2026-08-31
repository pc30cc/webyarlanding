import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Shield, Zap } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sla")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/sla" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/sla",
      override: loaderData.seoOverride,
      fallbackTitle: "توافقنامه سطح خدمات (SLA) | وب‌یار",
      fallbackDescription:
        "تعهدات وب‌یار برای ارائه خدمات با کیفیت و قابل اتکا، شامل آپ‌تایم و زمان پاسخ‌دهی.",
    });
  },
  component: SLAPage,
});

const slaItems = [
  { icon: Zap, title: "آپ‌تایم تضمینی", value: "۹۹.۹٪", desc: "دسترسی به پلتفرم در ۹۹.۹٪ از زمان" },
  {
    icon: Clock,
    title: "پاسخ‌دهی پشتیبانی",
    value: "<۲ ساعت",
    desc: "حداکثر زمان پاسخ برای پلن حرفه‌ای",
  },
  {
    icon: Shield,
    title: "بازیابی اطلاعات",
    value: "<۴ ساعت",
    desc: "بازیابی از آخرین نسخه پشتیبان",
  },
  {
    icon: CheckCircle2,
    title: "بروزرسانی‌ها",
    value: "بدون وقفه",
    desc: "بدون نیاز به توقف سرویس",
  },
];

const compensationTable = [
  { uptime: "۹۹.۹٪ - ۹۹.۵٪", credit: "۱۰٪ اعتبار ماهانه" },
  { uptime: "۹۹.۵٪ - ۹۹.۰٪", credit: "۲۵٪ اعتبار ماهانه" },
  { uptime: "زیر ۹۹.۰٪", credit: "۵۰٪ اعتبار ماهانه" },
];

function SLAPage() {
  const { settings } = Route.useLoaderData();
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "توافقنامه سطح خدمات (SLA)",
      url: base ? `${base}/sla` : undefined,
      isPartOf: { "@type": "WebSite", name: settings.brand.name, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "SLA", path: "/sla" },
    ]),
  ];
  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-page max-w-4xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            توافقنامه سطح خدمات (SLA)
          </h1>
          <p className="mb-12 text-sm text-muted-foreground">
            تعهدات {settings.brand.name} برای ارائه خدمات با کیفیت و قابل اتکا
          </p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {slaItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <item.icon className="mb-3 h-6 w-6 text-primary" />
              <div className="mb-1 text-2xl font-extrabold text-foreground">{item.value}</div>
              <div className="mb-2 text-sm font-semibold text-foreground">{item.title}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="mb-4 text-xl font-bold text-foreground">جدول جبران خسارت</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">
                    آپ‌تایم
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">
                    اعتبار جبرانی
                  </th>
                </tr>
              </thead>
              <tbody>
                {compensationTable.map((row) => (
                  <tr key={row.uptime} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{row.uptime}</td>
                    <td className="px-5 py-3 font-medium text-brand">{row.credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </SiteLayout>
  );
}
