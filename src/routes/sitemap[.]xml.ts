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
        const urls = [
          ...staticPaths.map((p) => `${base}${p}`),
          ...posts.map((p) => `${base}/blog/${p.slug}`),
          // دسته‌بندی‌های بلاگ صفحه‌ی مستقل ندارند — فیلترشان فقط سمت کلاینت است و
          // /blog?category=... همان محتوای /blog را رندر می‌کند، پس در سایت‌مپ نمی‌آید.
          ...tags.map((t) => `${base}/tag/${t.slug}`),
          ...productCatalog.flatMap((c) => c.items).map((p) => `${base}/products/${p.slug}`),
          ...solutionCatalog.flatMap((c) => c.items).map((s) => `${base}/solutions/${s.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=UTF-8" } });
      },
    },
  },
});
