import { createServerFn } from "@tanstack/react-start";
import type { SiteSettings } from "./settings";

/** تنظیمات عمومی سایت — برای رندر سرور و کلاینت */
export const fetchSettings = createServerFn({ method: "GET" }).handler(async (): Promise<SiteSettings> => {
  const { loadSettings } = await import("./settings.server");
  const { brandSafe } = await import("./brand-scrub");
  // Public settings reach the browser; on respok.app they carry no trace of the Persian brand.
  return brandSafe(await loadSettings());
});

/** ذخیره تنظیمات — فقط مدیر */
export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((input: SiteSettings) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { saveSettings } = await import("./settings.server");
    await requireAdmin();
    await saveSettings(data);
    return { ok: true };
  });
