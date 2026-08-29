import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Code2, Key, Webhook, FileJson, Zap, Lock } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/api-docs")({
  loader: async () => ({ settings: await fetchSettings() }),
  head: () => ({
    meta: [
      { title: "مستندات API | وب‌یار" },
      { name: "description", content: "راهنمای کامل REST API وب‌یار برای یکپارچه‌سازی با سیستم‌های شما." },
      { property: "og:title", content: "مستندات API | وب‌یار" },
      { property: "og:description", content: "احراز هویت، وب‌هوک‌ها و فهرست کامل Endpointهای API وب‌یار." },
    ],
  }),
  component: ApiDocsPage,
});

const sections = [
  { icon: Key, title: "احراز هویت", desc: "تمام درخواست‌ها نیاز به کلید API در هدر دارند.", code: "Authorization: Bearer YOUR_API_KEY" },
  { icon: FileJson, title: "فرمت پاسخ", desc: "تمام پاسخ‌ها به فرمت JSON هستند.", code: '{ "success": true, "data": {...}, "meta": {...} }' },
  { icon: Webhook, title: "وب‌هوک‌ها", desc: "رویدادها را به صورت Real-time به سرور خود دریافت کنید.", code: "POST https://YOUR_BACKEND/webhook" },
  { icon: Zap, title: "محدودیت نرخ", desc: "۳۰۰ درخواست در دقیقه برای هر کلید API.", code: "X-RateLimit-Remaining: 299" },
  { icon: Lock, title: "امنیت", desc: "تمام ارتباطات از طریق HTTPS رمزنگاری شده است.", code: "X-Webhook-Signature: sha256=..." },
];

const endpoints = [
  { method: "GET", path: "/api/v1/contacts", desc: "لیست مخاطبین" },
  { method: "POST", path: "/api/v1/contacts", desc: "ایجاد مخاطب جدید" },
  { method: "GET", path: "/api/v1/conversations", desc: "لیست گفتگوها" },
  { method: "POST", path: "/api/v1/messages", desc: "ارسال پیام" },
  { method: "GET", path: "/api/v1/campaigns", desc: "لیست کمپین‌ها" },
  { method: "POST", path: "/api/v1/webhooks", desc: "ایجاد وب‌هوک" },
];

function ApiDocsPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-5xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <Code2 className="h-8 w-8 text-brand" />
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">مستندات API</h1>
          </div>
          <p className="text-base text-muted-foreground">راهنمای کامل REST API برای یکپارچه‌سازی با سیستم‌های شما</p>
        </motion.div>

        <div className="mb-16 space-y-6">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-base font-bold text-foreground">{s.title}</h3>
                  <p className="mb-3 text-xs text-muted-foreground">{s.desc}</p>
                  <code dir="ltr" className="block overflow-x-auto rounded-lg border border-border bg-secondary/50 px-4 py-2.5 font-mono text-xs text-brand">
                    {s.code}
                  </code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="mb-4 text-xl font-bold text-foreground">لیست Endpointها</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold">متد</th>
                  <th className="px-5 py-3 text-start text-xs font-semibold">مسیر</th>
                  <th className="px-5 py-3 text-start text-xs font-semibold">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={ep.path + ep.method} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3">
                      <span className={`font-mono text-xs font-bold ${ep.method === "GET" ? "text-success" : "text-warning"}`}>{ep.method}</span>
                    </td>
                    <td dir="ltr" className="px-5 py-3 font-mono text-xs text-foreground">{ep.path}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{ep.desc}</td>
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
