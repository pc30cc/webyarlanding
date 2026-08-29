import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Tag as TagIcon, ChevronLeft } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta } from "@/lib/seo-meta";
import { listPublishedPosts } from "@/lib/blog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/tag/$slug")({
  loader: async ({ params }) => {
    const [settings, posts, seoOverride] = await Promise.all([
      fetchSettings(),
      listPublishedPosts({ data: { tagSlug: params.slug } }),
      getPublicSeoPage({ data: { path: `/tag/${params.slug}` } }),
    ]);
    return { settings, posts, slug: params.slug, seoOverride };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: `/tag/${params.slug}`,
      override: loaderData.seoOverride,
      fallbackTitle: `برچسب: ${params.slug} | وب‌یار`,
      fallbackDescription: `همه‌ی مقالات منتشرشده با برچسب «${params.slug}».`,
    });
  },
  component: TagPage,
});

function TagPage() {
  const { settings, posts, slug } = Route.useLoaderData();
  return (
    <SiteLayout settings={settings}>
      <div className="container-page max-w-5xl py-16 sm:py-24">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand">
          <ArrowRight className="h-4 w-4" />
          بازگشت به بلاگ
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <TagIcon className="h-4 w-4" />
            برچسب
          </div>
          <h1 className="mb-3 text-3xl font-extrabold text-foreground sm:text-5xl">{slug}</h1>
          {posts.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{posts.length} مقاله یافت شد</p>}
        </motion.div>

        {posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">مقاله‌ای موجود نیست</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/30"
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-secondary">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-brand">{post.categoryName || "عمومی"}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="mb-2 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-brand">{post.title}</h2>
                  {post.excerpt && <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>}
                  <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <Link to="/blog/$slug" params={{ slug: post.slug }} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
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
