import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// هدرهای امنیتی سطح پایین که بدون ریسک شکستن اسکریپت‌های سفارشی ادمین (آنالیتیکس،
// ویجت چت خارجی) یا نیاز به بازبینی CSP اضافه می‌شوند؛ روی تمام پاسخ‌ها اعمال می‌شود.
function withSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // same-origin-allow-popups (نه same-origin سخت‌گیرانه) چون ویجت چت خارجی ممکن است برای
  // تماس تصویری یا اتصال حساب از پاپ‌آپ استفاده کند و نباید رابطه‌اش با پنجره اصلی قطع شود.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // صفحات HTML هرگز کش نشوند: بعد از هر دیپلوی نام فایل‌های CSS/JS تغییر می‌کند و اگر
  // مرورگر (یا CDN) نسخه‌ی قدیمی HTML را نگه دارد، به فایل‌های حذف‌شده لینک می‌دهد و
  // صفحه بدون استایل و بدون اسکریپت نمایش داده می‌شود.
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/html")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// www → apex ریدایرکت (کنانیکال‌سازی دامنه). این کار در سطح DNS/Cloudflare قابل انجام
// نیست چون www اصلاً رکورد DNS ندارد؛ به‌محض این‌که یک رکورد CNAME برای www در کلودفلر
// اضافه شود (این بخش هنوز نیاز به تنظیم دستی دارد)، این هندلر خودش ریدایرکت ۳۰۱ به دامنه‌ی
// اصلی را انجام می‌دهد — دیگر نیازی به Redirect Rule جداگانه در کلودفلر نیست.
function wwwToApexRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!url.hostname.startsWith("www.")) return null;
  url.hostname = url.hostname.slice("www.".length);
  // request.url گاهی با پروتکل http گزارش می‌شود حتی وقتی خود اتصال https بوده (پشت
  // Cloudflare Workers) — چون این سایت فقط https سرو می‌شود (و HSTS preload دارد)،
  // پروتکل مقصد همیشه صراحتاً https تنظیم می‌شود تا کاربر از یک گام واسط http رد نشود.
  url.protocol = "https:";
  return new Response(null, {
    status: 301,
    headers: { Location: url.toString() },
  });
}

// کرون داخلی (برای دیپلوی خودمیزبان روی Coolify) — فقط یک‌بار و بعد از اولین درخواست
// راه‌اندازی می‌شود تا در محیط‌های بدون پروسه‌ی ماندگار هزینه‌ای نداشته باشد.
let schedulerBooted = false;
function bootScheduler(): void {
  if (schedulerBooted) return;
  schedulerBooted = true;
  void import("./lib/scheduler.server")
    .then((m) => m.startScheduler())
    .catch((error) => console.error("[scheduler] boot failed:", error));
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    bootScheduler();
    const redirect = wwwToApexRedirect(request);
    if (redirect) return withSecurityHeaders(redirect);


    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
