import { createFileRoute } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { listPublishedPosts, listTags } from "@/lib/blog.functions";
import { getPublicCatalog } from "@/lib/catalog.functions";

const staticPaths = [
  "/",
  "/products",
  "/solutions",
  "/about",
  "/pricing",
  "/contact",
  "/blog",
  "/terms",
  "/privacy",
  "/sla",
  "/api-docs",
];

interface SitemapUrl {
  loc: string;
  lastmod?: string | null;
}

/** حداقل کاراکترهای ویژه‌ی XML را در آدرس escape می‌کند تا سایت‌مپ همیشه معتبر بماند */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** تاریخ آخرین تغییر به فرمت YYYY-MM-DD (استاندارد lastmod در پروتکل سایت‌مپ) */
function toLastmod(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [settings, posts, tags, productCatalog, solutionCatalog] = await Promise.all([
          fetchSettings(),
          listPublishedPosts({ data: {} }),
          listTags(),
          getPublicCatalog({ data: { type: "product" } }),
          getPublicCatalog({ data: { type: "solution" } }),
        ]);
        const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
        const urls: SitemapUrl[] = [
          ...staticPaths.map((p): SitemapUrl => ({ loc: `${base}${p}` })),
          ...posts.map((p): SitemapUrl => ({
            loc: `${base}/blog/${p.slug}`,
            lastmod: toLastmod(p.updatedAt),
          })),
          // دسته‌بندی‌های بلاگ صفحه‌ی مستقل ندارند — فیلترشان فقط سمت کلاینت است و
          // /blog?category=... همان محتوای /blog را رندر می‌کند، پس در سایت‌مپ نمی‌آید.
          // برچسب‌های تک‌مقاله‌ای noindex هستند (محتوای کافی برای ایندکس مستقل ندارند)،
          // پس در سایت‌مپ هم نمی‌آیند تا سیگنال سایت‌مپ با متای robots همان صفحه یکی باشد.
          ...tags
            .filter((t) => (t.postCount ?? 0) >= 2)
            .map((t): SitemapUrl => ({ loc: `${base}/tag/${t.slug}` })),
          ...productCatalog
            .flatMap((c) => c.items)
            .map((p): SitemapUrl => ({
              loc: `${base}/products/${p.slug}`,
              lastmod: toLastmod(p.updatedAt),
            })),
          ...solutionCatalog
            .flatMap((c) => c.items)
            .map((s): SitemapUrl => ({
              loc: `${base}/solutions/${s.slug}`,
              lastmod: toLastmod(s.updatedAt),
            })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            (u) =>
              `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
          )
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=UTF-8" } });
      },
    },
  },
});
