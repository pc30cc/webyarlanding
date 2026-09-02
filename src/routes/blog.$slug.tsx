import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Calendar, User, Tag as TagIcon } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [settings, post] = await Promise.all([
      fetchSettings(),
      getPublishedPost({ data: { slug: params.slug } }),
    ]);
    if (!post) throw notFound();
    const related = (
      await listPublishedPosts({ data: { categorySlug: post.categorySlug ?? undefined, limit: 4 } })
    )
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3);
    return { settings, post, related };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { settings, post } = loaderData;
    const title = post.seoTitle || `${post.title} | وب‌یار`;
    const desc = post.seoDescription || post.excerpt || post.title;
    return buildPageMeta({
      settings,
      path: `/blog/${params.slug}`,
      override: null, // یک ردیف seo_pages سراسری برای این مسیر معنا ندارد؛ عنوان/توضیحات/تصویر پست همیشه اولویت دارند
      fallbackTitle: title,
      fallbackDescription: desc,
      ...(post.coverImage ? { fallbackOgImage: post.coverImage } : {}),
      ogType: "article",
      extraMeta: [
        { property: "article:published_time", content: post.publishedAt || post.createdAt },
        { property: "article:modified_time", content: post.updatedAt },
        ...(post.author ? [{ property: "article:author", content: post.author }] : []),
        ...post.tags.map((tag) => ({ property: "article:tag", content: tag })),
      ],
    });
  },
  notFoundComponent: () => (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold text-foreground">مقاله یافت نشد</h1>
      <Link to="/blog" className="text-sm text-brand hover:underline">
        بازگشت به بلاگ
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold text-foreground">خطایی رخ داد</h1>
      <Link to="/blog" className="text-sm text-brand hover:underline">
        بازگشت به بلاگ
      </Link>
    </div>
  ),
  component: BlogPostPage,
});

function tagSlug(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_/\\.,:;!?"'`(){}[\]]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function BlogPostPage() {
  const { settings, post, related } = Route.useLoaderData();

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const url = base ? `${base}/blog/${post.slug}` : undefined;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      image: post.coverImage || undefined,
      url,
      mainEntityOfPage: url ? { "@type": "WebPage", "@id": url } : undefined,
      author: { "@type": "Person", name: post.author || settings.brand.name },
      publisher: {
        "@type": "Organization",
        name: settings.brand.name,
        logo: settings.brand.logoUrl
          ? { "@type": "ImageObject", url: settings.brand.logoUrl }
          : undefined,
      },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "بلاگ", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div className="container-page max-w-3xl py-16 sm:py-24">
        <Link
          to="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به بلاگ
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-4 mt-4 text-2xl font-extrabold leading-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
              </span>
            )}
          </div>
          {post.coverImage && (
            <div className="mb-8 overflow-hidden rounded-xl border border-border">
              <img
                src={post.coverImage}
                alt={post.title}
                loading="lazy"
                className="h-auto max-h-[400px] w-full object-cover"
              />
            </div>
          )}
          {post.excerpt && (
            <p className="mb-8 border-s-4 border-primary/30 ps-4 text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-brand sm:prose-base dark:prose-invert">
            <ReactMarkdown components={{ h1: (props) => <h2 {...props} /> }}>
              {post.content}
            </ReactMarkdown>
          </div>

          {post.tags.length > 0 && (
            <footer className="mt-10 border-t border-border pt-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <TagIcon className="h-4 w-4 text-primary" />
                برچسب‌ها
              </div>
              <ul className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      to="/tag/$slug"
                      params={{ slug: tagSlug(tag) }}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-brand transition-colors hover:bg-primary/20"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </motion.article>

        {related.length > 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <h2 className="mb-6 text-lg font-bold text-foreground">مقالات مرتبط</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30"
                >
                  <div className="line-clamp-2 text-sm font-bold text-foreground">{r.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
