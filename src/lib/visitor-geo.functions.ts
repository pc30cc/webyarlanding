import { createServerFn } from "@tanstack/react-start";

/** خزنده‌های موتور جستجو و پیش‌نمایش لینک: قیمت آن‌ها همیشه به ارز زبان صفحه است. */
const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse/i;

/**
 * آیا بازدیدکننده از بیرون ایران است؟ کشور از هدر cf-ipcountry کلادفلر خوانده می‌شود، فقط وقتی
 * درخواست واقعاً از کلادفلر آمده است (client-ip.server.ts). بدون این هدر (اجرای محلی، بدون
 * کلادفلر یا اتصال مستقیم به سرور)، کشور ناشناس (XX) یا شبکه Tor (T1)، و برای خزنده‌ها پاسخ false
 * است تا قیمت‌ها مثل قبل به تومان بمانند.
 */
export function isForeignVisitor(country: string | null | undefined, userAgent: string): boolean {
  const code = (country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "IR" || code === "XX" || code === "T1") return false;
  return !BOT_PATTERN.test(userAgent);
}

/** برای loader صفحه قیمت‌ها؛ روی سرور هدرهای همین درخواست را می‌خواند. */
export const getVisitorForeign = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { requestCloudflareCountry } = await import("./request-ip.server");
    return isForeignVisitor(requestCloudflareCountry(), getRequestHeader("user-agent") ?? "");
  },
);
