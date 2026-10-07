// سرور‌فانکشن‌های بخش «بک‌آپ روی فضای ذخیره‌سازی» پنل مدیریت — فقط برای مدیران.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  return import("./backups.server");
}

export const getBackupCenter = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await admin();
  const [overview, runs] = await Promise.all([mod.backupOverview(), mod.listBackupRuns()]);
  return { ...overview, runs };
});

export const runManualBackup = createServerFn({ method: "POST" }).handler(async () => {
  const mod = await admin();
  return mod.runBackup("manual");
});

const scheduleSchema = z.object({
  dailyEnabled: z.boolean(),
  hourTehran: z.number().int().min(0).max(23),
  retentionDays: z.number().int().min(0).max(365),
  keepMin: z.number().int().min(1).max(100),
  sendToTelegram: z.boolean(),
});

export const saveBackupScheduleFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scheduleSchema.parse(input))
  .handler(async ({ data }) => {
    const mod = await admin();
    return mod.saveBackupSchedule(data);
  });

const idSchema = z.object({ id: z.string().min(1).max(64) });

/** فایل فشرده بک‌آپ را به‌صورت base64 برمی‌گرداند (دانلود از سمت سرور با کلید خصوصی) */
export const downloadBackupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const mod = await admin();
    const { run, bytes } = await mod.fetchBackupBytes(data.id);
    const arr = new Uint8Array(bytes);
    let binary = "";
    for (let i = 0; i < arr.length; i += 0x8000) {
      binary += String.fromCharCode(...arr.subarray(i, i + 0x8000));
    }
    return { filename: run.filename ?? "webyar-backup.json.gz", base64: btoa(binary) };
  });

export const restoreBackupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const mod = await admin();
    return mod.restoreBackupRun(data.id);
  });

export const deleteBackupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const mod = await admin();
    await mod.deleteBackupRun(data.id);
    return { ok: true };
  });
