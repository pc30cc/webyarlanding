import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface MediaAssetDto {
  id: string;
  filename: string;
  url: string;
  path: string;
  provider: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

export const listMedia = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaAssetDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data } = await db
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []).map((row) => ({
      id: row.id,
      filename: row.filename,
      url: row.url,
      path: row.path,
      provider: row.provider,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      alt: row.alt,
      createdAt: row.created_at,
    }));
  },
);

const mediaSchema = z.object({
  filename: z.string().min(1, "نام فایل الزامی است"),
  url: z.string().min(1, "آدرس الزامی است"),
  alt: z.string().optional().default(""),
  provider: z.string().optional().default("external"),
});

export const saveMediaAsset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => mediaSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, newId } = await import("./db.server");
    const user = await requireAdmin();
    const id = newId();
    await db.from("media_assets").insert({
      id,
      filename: data.filename,
      path: data.url,
      url: data.url,
      provider: data.provider,
      alt: data.alt,
      uploaded_by: user.id,
    });
    return { ok: true, id };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data: asset } = await db
      .from("media_assets")
      .select("path")
      .eq("id", data.id)
      .maybeSingle();
    // path فقط وقتی کلید ذخیره‌سازی داخلیه (نه یک URL خارجی که کاربر دستی ثبت کرده) پاک می‌شود
    if (asset?.path && !/^https?:\/\//i.test(asset.path)) {
      try {
        const { deleteStoredImage } = await import("./storage.server");
        await deleteStoredImage(asset.path);
      } catch (e) {
        console.error("deleteMedia: failed to delete from storage:", e);
      }
    }
    await db.from("media_assets").delete().eq("id", data.id);
    return { ok: true };
  });

export interface RecompressMediaResult {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  oldSizeBytes?: number;
  newSizeBytes?: number;
}

/** فشرده‌سازی مجدد یک تصویر مشخص از رسانه‌ها (دستی، از دکمه زیر هر عکس) */
export const adminRecompressMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<RecompressMediaResult> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { recompressStoredImage } = await import("./storage.server");
    return await recompressStoredImage(data.id);
  });

export interface CompressAllMediaResult {
  totalCandidates: number;
  processed: number;
  compressed: number;
  skipped: number;
  failed: number;
  savedBytes: number;
  hasMore: boolean;
}

const COMPRESS_ALL_BATCH_LIMIT = 25;
const COMPRESS_ALL_TIME_BUDGET_MS = 20_000;
/** تصاویر کوچک‌تر از این حد را دست نمی‌زنیم — احتمالاً از قبل فشرده هستند */
const RECOMPRESS_SIZE_THRESHOLD_BYTES = 150_000;

/** فشرده‌سازی دسته‌ای همه‌ی تصاویر موجود (بزرگ‌تر از حد آستانه) — برای اجرای یک‌باره روی رسانه‌های قدیمی */
export const adminCompressAllMedia = createServerFn({ method: "POST" }).handler(
  async (): Promise<CompressAllMediaResult> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { db } = await import("./db.server");
    const { recompressStoredImage } = await import("./storage.server");

    const { data } = await db
      .from("media_assets")
      .select("id, path, size_bytes")
      .order("size_bytes", { ascending: false })
      .limit(500);

    const candidates = (data ?? []).filter(
      (row) =>
        row.path &&
        !/^https?:\/\//i.test(row.path) &&
        (row.size_bytes ?? 0) >= RECOMPRESS_SIZE_THRESHOLD_BYTES,
    );

    const result: CompressAllMediaResult = {
      totalCandidates: candidates.length,
      processed: 0,
      compressed: 0,
      skipped: 0,
      failed: 0,
      savedBytes: 0,
      hasMore: false,
    };

    const startedAt = Date.now();
    for (const row of candidates) {
      if (
        result.processed >= COMPRESS_ALL_BATCH_LIMIT ||
        Date.now() - startedAt > COMPRESS_ALL_TIME_BUDGET_MS
      ) {
        result.hasMore = true;
        break;
      }
      result.processed += 1;
      const outcome = await recompressStoredImage(row.id);
      if (outcome.ok) {
        result.compressed += 1;
        result.savedBytes += (outcome.oldSizeBytes ?? 0) - (outcome.newSizeBytes ?? 0);
      } else if (outcome.skipped) {
        result.skipped += 1;
      } else {
        result.failed += 1;
      }
    }

    return result;
  },
);

function maskMediaKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(6)}${key.slice(-4)}`;
}

/** وضعیت کلیدهای اتصال به محل ذخیره‌سازی — مقدار واقعی کلید هرگز به کلاینت برنمی‌گردد */
export const adminGetMediaKeysStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadMediaKeys } = await import("./settings.server");
  const keys = await loadMediaKeys();
  return {
    bunnyKeySet: !!keys.mediaBunnyAccessKey,
    bunnyKeyPreview: maskMediaKey(keys.mediaBunnyAccessKey),
    arvanAccessKeySet: !!keys.mediaArvanAccessKey,
    arvanAccessKeyPreview: maskMediaKey(keys.mediaArvanAccessKey),
    arvanSecretKeySet: !!keys.mediaArvanSecretKey,
    arvanSecretKeyPreview: maskMediaKey(keys.mediaArvanSecretKey),
  };
});

const saveMediaKeysSchema = z.object({
  bunnyAccessKey: z.string().optional(),
  arvanAccessKey: z.string().optional(),
  arvanSecretKey: z.string().optional(),
  clearBunny: z.boolean().optional().default(false),
  clearArvan: z.boolean().optional().default(false),
});

/** ذخیره یا حذف کلیدهای اتصال به محل ذخیره‌سازی — مقدار خالی/نامشخص به‌معنای «بدون تغییر» است */
export const adminSaveMediaKeys = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveMediaKeysSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveMediaKeys } = await import("./settings.server");
    const partial: {
      mediaBunnyAccessKey?: string;
      mediaArvanAccessKey?: string;
      mediaArvanSecretKey?: string;
    } = {};
    if (data.clearBunny) partial.mediaBunnyAccessKey = "";
    else if (data.bunnyAccessKey) partial.mediaBunnyAccessKey = data.bunnyAccessKey;
    if (data.clearArvan) {
      partial.mediaArvanAccessKey = "";
      partial.mediaArvanSecretKey = "";
    } else {
      if (data.arvanAccessKey) partial.mediaArvanAccessKey = data.arvanAccessKey;
      if (data.arvanSecretKey) partial.mediaArvanSecretKey = data.arvanSecretKey;
    }
    await saveMediaKeys(partial);
    return { ok: true };
  });
