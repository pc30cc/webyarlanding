// آپلود فایل به محل ذخیره‌سازی خارجی (بانی سی‌دی‌ان یا ابر آروان) — فقط سمت سرور.
// هیچ باینری تصویری در دیتابیس ذخیره نمی‌شود؛ فقط آدرس عمومی نهایی در media_assets ثبت می‌شود.
import { loadMediaKeys, loadSettings } from "./settings.server";
import type { MediaSettings } from "./settings";
import type { MediaApiKeys } from "./settings.server";

export class StorageError extends Error {}

function base64ToBytes(base64: string): ArrayBuffer {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

function textToBuffer(text: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(text);
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
}

async function uploadToBunny(
  bytes: ArrayBuffer,
  mime: string,
  filename: string,
  media: MediaSettings,
  keys: MediaApiKeys,
): Promise<string> {
  const { storageZone, region, pullZoneUrl } = media.bunny;
  if (!storageZone || !pullZoneUrl || !keys.mediaBunnyAccessKey) {
    throw new StorageError(
      "تنظیمات بانی سی‌دی‌ان کامل نیست — Storage Zone، Pull Zone URL و کلید دسترسی را در تنظیمات عمومی وارد کنید.",
    );
  }
  const host = region ? `${region}.storage.bunnycdn.com` : "storage.bunnycdn.com";
  const res = await fetch(`https://${host}/${storageZone}/${filename}`, {
    method: "PUT",
    headers: {
      AccessKey: keys.mediaBunnyAccessKey,
      "Content-Type": mime,
      // فایل‌ها با نام یکتا (UUID) هرگز بازنویسی نمی‌شوند — کش طولانی‌مدت کاملاً امن است
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StorageError(
      `آپلود به بانی سی‌دی‌ان ناموفق بود: ${res.status} ${text.slice(0, 200)}`,
    );
  }
  return `${pullZoneUrl.replace(/\/$/, "")}/${filename}`;
}

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, textToBuffer(data));
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textToBuffer(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** امضای درخواست PUT/DELETE با AWS Signature v4 برای ذخیره‌سازی سازگار با S3 (ابر آروان) */
async function signArvanRequest(
  method: "PUT" | "DELETE",
  endpoint: string,
  bucket: string,
  key: string,
  region: string,
  accessKey: string,
  secretKey: string,
): Promise<{ url: string; headers: Record<string, string> }> {
  const url = new URL(endpoint);
  const host = url.host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const encodedKey = key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const canonicalUri = `/${bucket}/${encodedKey}`;
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  const kDate = await hmacSha256(textToBuffer(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `${url.origin}${canonicalUri}`,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  };
}

async function uploadToArvan(
  bytes: ArrayBuffer,
  mime: string,
  filename: string,
  media: MediaSettings,
  keys: MediaApiKeys,
): Promise<string> {
  const { bucket, endpoint, region, publicUrl } = media.arvan;
  if (!bucket || !endpoint || !keys.mediaArvanAccessKey || !keys.mediaArvanSecretKey) {
    throw new StorageError(
      "تنظیمات ابر آروان کامل نیست — باکت، آدرس endpoint و کلیدهای دسترسی را در تنظیمات عمومی وارد کنید.",
    );
  }
  const { url, headers } = await signArvanRequest(
    "PUT",
    endpoint,
    bucket,
    filename,
    region || "ir-thr-at1",
    keys.mediaArvanAccessKey,
    keys.mediaArvanSecretKey,
  );
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": mime,
      "x-amz-acl": "public-read",
      // فایل‌ها با نام یکتا (UUID) هرگز بازنویسی نمی‌شوند — کش طولانی‌مدت کاملاً امن است
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StorageError(`آپلود به ابر آروان ناموفق بود: ${res.status} ${text.slice(0, 200)}`);
  }
  const base = (publicUrl || `${endpoint}/${bucket}`).replace(/\/$/, "");
  return `${base}/${filename}`;
}

async function deleteFromBunny(
  path: string,
  media: MediaSettings,
  keys: MediaApiKeys,
): Promise<void> {
  const { storageZone, region } = media.bunny;
  if (!storageZone || !keys.mediaBunnyAccessKey) return;
  const host = region ? `${region}.storage.bunnycdn.com` : "storage.bunnycdn.com";
  const res = await fetch(`https://${host}/${storageZone}/${path}`, {
    method: "DELETE",
    headers: { AccessKey: keys.mediaBunnyAccessKey },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new StorageError(`حذف از بانی سی‌دی‌ان ناموفق بود: ${res.status} ${text.slice(0, 200)}`);
  }
}

async function deleteFromArvan(
  path: string,
  media: MediaSettings,
  keys: MediaApiKeys,
): Promise<void> {
  const { bucket, endpoint, region } = media.arvan;
  if (!bucket || !endpoint || !keys.mediaArvanAccessKey || !keys.mediaArvanSecretKey) return;
  const { url, headers } = await signArvanRequest(
    "DELETE",
    endpoint,
    bucket,
    path,
    region || "ir-thr-at1",
    keys.mediaArvanAccessKey,
    keys.mediaArvanSecretKey,
  );
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new StorageError(`حذف از ابر آروان ناموفق بود: ${res.status} ${text.slice(0, 200)}`);
  }
}

/** حذف یک فایل از محل ذخیره‌سازی خارجی متصل‌شده، بر اساس مسیر ذخیره‌شده در media_assets.path */
export async function deleteStoredImage(path: string): Promise<void> {
  if (!path) return;
  const [settings, keys] = await Promise.all([loadSettings(), loadMediaKeys()]);
  const media = settings.media;

  if (media.provider === "bunny") return deleteFromBunny(path, media, keys);
  if (media.provider === "arvan") return deleteFromArvan(path, media, keys);
}

// اندازه‌گیری واقعی پیج‌اسپید روی سایت زنده نشون داد با ۸۰۰px هم عکس‌ها کمی بزرگ‌تر از
// نیاز واقعی (~۶۴۸px، دقیقاً همون چیزی که پیج‌اسپید اندازه گرفته) دانلود می‌شن؛ ۷۰۰ حاشیه‌ی
// کافی برای رتینا/OG می‌گذارد و این فاصله‌ی باقی‌مانده رو تقریباً می‌بندد.
const COVER_IMAGE_MAX_DIMENSION = 700;
const COVER_IMAGE_JPEG_QUALITY = 82;

/**
 * تصویر ورودی (معمولاً PNG بدون فشرده‌سازی، خروجی هوش مصنوعی) را کوچک و به JPEG فشرده
 * تبدیل می‌کند تا حجم واقعی صفحات سایت — و در نتیجه LCP — به‌شدت کاهش پیدا کند؛ با
 * @cf-wasm/photon که مخصوص اجرا روی Cloudflare Workers ساخته شده (بدون نیاز به Node/sharp).
 * اگر فشرده‌سازی به هر دلیلی شکست بخورد، بایت‌های اصلی بدون تغییر آپلود می‌شوند.
 */
async function compressCoverImage(
  bytes: ArrayBuffer,
  mime: string,
): Promise<{ bytes: ArrayBuffer; mime: string; isJpeg: boolean }> {
  try {
    const { PhotonImage, resize, SamplingFilter } = await import("@cf-wasm/photon");
    const input = PhotonImage.new_from_byteslice(new Uint8Array(bytes));
    try {
      const width = input.get_width();
      const height = input.get_height();
      const scale = Math.min(1, COVER_IMAGE_MAX_DIMENSION / Math.max(width, height));
      const resized =
        scale < 1
          ? resize(
              input,
              Math.round(width * scale),
              Math.round(height * scale),
              SamplingFilter.Lanczos3,
            )
          : input;
      try {
        const jpegBytes = resized.get_bytes_jpeg(COVER_IMAGE_JPEG_QUALITY);
        const buffer = jpegBytes.buffer.slice(
          jpegBytes.byteOffset,
          jpegBytes.byteOffset + jpegBytes.byteLength,
        ) as ArrayBuffer;
        return { bytes: buffer, mime: "image/jpeg", isJpeg: true };
      } finally {
        if (resized !== input) resized.free();
      }
    } finally {
      input.free();
    }
  } catch (e) {
    console.error("compressCoverImage failed, uploading original bytes:", e);
    return { bytes, mime, isJpeg: false };
  }
}

export interface UploadedImage {
  url: string;
  /** مسیر واقعی روی سرویس ذخیره‌سازی — برای ذخیره در media_assets.path و حذف بعدی لازم است */
  path: string;
  mimeType: string;
  sizeBytes: number;
}

/** آپلود مستقیم بایت‌های آماده (بدون فشرده‌سازی) — پایه‌ی مشترک uploadImageDataUrl و recompressStoredImage */
async function uploadRawBytes(
  bytes: ArrayBuffer,
  mime: string,
  filename: string,
): Promise<UploadedImage> {
  const [settings, keys] = await Promise.all([loadSettings(), loadMediaKeys()]);
  const media = settings.media;

  let url: string;
  if (media.provider === "bunny") {
    url = await uploadToBunny(bytes, mime, filename, media, keys);
  } else if (media.provider === "arvan") {
    url = await uploadToArvan(bytes, mime, filename, media, keys);
  } else {
    throw new StorageError(
      "هیچ محل ذخیره‌سازی تصویر متصل نیست — در تنظیمات عمومی → ذخیره‌سازی رسانه، بانی سی‌دی‌ان یا ابر آروان را وصل کنید.",
    );
  }

  return { url, path: filename, mimeType: mime, sizeBytes: bytes.byteLength };
}

/** آپلود یک تصویر base64 به محل ذخیره‌سازی متصل‌شده (پس از فشرده‌سازی) و بازگرداندن مشخصات نهایی */
export async function uploadImageDataUrl(
  dataUrl: string,
  filename: string,
): Promise<UploadedImage> {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new StorageError("قالب تصویر نامعتبر است.");
  const originalMime = match[1] || "image/png";
  const originalBytes = base64ToBytes(match[2]!);

  const { bytes, mime, isJpeg } = await compressCoverImage(originalBytes, originalMime);
  const finalFilename = isJpeg ? filename.replace(/\.[a-zA-Z0-9]+$/, ".jpg") : filename;

  return uploadRawBytes(bytes, mime, finalFilename);
}

export interface RecompressResult {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  oldSizeBytes?: number;
  newSizeBytes?: number;
  newUrl?: string;
}

/**
 * یک تصویر از قبل آپلودشده (media_assets) را دوباره از سرور فعلی‌اش می‌گیرد، تغییر‌اندازه و
 * فشرده می‌کند، در همان محل ذخیره‌سازی با نام جدید آپلود می‌کند، فایل قدیمی را پاک می‌کند،
 * و ردیف media_assets را به‌روزرسانی می‌کند. اگر مقاله‌ای همین آدرس را به‌عنوان کاور دارد،
 * آن هم هم‌زمان به‌روزرسانی می‌شود تا لینک‌ها خراب نشوند.
 */
export async function recompressStoredImage(assetId: string): Promise<RecompressResult> {
  const { db, nowIso } = await import("./db.server");
  const { data: asset } = await db
    .from("media_assets")
    .select("id, path, url, mime_type")
    .eq("id", assetId)
    .maybeSingle();
  if (!asset) return { ok: false, skipped: false, reason: "تصویر یافت نشد" };
  if (!asset.path || /^https?:\/\//i.test(asset.path)) {
    return {
      ok: false,
      skipped: true,
      reason: "این تصویر از یک آدرس خارجی اضافه شده، نه آپلود ما — قابل فشرده‌سازی نیست",
    };
  }

  let originalBytes: ArrayBuffer;
  try {
    const res = await fetch(asset.url);
    if (!res.ok) {
      return { ok: false, skipped: false, reason: `دریافت تصویر فعلی ناموفق بود: ${res.status}` };
    }
    originalBytes = await res.arrayBuffer();
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      reason: e instanceof Error ? e.message : "خطا در دریافت تصویر فعلی",
    };
  }

  const oldSizeBytes = originalBytes.byteLength;
  const { bytes, mime, isJpeg } = await compressCoverImage(
    originalBytes,
    asset.mime_type || "image/png",
  );

  if (!isJpeg || bytes.byteLength >= oldSizeBytes) {
    return {
      ok: false,
      skipped: true,
      reason: "فشرده‌سازی صرفه‌جویی معناداری نداشت",
      oldSizeBytes,
      newSizeBytes: bytes.byteLength,
    };
  }

  const finalFilename = asset.path.replace(/\.[a-zA-Z0-9]+$/, ".jpg");
  const uploaded = await uploadRawBytes(bytes, mime, finalFilename);

  if (finalFilename !== asset.path) {
    try {
      await deleteStoredImage(asset.path);
    } catch (e) {
      console.error("recompressStoredImage: failed to delete old file:", e);
    }
  }

  await db
    .from("media_assets")
    .update({
      path: uploaded.path,
      url: uploaded.url,
      mime_type: uploaded.mimeType,
      size_bytes: uploaded.sizeBytes,
      updated_at: nowIso(),
    })
    .eq("id", assetId);

  // اگر مقاله‌ای همین تصویر را به‌عنوان کاور دارد، لینکش هم به‌روز شود وگرنه شکسته می‌ماند
  await db.from("blog_posts").update({ cover_image: uploaded.url }).eq("cover_image", asset.url);

  return {
    ok: true,
    skipped: false,
    oldSizeBytes,
    newSizeBytes: bytes.byteLength,
    newUrl: uploaded.url,
  };
}
