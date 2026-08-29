import { createFileRoute } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { listPublishedPosts, listCategories, listTags } from "@/lib/blog.functions";

const staticPaths = ["/", "/about", "/pricing", "/contact", "/blog", "/terms", "/privacy", "/sla", "/api-docs"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [settings, posts, categories, tags] = await Promise.all([
          fetchSettings(),
          listPublishedPosts({ data: {} }),
          listCategories(),
          listTags(),
        ]);
        const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
        const urls = [
          ...staticPaths.map((p) => `${base}${p}`),
          ...posts.map((p) => `${base}/blog/${p.slug}`),
          ...categories.map((c) => `${base}/blog?category=${c.slug}`),
          ...tags.map((t) => `${base}/tag/${t.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=UTF-8" } });
      },
    },
  },
});
