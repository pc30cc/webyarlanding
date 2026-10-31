import { createFileRoute } from "@tanstack/react-router";
import { withLocalePrefix, type Locale } from "@/lib/locales";

// ثبت کلیک دانلود و ریدایرکت به لینک واقعی برنامه. /go پیشوند زبان نمی‌گیرد؛ زبان صفحه‌ای که
// لینک از آن کلیک شده با ?l= (یا از Referer) می‌آید تا لینک فروشگاه همان زبان انتخاب شود.
export const Route = createFileRoute("/go/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let target: string | null = null;
        let locale: Locale | null = null;
        try {
          const { goLinkLocale, recordClick } = await import("@/lib/apps.server");
          locale = goLinkLocale(request);
          target = await recordClick(params.slug, {
            referrer: request.headers.get("referer"),
            userAgent: request.headers.get("user-agent"),
            locale,
          });
        } catch (e) {
          console.error("download click failed:", e);
        }
        // بدون لینک، صفحه برنامه در همان زبان (پیشوند غیرفعال یا پیش‌فرض را server.ts ریدایرکت می‌کند)
        const location =
          target && /^(https?:\/\/|\/[^/])/i.test(target)
            ? target
            : withLocalePrefix(`/download/${params.slug}`, locale);
        return new Response(null, {
          status: 302,
          headers: { Location: location, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
