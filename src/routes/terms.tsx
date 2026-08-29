import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  loader: async () => ({ settings: await fetchSettings() }),
  head: () => ({
    meta: [
      { title: "شرایط استفاده | وب‌یار" },
      { name: "description", content: "شرایط و ضوابط استفاده از خدمات وب‌یار را مطالعه کنید." },
      { property: "og:title", content: "شرایط استفاده | وب‌یار" },
      { property: "og:description", content: "قوانین و مقررات استفاده از پلتفرم وب‌یار." },
    ],
  }),
  component: TermsPage,
});

function sections(brand: string) {
  return [
    { title: "پذیرش شرایط", content: `با استفاده از خدمات ${brand}، شما شرایط و ضوابط زیر را می‌پذیرید.` },
    { title: "حساب کاربری", content: "شما مسئول حفظ امنیت حساب کاربری خود هستید." },
    { title: "استفاده مجاز", content: "استفاده از خدمات باید مطابق با قوانین جاری کشور باشد." },
    { title: "مالکیت معنوی", content: `تمامی محتوا و کدهای ${brand} تحت حمایت قوانین مالکیت معنوی است.` },
    { title: "محدودیت مسئولیت", content: `${brand} تلاش می‌کند خدمات را بدون وقفه ارائه دهد اما مسئولیتی در قبال خسارات غیرمستقیم ندارد.` },
    { title: "تغییرات در شرایط", content: `${brand} حق تغییر شرایط را دارد. تغییرات از طریق وب‌سایت اطلاع‌رسانی می‌شود.` },
    { title: "قانون حاکم", content: "این توافقنامه تابع قوانین جمهوری اسلامی ایران است." },
  ];
}

function TermsPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-3xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">شرایط استفاده</h1>
          <p className="mb-10 text-sm text-muted-foreground">آخرین بروزرسانی: فروردین ۱۴۰۵</p>
        </motion.div>
        <div className="space-y-8">
          {sections(settings.brand.name).map((s, i) => (
            <motion.section key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <h2 className="mb-3 text-lg font-bold text-foreground">{s.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{s.content}</p>
            </motion.section>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
