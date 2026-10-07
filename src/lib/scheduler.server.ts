// زمان‌بند داخلی سرور (برای دیپلوی روی Coolify بدون نیاز به کرون بیرونی).
// هر ۵ دقیقه بیدار می‌شود و کارهای خودکار را در صورت رسیدن موعدشان اجرا می‌کند.
// زمان آخرین اجرا در جدول scheduler_runs ذخیره می‌شود تا ری‌استارت سرور باعث اجرای تکراری نشود.
import { db } from "./db.server";

const TICK_MS = 5 * 60 * 1000;
const AUTOBLOG_MIN_GAP_MS = 55 * 60 * 1000; // حداکثر یک اجرا در هر ساعت
const SEO_MIN_GAP_MS = 20 * 60 * 60 * 1000; // روزانه
const SEO_RUN_HOUR_UTC = 2; // حدود ساعت ۵:۳۰ صبح به وقت ایران

let started = false;
let running = false;

async function getLastRun(job: string): Promise<number> {
  const { data } = await db
    .from("scheduler_runs")
    .select("last_run_at")
    .eq("job", job)
    .maybeSingle();
  const value = (data as { last_run_at?: string } | null)?.last_run_at;
  return value ? new Date(value).getTime() : 0;
}

async function markRun(job: string, status: string, note: string): Promise<void> {
  await db.from("scheduler_runs").upsert(
    {
      job,
      last_run_at: new Date().toISOString(),
      last_status: status.slice(0, 20),
      last_note: note.slice(0, 500),
    },
    { onConflict: "job" },
  );
}

async function tickAutoblog(now: number): Promise<void> {
  const last = await getLastRun("autoblog");
  if (now - last < AUTOBLOG_MIN_GAP_MS) return;

  const { runAutoblog } = await import("./autoblog.server");
  const result = await runAutoblog("cron");
  const skipped = "skipped" in result && result.skipped;
  const reason = "reason" in result ? String(result.reason ?? "") : "";
  // وقتی ساعت انتشار نیست، زمان اجرا را ثبت نمی‌کنیم تا ساعت بعد دوباره بررسی شود.
  if (skipped && reason === "not_scheduled_hour") return;
  await markRun("autoblog", skipped ? "skipped" : "ok", reason);
}

async function tickSeoReview(now: number): Promise<void> {
  if (new Date().getUTCHours() !== SEO_RUN_HOUR_UTC) return;
  const last = await getLastRun("seo_review");
  if (now - last < SEO_MIN_GAP_MS) return;

  const { loadSettings } = await import("./settings.server");
  const settings = await loadSettings();
  if (!settings.searchConsole.enabled) {
    await markRun("seo_review", "skipped", "disabled");
    return;
  }

  const { runSeoReview, formatReviewForTelegram, pruneProposals } = await import(
    "./seoproposals.server"
  );
  const result = await runSeoReview("cron");
  await pruneProposals();
  if (settings.searchConsole.notifyTelegram) {
    const { sendProposalsForApproval } = await import("./telegram.server");
    await sendProposalsForApproval(formatReviewForTelegram(result), result.created);
  }
  await markRun(
    "seo_review",
    result.error ? "failed" : "ok",
    result.error ?? `${result.created.length} پیشنهاد جدید`,
  );
}

/**
 * بک‌آپ روزانه: اگر زمان امروزِ تعیین‌شده (به وقت تهران) گذشته باشد و از آن لحظه هنوز
 * بک‌آپ روزانه‌ای ثبت نشده باشد، اجرا می‌شود — پس اگر سرور سر ساعت خاموش بوده، بعد از
 * بالا آمدن همان روز جبران می‌شود و هرگز دوبار در یک روز اجرا نمی‌شود.
 */
async function tickDailyBackup(now: number): Promise<void> {
  const { loadBackupSchedule, runBackup, tehranHourToUtcMinutes } = await import(
    "./backups.server"
  );
  const schedule = await loadBackupSchedule();
  if (!schedule.dailyEnabled) return;

  const targetMinutes = tehranHourToUtcMinutes(schedule.hourTehran);
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  let due = dayStart.getTime() + targetMinutes * 60_000;
  if (due > now) due -= 24 * 60 * 60 * 1000;

  const last = await getLastRun("daily_backup");
  if (last >= due) return;

  try {
    const run = await runBackup("daily");
    await markRun("daily_backup", "ok", `${run.row_count} رکورد — ${run.filename ?? ""}`);
  } catch (error) {
    // زمان را ثبت می‌کنیم تا در هر تیک دوباره تلاش نشود؛ خطا در تاریخچه بک‌آپ‌ها پیداست
    await markRun("daily_backup", "failed", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  const now = Date.now();
  try {
    await tickAutoblog(now);
  } catch (error) {
    console.error("[scheduler] autoblog failed:", error);
  }
  try {
    await tickSeoReview(now);
  } catch (error) {
    console.error("[scheduler] seo review failed:", error);
  }
  try {
    await tickDailyBackup(now);
  } catch (error) {
    console.error("[scheduler] daily backup failed:", error);
  }
  running = false;
}

export function startScheduler(): void {
  if (started) return;
  // فقط در سرور Node (دیپلوی خودمیزبان) اجرا می‌شود، نه در محیط‌های بدون setInterval پایدار.
  if (typeof setInterval !== "function") return;
  if (process.env["DISABLE_INTERNAL_CRON"] === "1") return;
  started = true;
  console.log("[scheduler] internal cron started");
  const timer = setInterval(() => {
    void tick();
  }, TICK_MS);
  // اجازه بده پروسه در صورت نیاز خارج شود
  (timer as unknown as { unref?: () => void }).unref?.();
  // اولین بررسی کمی بعد از بالا آمدن سرور
  setTimeout(() => void tick(), 60_000);
}
