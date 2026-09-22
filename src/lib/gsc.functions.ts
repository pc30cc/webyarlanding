import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SeoAuditReport } from "./seoaudit.server";

export interface GscStatusDto {
  keySet: boolean;
  keyEmail: string;
  enabled: boolean;
  property: string;
  autoFix: boolean;
  notifyTelegram: boolean;
  lastRunAt: string;
  lastReport: SeoAuditReport | null;
}

/** وضعیت اتصال سرچ کنسول + آخرین گزارش ذخیره‌شده */
export const getGscStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GscStatusDto> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { loadSettings, loadGscKeys } = await import("./settings.server");
    const [settings, keys] = await Promise.all([loadSettings(), loadGscKeys()]);
    let keyEmail = "";
    if (keys.gscServiceAccountJson) {
      try {
        const { parseServiceAccount } = await import("./gsc.server");
        keyEmail = parseServiceAccount(keys.gscServiceAccountJson).client_email;
      } catch {
        keyEmail = "";
      }
    }
    let lastReport: SeoAuditReport | null = null;
    try {
      lastReport = settings.searchConsole.lastReport
        ? (JSON.parse(settings.searchConsole.lastReport) as SeoAuditReport)
        : null;
    } catch {
      lastReport = null;
    }
    return {
      keySet: !!keys.gscServiceAccountJson,
      keyEmail,
      enabled: settings.searchConsole.enabled,
      property: settings.searchConsole.property,
      autoFix: settings.searchConsole.autoFix,
      notifyTelegram: settings.searchConsole.notifyTelegram,
      lastRunAt: settings.searchConsole.lastRunAt,
      lastReport,
    };
  },
);

/** ذخیره کلید سرویس‌اکانت گوگل (محرمانه، هرگز به کلاینت برنمی‌گردد) */
export const saveGscKey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ json: z.string().optional(), clear: z.boolean().optional().default(false) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; email: string }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveGscKeys } = await import("./settings.server");
    if (data.clear) {
      await saveGscKeys({ gscServiceAccountJson: "" });
      return { ok: true, email: "" };
    }
    if (!data.json?.trim()) throw new Error("محتوای فایل کلید را وارد کنید");
    const { parseServiceAccount } = await import("./gsc.server");
    const sa = parseServiceAccount(data.json);
    await saveGscKeys({ gscServiceAccountJson: data.json });
    return { ok: true, email: sa.client_email };
  });

/** ذخیره تنظیمات بخش سرچ کنسول */
export const saveGscSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enabled: z.boolean(),
        property: z.string().default(""),
        autoFix: z.boolean(),
        notifyTelegram: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { loadSettings, saveSettings } = await import("./settings.server");
    const settings = await loadSettings();
    settings.searchConsole.enabled = data.enabled;
    settings.searchConsole.property = data.property;
    settings.searchConsole.autoFix = data.autoFix;
    settings.searchConsole.notifyTelegram = data.notifyTelegram;
    await saveSettings(settings);
    return { ok: true };
  });

/** فهرست پراپرتی‌های تأییدشده‌ای که این سرویس‌اکانت به آن‌ها دسترسی دارد */
export const listGscProperties = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ siteUrl: string; permissionLevel: string }[]> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { listSites } = await import("./gsc.server");
    return await listSites();
  },
);

/** اجرای بررسی و رفع خودکار مشکلات سئو */
export const runGscAudit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ autoFix: z.boolean().optional().default(true) }).parse(input),
  )
  .handler(async ({ data }): Promise<SeoAuditReport> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { runSeoAudit, formatAuditForTelegram } = await import("./seoaudit.server");
    const report = await runSeoAudit({ autoFix: data.autoFix });
    const { loadSettings } = await import("./settings.server");
    const settings = await loadSettings();
    if (settings.searchConsole.notifyTelegram) {
      const { sendTelegramToAdmins } = await import("./telegram.server");
      await sendTelegramToAdmins(formatAuditForTelegram(report));
    }
    return report;
  });
