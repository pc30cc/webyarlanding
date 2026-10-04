import { localizeStructuredData } from "@/lib/site-i18n";
import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { getPublicCatalogItem } from "@/lib/catalog.functions";
import { buildPageMeta, safeJsonLdHtml } from "@/lib/seo-meta";
import { getIcon } from "@/lib/icon-registry";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ScrollReveal } from "@/components/site/animations";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const [settings, result, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicCatalogItem({ data: { type: "product", slug: params.slug } }),
      getPublicSeoPage({ data: { path: `/products/${params.slug}` } }),
    ]);
    if (!result) throw notFound();
    return { settings, ...result, seoOverride };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { settings, item, seoOverride } = loaderData;
    return buildPageMeta({
      settings,
      path: `/products/${params.slug}`,
      override: seoOverride,
      fallbackTitle: `${item.title} | محصولات وب‌یار`,
      fallbackDescription: item.shortDesc || item.description,
    });
  },
  notFoundComponent: () => (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold text-foreground">
        محصول یافت نشد
      </h1>
      <Link to="/products" className="text-sm text-brand hover:underline">
        بازگشت به محصولات
      </Link>
    </div>
  ),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const translateText = useSiteTranslation();

  const { settings, item, categoryTitle, related } = Route.useLoaderData();
  const Icon = getIcon(item.icon);
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const url = `${base}/products/${item.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: item.title,
      description: item.shortDesc || item.description,
      url,
      provider: {
        "@type": "Organization",
        name: settings.brand.name,
        url: base || undefined,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "خانه",
          item: base || undefined,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "محصولات",
          item: base ? `${base}/products` : undefined,
        },
        { "@type": "ListItem", position: 3, name: item.title, item: url },
      ],
    },
  ];

  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLdHtml(
          localizeStructuredData(settings, jsonLd),
        )}
      />

      <section className="relative -mt-16 overflow-hidden pt-28 pb-16 sm:-mt-[4.75rem] sm:pt-[8.75rem] sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-primary/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -start-24 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl xl:-start-10 xl:h-[560px] xl:w-[560px]"
        />

        <div className="container-page relative z-10 max-w-3xl">
          <nav
            aria-label={translateText("مسیر")}
            className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link to="/" className="transition-colors hover:text-foreground">
              {translateText("خانه")}
            </Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <Link
              to="/products"
              className="transition-colors hover:text-foreground"
            >
              {translateText("محصولات")}
            </Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-foreground">{translateText(item.title)}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            {categoryTitle && (
              <div className="mb-3 text-sm font-bold text-primary">
                {translateText(categoryTitle)}
              </div>
            )}
            <h1 className="mb-6 text-3xl font-extrabold leading-[1.25] text-foreground sm:text-5xl">
              {translateText(item.title)}
            </h1>
            <p className="max-w-2xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
              {translateText(item.shortDesc || item.description)}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-page pb-16 sm:pb-24">
        <div className="max-w-3xl">
          {item.description && (
            <ScrollReveal className="prose prose-sm mb-14 max-w-none prose-headings:text-foreground prose-p:leading-[1.9] prose-p:text-muted-foreground prose-a:text-brand prose-strong:text-foreground sm:prose-base dark:prose-invert">
              <ReactMarkdown>{translateText(item.description)}</ReactMarkdown>
            </ScrollReveal>
          )}

          <ScrollReveal>
            <h2 className="mb-6 text-xl font-extrabold text-foreground sm:text-2xl">
              {translateText("امکانات ")}
              {translateText(item.title)}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm leading-relaxed text-foreground">
                    {translateText(b)}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href={settings.auth.signupUrl || "/contact"}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              {translateText(settings.auth.signupLabel || "شروع رایگان")}{" "}
              <ChevronLeft className="h-4 w-4" />
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {translateText("مشاهده قیمت‌ها")}
            </Link>
          </ScrollReveal>
        </div>

        {related.length > 0 && (
          <div className="mt-16 max-w-4xl border-t border-border pt-10">
            <h2 className="mb-6 text-lg font-bold text-foreground">
              {translateText("سایر محصولات این دسته")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r) => {
                const RelIcon = getIcon(r.icon);
                return (
                  <Link
                    key={r.id}
                    to="/products/$slug"
                    params={{ slug: r.slug }}
                    className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30"
                  >
                    <RelIcon className="mb-2 h-5 w-5 text-primary" />
                    <div className="mb-1 text-sm font-bold text-foreground">
                      {translateText(r.title)}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {translateText(r.shortDesc)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <Link
          to="/products"
          className="mt-12 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowRight className="h-4 w-4" />
          {translateText("بازگشت به همه محصولات")}
        </Link>
      </div>
    </SiteLayout>
  );
}
