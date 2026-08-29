import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, Target, Award, Heart, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/about")({
  loader: async () => ({ settings: await fetchSettings() }),
  head: () => ({
    meta: [
      { title: "درباره ما | وب‌یار" },
      { name: "description", content: "وب‌یار پلتفرم جامع مدیریت ارتباط با مشتری برای توانمندسازی کسب‌وکارهای ایرانی." },
      { property: "og:title", content: "درباره ما | وب‌یار" },
      { property: "og:description", content: "آشنایی با مأموریت، ارزش‌ها، چشم‌انداز و تیم وب‌یار." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Target, title: "مأموریت", desc: "ارائه ابزارهای حرفه‌ای مدیریت ارتباط با مشتری به کسب‌وکارهای ایرانی با کیفیت جهانی و قیمت مناسب" },
  { icon: Heart, title: "ارزش‌ها", desc: "شفافیت، نوآوری، مشتری‌مداری و تعهد به کیفیت در تمام محصولات و خدمات ما" },
  { icon: Award, title: "چشم‌انداز", desc: "تبدیل شدن به پیشرو‌ترین پلتفرم CRM و ارتباطات مشتری در خاورمیانه" },
  { icon: Users, title: "تیم", desc: "تیمی از متخصصان با تجربه در حوزه‌های مهندسی نرم‌افزار، طراحی UX و بازاریابی دیجیتال" },
];

function AboutPage() {
  const { settings } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-4xl py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="mb-6 text-3xl font-extrabold text-foreground sm:text-5xl">درباره {settings.brand.name}</h1>
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {settings.brand.name} یک پلتفرم جامع مدیریت ارتباط با مشتری است که با هدف توانمندسازی کسب‌وکارهای ایرانی طراحی شده است.
          </p>
        </motion.div>

        <StaggerChildren className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <motion.div key={v.title} variants={childVariant} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <v.icon className="mb-4 h-8 w-8 text-brand" />
              <h3 className="mb-2 text-lg font-bold text-foreground">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>

        <ScrollReveal className="text-center">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30">
            به تیم ما بپیوندید <ChevronLeft className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
