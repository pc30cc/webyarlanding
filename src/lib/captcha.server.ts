// کپچای ریاضی فارسی — فقط سمت سرور.
// برای جلوگیری از ارسال خودکار (اسپم) فرم تماس، بدون نیاز به جدول دیتابیس جدید. توکن فقط شناسه
// تصادفی (nonce)، زمان انقضا و دو امضای HMAC دارد: یکی برای اصالت توکن و یکی برای «همین nonce با
// همین پاسخ». خود پاسخ هیچ‌جا در توکن نیست، پس از روی توکن خوانده نمی‌شود. هر توکن یک بار مصرف
// می‌شود (درست یا غلط)، پس نمی‌توان با یک توکن همه پاسخ‌ها را امتحان کرد.
//
// محدودیت: سؤال متنی ریاضی را یک ربات می‌تواند بخواند و حل کند؛ این کپچا فقط ارسال‌های ساده را
// می‌گیرد. برای فرم‌های پرخطر Cloudflare Turnstile یا مشابه آن بهتر است.
import { loadPrivateSettings, savePrivateSettings } from "./settings.server";

const CAPTCHA_TTL_MS = 5 * 60_000;
const TOKEN_VERSION = "v2";
/** سقف nonceهای مصرف‌شده در حافظه؛ وقتی پر شود قدیمی‌ترین‌ها کنار می‌روند. */
const MAX_CONSUMED = 100_000;
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** تبدیل ارقام فارسی/عربی که کاربر ممکن است تایپ کند به ارقام لاتین برای پردازش */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim();
}

async function loadCaptchaSecret(): Promise<string> {
  const stored = await loadPrivateSettings<Record<string, unknown>>({});
  if (typeof stored["captchaSecret"] === "string" && stored["captchaSecret"]) {
    return stored["captchaSecret"];
  }
  const secret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await savePrivateSettings({ ...stored, captchaSecret: secret });
  return secret;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface CaptchaChallenge {
  token: string;
  /** سؤال به فارسی، مثل «۳ + ۵» — کاربر باید پاسخ عددی را وارد کند */
  question: string;
}

function randomNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

/** مقایسه با زمان ثابت دو رشته هگز هم‌طول */
function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** nonceهای مصرف‌شده تا زمان انقضایشان (یک بار مصرف). در حافظه همین پروسه. */
const consumed = new Map<string, number>();
let lastPrune = 0;

/** nonce را مصرف می‌کند؛ اگر قبلاً مصرف شده بود false برمی‌گرداند. */
function consumeNonce(nonce: string, exp: number, now: number): boolean {
  if (consumed.has(nonce)) return false;
  if (now - lastPrune > 60_000) {
    lastPrune = now;
    for (const [key, keyExp] of consumed) if (keyExp < now) consumed.delete(key);
  }
  while (consumed.size >= MAX_CONSUMED) {
    const oldest = consumed.keys().next();
    if (oldest.done) break;
    consumed.delete(oldest.value);
  }
  consumed.set(nonce, exp);
  return true;
}

/** فقط برای تست */
export function __resetCaptchaForTests(): void {
  consumed.clear();
  lastPrune = 0;
}

/** یک سؤال ریاضی ساده و امضاشده تولید می‌کند */
export async function generateCaptcha(): Promise<CaptchaChallenge> {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const useMinus = Math.random() < 0.5 && a >= b;
  const answer = useMinus ? a - b : a + b;
  const question = `${toPersianDigits(a)} ${useMinus ? "−" : "+"} ${toPersianDigits(b)}`;

  const nonce = randomNonce();
  const exp = Date.now() + CAPTCHA_TTL_MS;
  const secret = await loadCaptchaSecret();
  const tag = await hmacHex(secret, `${TOKEN_VERSION}.token.${nonce}.${exp}`);
  const check = await hmacHex(secret, `${TOKEN_VERSION}.answer.${nonce}.${exp}.${answer}`);
  const token = toBase64Url(`${TOKEN_VERSION}.${nonce}.${exp}.${tag}.${check}`);
  return { token, question };
}

/** توکن و پاسخ کاربر را تأیید می‌کند. هر توکن فقط یک بار پذیرفته می‌شود. */
export async function verifyCaptcha(token: string, userAnswerRaw: string): Promise<boolean> {
  try {
    const parts = fromBase64Url(token).split(".");
    if (parts.length !== 5) return false;
    const [version, nonce, expStr, tag, check] = parts as [string, string, string, string, string];
    if (version !== TOKEN_VERSION || !/^[0-9a-f]{32}$/.test(nonce) || !/^\d{1,15}$/.test(expStr)) {
      return false;
    }
    const exp = Number(expStr);
    const now = Date.now();
    if (now > exp || exp > now + CAPTCHA_TTL_MS) return false;

    const secret = await loadCaptchaSecret();
    // اصالت توکن پیش از ذخیره nonce: توکن ساختگی جایی در حافظه نمی‌گیرد.
    if (!sameHex(tag, await hmacHex(secret, `${TOKEN_VERSION}.token.${nonce}.${exp}`)))
      return false;
    if (!consumeNonce(nonce, exp, now)) return false;

    const normalized = normalizeDigits(userAnswerRaw);
    if (!/^-?\d{1,3}$/.test(normalized)) return false;
    const userAnswer = Number(normalized);
    const expected = await hmacHex(secret, `${TOKEN_VERSION}.answer.${nonce}.${exp}.${userAnswer}`);
    return sameHex(check, expected);
  } catch {
    return false;
  }
}
