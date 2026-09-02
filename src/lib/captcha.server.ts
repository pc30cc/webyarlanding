// کپچای ریاضی فارسی، بی‌حالت (stateless) — فقط سمت سرور.
// برای جلوگیری از ارسال خودکار (اسپم) فرم تماس، بدون نیاز به جدول دیتابیس جدید:
// سؤال + پاسخ + زمان انقضا با HMAC امضا می‌شوند و در قالب یک توکن به کلاینت داده می‌شوند؛
// در تأیید، همان امضا با پاسخ کاربر مقایسه می‌شود.
import { loadPrivateSettings, savePrivateSettings } from "./settings.server";

const CAPTCHA_TTL_MS = 5 * 60_000;
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

/** یک سؤال ریاضی ساده و امضاشده تولید می‌کند */
export async function generateCaptcha(): Promise<CaptchaChallenge> {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const useMinus = Math.random() < 0.5 && a >= b;
  const answer = useMinus ? a - b : a + b;
  const question = `${toPersianDigits(a)} ${useMinus ? "−" : "+"} ${toPersianDigits(b)}`;

  const exp = Date.now() + CAPTCHA_TTL_MS;
  const payload = `${answer}.${exp}`;
  const secret = await loadCaptchaSecret();
  const sig = await hmacHex(secret, payload);
  const token = btoa(`${payload}.${sig}`);
  return { token, question };
}

/** توکن و پاسخ کاربر را تأیید می‌کند */
export async function verifyCaptcha(token: string, userAnswerRaw: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(".");
    if (parts.length !== 3) return false;
    const [answerStr, expStr, sig] = parts as [string, string, string];

    if (Date.now() > Number(expStr)) return false;

    const secret = await loadCaptchaSecret();
    const expectedSig = await hmacHex(secret, `${answerStr}.${expStr}`);
    if (sig !== expectedSig) return false;

    const userAnswer = Number(normalizeDigits(userAnswerRaw));
    if (!Number.isFinite(userAnswer)) return false;

    return Number(answerStr) === userAnswer;
  } catch {
    return false;
  }
}
