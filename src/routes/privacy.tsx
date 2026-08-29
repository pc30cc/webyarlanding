import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([fetchSettings(), getPublicSeoPage({ data: { path: "/privacy" } })]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/privacy",
      override: loaderData.seoOverride,
      fallbackTitle: "حریم خصوصی | وب‌یار",
      fallbackDescription: "سیاست‌های حفظ حریم خصوصی و امنیت اطلاعات کاربران در وب‌یار.",
    });
  },
  component: PrivacyPage,
});

function sections(brand: string) {
  return [
    { title: "۱. جمع‌آوری اطلاعات", content: "اطلاعاتی را که هنگام ثبت‌نام، استفاده از خدمات یا تماس با ما ارائه می‌دهید جمع‌آوری می‌کنیم." },
    { title: "۲. استفاده از اطلاعات", content: "اطلاعات جمع‌آوری‌شده تنها برای ارائه و بهبود خدمات استفاده می‌شود." },
    { title: "۳. حفاظت از داده‌ها", content: `${brand} از رمزنگاری end-to-end و پروتکل‌های امنیتی برای محافظت از داده‌ها استفاده می‌کند.` },
    { title: "۴. اشتراک‌گذاری اطلاعات", content: "اطلاعات شخصی شما بدون رضایت شما با اشخاص ثالث به اشتراک گذاشته نمی‌شود." },
    { title: "۵. کوکی‌ها", content: `${brand} از کوکی‌ها برای بهبود تجربه کاربری در وب‌سایت استفاده می‌کند.` },
    { title: "۶. حقوق کاربران", content: "شما حق دسترسی، اصلاح و حذف اطلاعات شخصی خود را در هر زمان دارید." },
  ];
}

function PrivacyPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-3xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">حریم خصوصی</h1>
          <p className="mb-10 text-sm text-muted-foreground">آخرین بروزرسانی: مرداد ۱۴۰۵</p>
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
