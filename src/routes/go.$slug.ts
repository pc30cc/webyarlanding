import { createFileRoute } from "@tanstack/react-router";

// ثبت کلیک دانلود و ریدایرکت به لینک واقعی برنامه. /go پیشوند زبان نمی‌گیرد؛ زبان صفحه‌ای که
// لینک از آن کلیک شده با ?l= (یا از Referer) می‌آید تا لینک فروشگاه همان زبان انتخاب شود.
export const Route = createFileRoute("/go/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let target: string | null = null;
        // بدون لینک، صفحه برنامه؛ recordClick زبان آن را از زبان (فعال) صفحه تعیین می‌کند
        let fallback = `/download/${params.slug}`;
        try {
          const { goLinkLocale, recordClick } = await import("@/lib/apps.server");
          ({ target, fallback } = await recordClick(params.slug, {
            referrer: request.headers.get("referer"),
            userAgent: request.headers.get("user-agent"),
            locale: goLinkLocale(request),
          }));
        } catch (e) {
          console.error("download click failed:", e);
        }
        const location = target && /^(https?:\/\/|\/[^/])/i.test(target) ? target : fallback;
        return new Response(null, {
          status: 302,
          headers: { Location: location, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
