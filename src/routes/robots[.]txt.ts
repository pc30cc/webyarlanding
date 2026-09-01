import { createFileRoute } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { looksLikeRobotsTxt } from "@/lib/seo-meta";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const settings = await fetchSettings();
        const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
        const body = looksLikeRobotsTxt(settings.seo.robots)
          ? settings.seo.robots
          : [
              "User-agent: *",
              "Allow: /",
              "Disallow: /admin",
              "Disallow: /admin-login",
              "Disallow: /api/",
              "",
              `Sitemap: ${base}/sitemap.xml`,
            ].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=UTF-8" } });
      },
    },
  },
});
