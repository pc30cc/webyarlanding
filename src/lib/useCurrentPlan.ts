import { useEffect, useState } from "react";

/**
 * پلن فعلی کاربر لاگین‌شده در اپلیکیشن را از همان API پلن‌ها می‌خواند.
 * اگر کاربر لاگین نباشد، CORS/شبکه خطا بدهد یا آدرس تنظیم نشده باشد،
 * مقدار null برمی‌گردد و صفحه قیمت‌گذاری دقیقاً مثل قبل نمایش داده می‌شود.
 */
export function useCurrentPlanSlug(plansApiUrl: string): string | null {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const url = (plansApiUrl || "").trim().replace(/\/$/, "");
    if (!url) return;
    // https://api.example.com/api/plans  →  https://api.example.com/api
    const base = url.replace(/\/plans$/, "");
    let cancelled = false;

    (async () => {
      try {
        const wsRes = await fetch(`${base}/workspaces`, { credentials: "include" });
        if (!wsRes.ok) return;
        const wsBody = (await wsRes.json()) as { workspaces?: { id?: string }[] };
        const workspaceId = wsBody.workspaces?.[0]?.id;
        if (!workspaceId) return;

        const planRes = await fetch(`${base}/plans/workspace/${workspaceId}`, {
          credentials: "include",
        });
        if (!planRes.ok) return;
        const planBody = (await planRes.json()) as { plan?: { slug?: string } | null };
        const planSlug = planBody.plan?.slug;
        if (!cancelled && planSlug) setSlug(planSlug);
      } catch {
        // بی‌صدا — کاربر مهمان یا در دسترس نبودن اپلیکیشن نباید صفحه را خراب کند
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plansApiUrl]);

  return slug;
}
