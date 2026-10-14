import { createFileRoute } from "@tanstack/react-router";
import { LEGACY_SLUG_PREFIX, RESPOK_BUILD } from "@/lib/brand-scrub";

// ثبت کلیک دانلود و ریدایرکت به لینک واقعی برنامه
export const Route = createFileRoute("/go/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let target: string | null = null;
        try {
          const { recordClick } = await import("@/lib/apps.server");
          target = await recordClick(params.slug, {
            referrer: request.headers.get("referer"),
            userAgent: request.headers.get("user-agent"),
          });
        } catch (e) {
          console.error("download click failed:", e);
        }
        // respok.app: legacy slugs go straight to their renamed page.
        const slug = RESPOK_BUILD && params.slug.startsWith(LEGACY_SLUG_PREFIX)
          ? `respok-${params.slug.slice(LEGACY_SLUG_PREFIX.length)}`
          : params.slug;
        const location = target && /^(https?:\/\/|\/[^/])/i.test(target) ? target : `/download/${slug}`;
        return new Response(null, {
          status: 302,
          headers: { Location: location, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
