import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Shield, Zap } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sla")({
  loader: async () => ({ settings: await fetchSettings() }),
  head: () => ({
    meta: [
      { title: "توافقنامه سطح خدمات (SLA) | وب‌یار" },
      { name: "description", content: "تعهدات وب‌یار برای ارائه خدمات با کیفیت و قابل اتکا، شامل آپ‌تایم و زمان پاسخ‌دهی." },
      { property: "og:title", content: "توافقنامه سطح خدمات (SLA) | وب‌یار" },
      { property: "og:description", content: "آپ‌تایم ۹۹.۹٪ و پشتیبانی سریع، تعهد ما به کیفیت خدمات." },
    ],
  }),
  component: SLAPage,
});

const slaItems = [
  { icon: Zap, title: "آپ‌تایم تضمینی", value: "۹۹.۹٪", desc: "تضمین دسترسی به پلتفرم در ۹۹.۹٪ از زمان." },
  { icon: Clock, title: "زمان پاسخ‌دهی پشتیبانی", value: "<۲ ساعت", desc: "پلن حرفه‌ای: حداکثر ۲ ساعت | پلن رشد: حداکثر ۴ ساعت" },
  { icon: Shield, title: "بازیابی اطلاعات", value: "<۴ ساعت", desc: "بازیابی اطلاعات از آخرین نسخه پشتیبان ظرف ۴ ساعت." },
  { icon: CheckCircle2, title: "بروزرسانی‌ها", value: "بدون وقفه", desc: "بروزرسانی‌های پلتفرم بدون نیاز به توقف سرویس." },
];

const compensationTable = [
  { uptime: "۹۹.۹٪ - ۹۹.۵٪", credit: "۱۰٪ اعتبار ماهانه" },
  { uptime: "۹۹.۵٪ - ۹۹.۰٪", credit: "۲۵٪ اعتبار ماهانه" },
  { uptime: "زیر ۹۹.۰٪", credit: "۵۰٪ اعتبار ماهانه" },
];

function SLAPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-4xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">توافقنامه سطح خدمات (SLA)</h1>
          <p className="mb-12 text-sm text-muted-foreground">تعهدات {settings.brand.name} برای ارائه خدمات با کیفیت و قابل اتکا</p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {slaItems.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <item.icon className="mb-3 h-6 w-6 text-brand" />
              <div className="mb-1 text-2xl font-extrabold text-foreground">{item.value}</div>
              <div className="mb-2 text-sm font-semibold text-foreground">{item.title}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="mb-4 text-xl font-bold text-foreground">جدول جبران خسارت</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">آپ‌تایم</th>
                  <th className="px-5 py-3 text-start text-xs font-semibold text-foreground">اعتبار جبرانی</th>
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
