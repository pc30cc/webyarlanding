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
    headers: { ...headers, "Content-Type": mime, "x-amz-acl": "public-read" },
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

/** آپلود یک تصویر base64 به محل ذخیره‌سازی متصل‌شده و بازگرداندن آدرس عمومی نهایی */
export async function uploadImageDataUrl(dataUrl: string, filename: string): Promise<string> {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new StorageError("قالب تصویر نامعتبر است.");
  const mime = match[1] || "image/png";
  const bytes = base64ToBytes(match[2]!);

  const [settings, keys] = await Promise.all([loadSettings(), loadMediaKeys()]);
  const media = settings.media;

  if (media.provider === "bunny") return uploadToBunny(bytes, mime, filename, media, keys);
  if (media.provider === "arvan") return uploadToArvan(bytes, mime, filename, media, keys);

  throw new StorageError(
    "هیچ محل ذخیره‌سازی تصویر متصل نیست — در تنظیمات عمومی → ذخیره‌سازی رسانه، بانی سی‌دی‌ان یا ابر آروان را وصل کنید.",
  );
}
