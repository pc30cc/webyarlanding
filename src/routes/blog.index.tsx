import { localizeStructuredData } from "@/lib/site-i18n";
import {
  useSiteLocale,
  useSiteTranslation,
} from "@/components/site/SiteLanguage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  safeJsonLdHtml,
} from "@/lib/seo-meta";
import { listPublishedPostsPage, listCategories } from "@/lib/blog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

// همه‌ی فیلدها عمداً اختیاری‌اند (بدون .default) تا Link به این مسیر در جاهای دیگر سایت
// نیازی به پاس‌دادن search نداشته باشد؛ مقدار پیش‌فرض صفحه‌ی ۱ فقط هنگام مصرف اعمال می‌شود.
const blogSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>) =>
    blogSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page,
    category: search.category,
    q: search.q,
  }),
  loader: async ({ deps }) => {
    const [settings, page, categories, seoOverride] = await Promise.all([
      fetchSettings(),
      listPublishedPostsPage({
        data: { page: deps.page, categorySlug: deps.category, search: deps.q },
      }),
      listCategories(),
      getPublicSeoPage({ data: { path: "/blog" } }),
    ]);
    return {
      settings,
      page,
      categories,
      seoOverride,
      category: deps.category,
      q: deps.q,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { settings, seoOverride, page, category, q } = loaderData;
    // صفحات بعدی/فیلترشده باید به آدرس واقعی خودشان کنونیکال شوند، نه صفحه‌ی اول؛
    // نتایج جست‌وجوی آزاد (q) هم ایندکس نمی‌شوند تا محتوای نازک/تکراری در گوگل نیفتد.
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (page.page > 1) params.set("page", String(page.page));
    const qs = params.toString();
    const path = qs ? `/blog?${qs}` : "/blog";
    return buildPageMeta({
      settings,
      path,
      override: seoOverride,
      fallbackTitle:
        page.page > 1 ? `بلاگ، صفحه ${page.page} | وب‌یار` : "بلاگ | وب‌یار",
      fallbackDescription:
        "آخرین مقالات و اخبار وب‌یار درباره چت زنده، CRM، هوش مصنوعی و بازاریابی.",
      defaultRobots: q ? "noindex,follow" : "index,follow",
    });
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const translateText = useSiteTranslation();
  const locale = useSiteLocale();

  const { settings, page, categories } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { posts, total, pageSize } = page;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = search.page ?? 1;

  const [searchInput, setSearchInput] = useState(search.q ?? "");
  useEffect(() => setSearchInput(search.q ?? ""), [search.q]);
  useEffect(() => {
    const current = search.q ?? "";
    if (searchInput === current) return;
    const timeout = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          q: searchInput.trim() || undefined,
          page: 1,
        }),
        replace: true,
      });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `بلاگ ${settings.brand.name}`,
      url: base ? `${base}/blog` : undefined,
      blogPost: posts.map((p) => ({
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
        dangerouslySetInnerHTML={safeJsonLdHtml(
          localizeStructuredData(settings, jsonLd),
        )}
      />
      <div className="container-page max-w-5xl py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">
            {translateText("بلاگ")}
          </h1>
          <p className="text-base text-muted-foreground">
            {translateText("آخرین مقالات و اخبار")}
          </p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/blog"
              search={(prev) => ({ ...prev, category: undefined, page: 1 })}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${!search.category ? "bg-brand text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}
            >
              {translateText("همه")}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/blog"
                search={(prev) => ({ ...prev, category: c.slug, page: 1 })}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${search.category === c.slug ? "bg-brand text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}
              >
                {translateText(c.name)}
              </Link>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translateText("جست‌وجو در مقالات...")}
              className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {translateText("مقاله‌ای موجود نیست")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                // سه کارت اول تقریباً همیشه در نمای اول صفحه هستند — اگر با opacity:0 شروع
                // شوند، عنصر LCP تا اجرای جاوااسکریپت کلاینت نامرئی می‌ماند و LCP به‌شدت کند
                // می‌شود؛ برای همین این‌ها بدون افکت محو-ورود رندر می‌شوند.
                initial={i < 3 ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i < 3 ? 0 : i * 0.06 }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/30"
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-secondary">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={translateText(post.title)}
                      width={1000}
                      height={192}
                      loading={i < 3 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-brand">
                        {translateText(post.categoryName || "عمومی")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="mb-2 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-brand">
                    {translateText(post.title)}
                  </h2>
                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {translateText(post.excerpt)}
                    </p>
                  )}
                  <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {translateText(
                          new Date(post.publishedAt).toLocaleDateString(locale),
                        )}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    aria-label={translateText(`ادامه مطلب: ${post.title}`)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    {translateText("ادامه مطلب ")}
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label={translateText("صفحه‌بندی بلاگ")}
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            <Link
              to="/blog"
              search={(prev) => ({
                ...prev,
                page: Math.max(1, currentPage - 1),
              })}
              aria-disabled={currentPage <= 1}
              aria-label={translateText("صفحه قبل")}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-secondary"}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) =>
                  n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1,
              )
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== n - 1 && (
                    <span className="text-muted-foreground">…</span>
                  )}
                  <Link
                    to="/blog"
                    search={(prev) => ({ ...prev, page: n })}
                    aria-current={n === currentPage ? "page" : undefined}
                    aria-label={translateText(`رفتن به صفحه ${n}`)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${n === currentPage ? "bg-brand text-primary-foreground" : "border border-border text-foreground hover:bg-secondary"}`}
                  >
                    {translateText(n.toLocaleString(locale))}
                  </Link>
                </span>
              ))}
            <Link
              to="/blog"
              search={(prev) => ({
                ...prev,
                page: Math.min(totalPages, currentPage + 1),
              })}
              aria-disabled={currentPage >= totalPages}
              aria-label={translateText("صفحه بعد")}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-secondary"}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </div>
    </SiteLayout>
  );
}
