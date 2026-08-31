import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Search } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { listPublishedPosts, listCategories } from "@/lib/blog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const [settings, posts, categories, seoOverride] = await Promise.all([
      fetchSettings(),
      listPublishedPosts({ data: {} }),
      listCategories(),
      getPublicSeoPage({ data: { path: "/blog" } }),
    ]);
    return { settings, posts, categories, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/blog",
      override: loaderData.seoOverride,
      fallbackTitle: "بلاگ | وب‌یار",
      fallbackDescription:
        "آخرین مقالات و اخبار وب‌یار درباره چت زنده، CRM، هوش مصنوعی و بازاریابی.",
    });
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { settings, posts, categories } = Route.useLoaderData();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesCategory = !activeCategory || p.categorySlug === activeCategory;
      const q = search.trim();
      const matchesSearch = !q || p.title.includes(q) || p.excerpt.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, search]);

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `بلاگ ${settings.brand.name}`,
      url: base ? `${base}/blog` : undefined,
      blogPost: posts.slice(0, 20).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: base ? `${base}/blog/${p.slug}` : undefined,
        datePublished: p.publishedAt || p.createdAt,
      })),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "بلاگ", path: "/blog" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-page max-w-5xl py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">بلاگ</h1>
          <p className="text-base text-muted-foreground">آخرین مقالات و اخبار</p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? "bg-brand text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}
            >
              همه
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.slug)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${activeCategory === c.slug ? "bg-brand text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجو در مقالات..."
              className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">مقاله‌ای موجود نیست</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/30"
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-secondary">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-brand">
                        {post.categoryName || "عمومی"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="mb-2 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-brand">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    ادامه مطلب <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
