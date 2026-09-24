import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Award, Heart, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { joinFa } from "@/lib/settings";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal, StaggerChildren, childVariant } from "@/components/site/animations";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/about" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/about",
      override: loaderData.seoOverride,
      fallbackTitle: "درباره ما | وب‌یار",
      fallbackDescription:
        "وب‌یار پلتفرم جامع مدیریت ارتباط با مشتری برای توانمندسازی کسب‌وکارهای ایرانی.",
    });
  },
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "مأموریت",
    desc: "کمک به کسب‌وکارهای آنلاین برای پاسخ‌گویی سریع‌تر به مشتری، بدون نیاز به ابزارهای پیچیده.",
  },
  { icon: Heart, title: "ارزش‌ها", desc: "شفافیت، سادگی و پایداری در تمام تصمیم‌های محصول." },
  {
    icon: Award,
    title: "چشم‌انداز",
    desc: "تبدیل شدن به انتخاب پیش‌فرض کسب‌وکارهای ایرانی برای ارتباط زنده با مشتری.",
  },
];

function AboutPage() {
  const { settings } = Route.useLoaderData();
  const callEnabled = settings.videoCall.enabled;
  const aiEnabled = settings.aiMarketing.enabled;
  const midText = joinFa(aiEnabled && "ایجنت هوش مصنوعی", callEnabled && "مرکز تماس");
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: `درباره ${settings.brand.name}`,
      url: base ? `${base}/about` : undefined,
      isPartOf: { "@type": "WebSite", name: settings.brand.name, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "درباره ما", path: "/about" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div className="container-page max-w-4xl py-16 text-center sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 text-sm font-bold text-primary">درباره ما</div>
          <h1 className="mb-6 text-3xl font-extrabold text-foreground sm:text-5xl">
            داستان {settings.brand.name}
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {settings.brand.name} برای این ساخته شد که کسب‌وکارهای آنلاین بدون نیاز به تیم فنی بزرگ،
            بتوانند مثل یک فروشگاه حضوری با مشتری صحبت کنند؛{" "}
            {callEnabled ? "از طریق چت زنده و تماس تصویری، دقیقاً" : "از طریق چت زنده، دقیقاً"}{" "}
            همان‌جایی که مشتری تصمیم می‌گیرد. با گذشت زمان این ابزار به یک پلتفرم کامل تبدیل شد:{" "}
            {midText && `از ${midText} گرفته تا `}
            مخاطبین، پایگاه دانش، ابزارهای سئو و آنالیز وب، همه در یک پنل ساده و بدون نیاز به
            ابزارهای پراکنده.
          </p>
        </motion.div>

        <StaggerChildren className="grid grid-cols-1 gap-6 text-start sm:grid-cols-3">
          {values.map((v) => (
            <motion.div
              key={v.title}
              variants={childVariant}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <v.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-bold text-foreground">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>

      <div className="bg-secondary/30 px-4 py-16 text-center sm:px-8 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">
            تیم {settings.brand.name}
          </h2>
          <p className="mb-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
            تیمی کوچک از توسعه‌دهندگان و طراحان محصول که هر روز روی سرعت، پایداری و سادگی{" "}
            {settings.brand.name} کار می‌کنند.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
          >
            به تیم ما بپیوندید <ChevronLeft className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
