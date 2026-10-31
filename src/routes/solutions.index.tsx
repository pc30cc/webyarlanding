import { localizeStructuredData } from "@/lib/site-i18n";
import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { getPublicCatalog } from "@/lib/catalog.functions";
import {
  buildPageMeta,
  parseSchemaJson,
  buildBreadcrumbJsonLd,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { getIcon } from "@/lib/icon-registry";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  ScrollReveal,
  StaggerChildren,
  childVariant,
} from "@/components/site/animations";

export const Route = createFileRoute("/solutions/")({
  loader: async () => {
    const [settings, seoOverride, categories] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/solutions" } }),
      getPublicCatalog({ data: { type: "solution" } }),
    ]);
    return { settings, seoOverride, categories };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/solutions",
      override: loaderData.seoOverride,
      fallbackTitle: "راه‌کارها | راه‌حل وب‌یار برای هر صنعت | وب‌یار",
      fallbackDescription:
        "راه‌کارهای اختصاصی وب‌یار برای فروشگاه‌های اینترنتی، کسب‌وکارهای خدماتی، استارتاپ‌ها، آموزش آنلاین و آژانس‌های املاک.",
    });
  },
  component: SolutionsPage,
});

const TINTS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-success/10", text: "text-success" },
];

// مثل products.index.tsx — راه‌کارهایی که در پنل مدیریت کاتالوگ ثبت شده‌اند از دیتابیس می‌آیند؛
// این فیلتر با videoCall.enabled=false یا aiMarketing.enabled=false هر آیتمی که به همان موضوع
// اشاره دارد را از این لیست پنهان می‌کند (برای حذف کامل، بهتر است در همان پنل هم از حالت انتشار
// خارج شود).
const CALL_KEYWORDS = [
  "تماس تصویری",
  "تماس ویدیویی",
  "ویدیویی",
  "تماس صوتی",
  "مرکز تماس",
];
const AI_KEYWORDS = ["هوش مصنوعی", "دستیار هوشمند", "ایجنت"];
function mentionsAny(
  item: { title: string; shortDesc: string },
  keywords: string[],
): boolean {
  return keywords.some(
    (k) => item.title.includes(k) || item.shortDesc.includes(k),
  );
}

function SolutionsPage() {
  const translateText = useSiteTranslation();

  const {
    settings,
    seoOverride,
    categories: allCategories,
  } = Route.useLoaderData();
  const callEnabled = settings.videoCall.enabled;
  const aiEnabled = settings.aiMarketing.enabled;
  const categories = allCategories
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (i) =>
          (callEnabled || !mentionsAny(i, CALL_KEYWORDS)) &&
          (aiEnabled || !mentionsAny(i, AI_KEYWORDS)),
      ),
    }))
    .filter((c) => c.items.length > 0);
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const allSolutions = categories.flatMap((c) => c.items);

  const jsonLd = parseSchemaJson(seoOverride?.schemaJson) ?? [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "راه‌کارهای وب‌یار",
      itemListElement: allSolutions.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Service",
          name: s.title,
          description: s.shortDesc,
          url: base ? `${base}/solutions/${s.slug}` : undefined,
          provider: { "@type": "Organization", name: settings.brand.name },
        },
      })),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "راه‌کارها", path: "/solutions" },
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

      <section className="relative -mt-16 overflow-hidden pt-32 pb-12 sm:-mt-[4.75rem] sm:pt-[10.75rem] sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-primary/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -start-24 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl xl:-start-10 xl:h-[560px] xl:w-[560px] 2xl:h-[680px] 2xl:w-[680px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-32 -end-16 h-[340px] w-[340px] rounded-full bg-primary/15 blur-3xl xl:top-24 xl:-end-4 xl:h-[460px] xl:w-[460px] 2xl:h-[560px] 2xl:w-[560px]"
        />

        <div className="container-page relative z-10 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-3 text-sm font-bold text-primary">
              {translateText("راه‌کارها")}
            </div>
            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              {translateText("راه‌حلی مخصوص ")}
              <span className="text-brand">
                {translateText("کسب‌وکار شما")}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              {translateText(
                "وب‌یار برای هر صنعت به شکل متفاوتی به کار می‌آید. راه‌کار اختصاصی حوزه فعالیت خودتان را ببینید.",
              )}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-page space-y-16 pb-16 sm:space-y-20 sm:pb-24">
        {categories.map((category) => (
          <div key={category.id}>
            <ScrollReveal className="mb-6">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {translateText(category.title)}
              </h2>
            </ScrollReveal>
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((s, i) => {
                const tint = TINTS[i % TINTS.length]!;
                const Icon = getIcon(s.icon);
                return (
                  <motion.div key={s.id} variants={childVariant}>
                    <Link
                      to="/solutions/$slug"
                      params={{ slug: s.slug }}
                      className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-glow sm:p-7"
                    >
                      <div
                        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tint.bg}`}
                      >
                        <Icon className={`h-7 w-7 ${tint.text}`} />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-foreground">
                        {translateText(s.title)}
                      </h3>
                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                        {translateText(s.shortDesc)}
                      </p>
                      <ul className="mt-auto space-y-2">
                        {s.bullets.slice(0, 3).map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            <span>{translateText(b)}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        {translateText("بیشتر بدانید ")}
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </StaggerChildren>
          </div>
        ))}
      </div>

      <div className="bg-secondary/30 px-4 py-16 text-center sm:px-8 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-4xl">
            {translateText("صنعت خودتان را پیدا نکردید؟")}
          </h2>
          <p className="mb-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {translateText(
              "وب‌یار برای هر کسب‌وکاری که نیاز به ارتباط زنده با مشتری دارد قابل تنظیم است. با ما تماس بگیرید.",
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              {translateText("مشاوره رایگان ")}
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center rounded-xl border border-border px-10 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {translateText("مشاهده محصولات")}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
