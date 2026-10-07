// نسخه‌پشتیبان‌گیری دستی و روزانه از دیتابیس و نگه‌داری آن روی فضای ذخیره‌سازی/سی‌دی‌ان
// متصل‌شده در تنظیمات (بانی سی‌دی‌ان یا ابر آروان). فقط سمت سرور.
//
// فرمت فایل: JSON فشرده‌شده با gzip (webyar-backup v1) — شامل همه جدول‌های TABLES، قابل
// بازیابی مستقیم از همین پنل یا از فایل دانلودشده (بخش «بازیابی از فایل JSON» بعد از unzip).
// تاریخچه هر اجرا در جدول backup_runs ثبت می‌شود؛ نسخه‌های قدیمی‌تر از مدت نگه‌داری
// (پیش‌فرض ۱۴ روز) بعد از هر بک‌آپ روزانه از فضای ذخیره‌سازی و دیتابیس پاک می‌شوند.
import { db, databaseBackend, newId, nowIso, parseJson } from "./db.server";
import { TABLES, buildTableExport, performImport } from "./backup.functions";
import { deleteStoredFile, downloadStoredFile, uploadPrivateFile } from "./storage.server";
import { loadSettings } from "./settings.server";

const SCHEDULE_KEY = "backup_schedule";

// جدول backup_runs جدیدتر از types.ts تولیدشده Supabase است
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runsTable = () => (db as any).from("backup_runs");
const BACKUP_DIR = "backups";

export interface BackupSchedule {
  dailyEnabled: boolean;
  /** ساعت اجرای روزانه به وقت تهران (۰ تا ۲۳) */
  hourTehran: number;
  /** نسخه‌های قدیمی‌تر از این تعداد روز خودکار حذف می‌شوند (۰ = هرگز) */
  retentionDays: number;
  /** حداقل تعداد نسخه‌ای که همیشه نگه داشته می‌شود، حتی اگر قدیمی باشد */
  keepMin: number;
}

export const DEFAULT_SCHEDULE: BackupSchedule = {
  dailyEnabled: false,
  hourTehran: 3,
  retentionDays: 14,
  keepMin: 3,
};

export interface BackupRun {
  id: string;
  trigger_source: string;
  status: string;
  provider: string | null;
  path: string | null;
  filename: string | null;
  size_bytes: number | null;
  table_count: number;
  row_count: number;
  checksum: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

/* ───────────── تنظیمات زمان‌بندی ───────────── */

function clampSchedule(value: Partial<BackupSchedule>): BackupSchedule {
  const s = { ...DEFAULT_SCHEDULE, ...value };
  return {
    dailyEnabled: !!s.dailyEnabled,
    hourTehran: Math.min(23, Math.max(0, Math.floor(Number(s.hourTehran) || 0))),
    retentionDays: Math.min(365, Math.max(0, Math.floor(Number(s.retentionDays) || 0))),
    keepMin: Math.min(100, Math.max(1, Math.floor(Number(s.keepMin) || 1))),
  };
}

export async function loadBackupSchedule(): Promise<BackupSchedule> {
  const { data } = await db
    .from("settings")
    .select("setting_value")
    .eq("setting_key", SCHEDULE_KEY)
    .maybeSingle();
  return clampSchedule(parseJson<Partial<BackupSchedule>>(data?.setting_value, {}));
}

export async function saveBackupSchedule(value: Partial<BackupSchedule>): Promise<BackupSchedule> {
  const next = clampSchedule(value);
  const payload = {
    setting_key: SCHEDULE_KEY,
    setting_value: JSON.stringify(next),
    is_private: 1,
    updated_at: nowIso(),
  };
  const { data } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", SCHEDULE_KEY)
    .maybeSingle();
  const { error } = data
    ? await db.from("settings").update(payload).eq("id", data.id)
    : await db.from("settings").insert({ id: newId(), ...payload });
  if (error) throw new Error(error.message);
  return next;
}

/** ساعت تهران → ساعت UTC (تهران از ۱۴۰۱ ساعت تابستانی ندارد: UTC+3:30) */
export function tehranHourToUtcMinutes(hourTehran: number): number {
  return (((hourTehran * 60 - 210) % 1440) + 1440) % 1440;
}

/* ───────────── فشرده‌سازی ───────────── */

async function gzip(bytes: Uint8Array): Promise<ArrayBuffer> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function gunzip(bytes: ArrayBuffer): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BackupFile {
  format: "webyar-backup";
  version: 1;
  generatedAt: string;
  backend: string;
  tables: string[];
  rowCounts: Record<string, number>;
  data: Record<string, Record<string, unknown>[]>;
}

/** از کل دیتابیس یک فایل بک‌آپ فشرده می‌سازد (بدون آپلود) */
export async function buildBackupArchive(): Promise<{
  bytes: ArrayBuffer;
  rowCount: number;
  tableCount: number;
  checksum: string;
}> {
  const data: Record<string, Record<string, unknown>[]> = {};
  const rowCounts: Record<string, number> = {};
  // پشت‌سرهم (نه موازی) تا فشار روی دیتابیس کم بماند
  for (const table of TABLES) {
    const rows = await buildTableExport(table);
    data[table.name] = rows;
    rowCounts[table.name] = rows.length;
  }
  const file: BackupFile = {
    format: "webyar-backup",
    version: 1,
    generatedAt: nowIso(),
    backend: databaseBackend(),
    tables: TABLES.map((t) => t.name),
    rowCounts,
    data,
  };
  const bytes = await gzip(new TextEncoder().encode(JSON.stringify(file)));
  return {
    bytes,
    rowCount: Object.values(rowCounts).reduce((a, b) => a + b, 0),
    tableCount: TABLES.length,
    checksum: await sha256Hex(bytes),
  };
}

/* ───────────── اجرای بک‌آپ ───────────── */

function backupFilename(): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  // پسوند تصادفی: آدرس فایل روی سی‌دی‌ان قابل حدس زدن نباشد
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `webyar-db-${stamp}-${rand}.json.gz`;
}

let inProgress = false;

export async function runBackup(trigger: "manual" | "daily"): Promise<BackupRun> {
  if (inProgress) throw new Error("یک بک‌آپ دیگر در حال اجراست؛ چند لحظه بعد دوباره تلاش کنید");
  inProgress = true;
  const id = newId();
  const startedAt = nowIso();
  await runsTable().insert({
    id,
    trigger_source: trigger,
    status: "running",
    started_at: startedAt,
  });

  try {
    const archive = await buildBackupArchive();
    const filename = backupFilename();
    const stored = await uploadPrivateFile(
      archive.bytes,
      "application/gzip",
      `${BACKUP_DIR}/${filename}`,
    );
    const patch = {
      status: "success",
      provider: stored.provider,
      path: stored.path,
      filename,
      size_bytes: stored.sizeBytes,
      table_count: archive.tableCount,
      row_count: archive.rowCount,
      checksum: archive.checksum,
      finished_at: nowIso(),
    };
    await runsTable().update(patch).eq("id", id);
    if (trigger === "daily")
      await pruneOldBackups().catch((e) => console.error("[backup] prune", e));
    return { id, trigger_source: trigger, error: null, started_at: startedAt, ...patch };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await runsTable()
      .update({ status: "failed", error: message.slice(0, 2000), finished_at: nowIso() })
      .eq("id", id);
    throw new Error(message);
  } finally {
    inProgress = false;
  }
}

export async function listBackupRuns(limit = 60): Promise<BackupRun[]> {
  const { data, error } = await runsTable()
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BackupRun[];
}

async function getRun(id: string): Promise<BackupRun> {
  const { data, error } = await runsTable().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("نسخه پشتیبان پیدا نشد");
  return data as unknown as BackupRun;
}

/** فایل فشرده یک نسخه را از فضای ذخیره‌سازی می‌خواند و صحت checksum را بررسی می‌کند */
export async function fetchBackupBytes(
  id: string,
): Promise<{ run: BackupRun; bytes: ArrayBuffer }> {
  const run = await getRun(id);
  if (run.status !== "success" || !run.provider || !run.path) {
    throw new Error("این نسخه فایل قابل دانلود ندارد");
  }
  const bytes = await downloadStoredFile(run.provider, run.path);
  if (run.checksum && (await sha256Hex(bytes)) !== run.checksum) {
    throw new Error("فایل دریافت‌شده با checksum ثبت‌شده هم‌خوانی ندارد (فایل خراب یا تغییر کرده)");
  }
  return { run, bytes };
}

export async function parseBackupArchive(bytes: ArrayBuffer): Promise<BackupFile> {
  const parsed = JSON.parse(await gunzip(bytes)) as BackupFile;
  if (parsed?.format !== "webyar-backup" || !parsed.data) {
    throw new Error("فرمت فایل نسخه پشتیبان معتبر نیست");
  }
  return parsed;
}

export async function restoreBackupRun(id: string): Promise<{ totalInserted: number }> {
  const { bytes } = await fetchBackupBytes(id);
  const file = await parseBackupArchive(bytes);
  const res = await performImport(file.data as Record<string, unknown[]>);
  return { totalInserted: res.totalInserted };
}

export async function deleteBackupRun(id: string): Promise<void> {
  const run = await getRun(id);
  if (run.provider && run.path) await deleteStoredFile(run.provider, run.path);
  await runsTable().delete().eq("id", id);
}

/** نسخه‌های قدیمی‌تر از مدت نگه‌داری را حذف می‌کند؛ حداقل keepMin نسخه موفق همیشه می‌ماند */
export async function pruneOldBackups(): Promise<number> {
  const schedule = await loadBackupSchedule();
  if (schedule.retentionDays <= 0) return 0;
  const cutoff = Date.now() - schedule.retentionDays * 24 * 60 * 60 * 1000;
  const runs = await listBackupRuns(500);
  const successful = runs.filter((r) => r.status === "success");
  const protectedIds = new Set(successful.slice(0, schedule.keepMin).map((r) => r.id));
  let removed = 0;
  for (const run of runs) {
    if (protectedIds.has(run.id) || run.status === "running") continue;
    if (new Date(run.started_at + (run.started_at.endsWith("Z") ? "" : "Z")).getTime() >= cutoff)
      continue;
    try {
      await deleteBackupRun(run.id);
      removed++;
    } catch (err) {
      console.error(`[backup] could not delete ${run.id}:`, err);
    }
  }
  return removed;
}

/** وضعیت کلی برای پنل: فضای ذخیره‌سازی متصل + نوع دیتابیس فعلی */
export async function backupOverview() {
  const [settings, schedule] = await Promise.all([loadSettings(), loadBackupSchedule()]);
  const provider = settings.media.provider;
  return {
    backend: databaseBackend(),
    storageProvider: provider === "bunny" || provider === "arvan" ? provider : null,
    schedule,
  };
}
