// قواعد آدرس‌دهی زبان‌ها که هم سرور (src/server.ts) و هم router (src/router.tsx و loaderها)
// از آن استفاده می‌کنند؛ توابع خالص و بدون دسترسی به دیتابیس تا قابل تست باشند.
import {
  isBlogPath,
  isLocalizablePath,
  splitLocalePrefix,
  withLocalePrefix,
  type Locale,
} from "./locales";
import { getActiveLocales, getDefaultLocale, isBlogAvailable, type SiteSettings } from "./settings";

export interface LocaleRedirect {
  location: string;
  status: 301 | 302;
}

/** آدرس فارسی یک مسیر بلاگ (بلاگ فقط فارسی است) */
export function persianBlogPath(settings: SiteSettings, path: string): string {
  return withLocalePrefix(path, getDefaultLocale(settings) === "fa" ? null : "fa");
}

/**
 * ریدایرکت لازم برای یک آدرس عمومی، یا null:
 * - پیشوند زبان پیش‌فرض (مثلاً /fa/… وقتی فارسی پیش‌فرض است) → 301 به آدرس بدون پیشوند
 * - زبانی که فعال نیست → 302 به همان صفحه در زبان پیش‌فرض (موقت، تا فعال‌سازی بعدی کار کند)
 * - در سایت چندزبانه بلاگ فقط فارسی است → 301 به همان مطلب فارسی
 */
export function localeRedirectTarget(
  pathname: string,
  search: string,
  settings: SiteSettings,
): LocaleRedirect | null {
  if (!isLocalizablePath(pathname)) return null;
  const { locale: prefix, path } = splitLocalePrefix(pathname);
  if (!prefix && !isBlogPath(path)) return null;
  // «/fa//evil.com» نباید به «//evil.com» (یک دامنه دیگر) ریدایرکت شود.
  if (/^\/[\\/]/.test(path)) return null;
  const to = (target: string) => target + search;
  const fallback = getDefaultLocale(settings);
  if (prefix === fallback) return { location: to(path), status: 301 };
  if (prefix && !getActiveLocales(settings).includes(prefix))
    return { location: to(path), status: 302 };
  const locale = prefix ?? fallback;
  if (isBlogPath(path) && !isBlogAvailable(settings, locale)) {
    if (!getActiveLocales(settings).includes("fa"))
      return { location: to(withLocalePrefix("/", prefix)), status: 302 };
    return { location: to(persianBlogPath(settings, path)), status: 301 };
  }
  return null;
}

/**
 * rewrite روتر برای صفحه‌ای با پیشوند زبان: پیشوند هنگام خواندن آدرس حذف و هنگام ساختن
 * لینک‌ها اضافه می‌شود (به‌جز مسیرهای بدون پیشوند مثل /admin و فایل‌ها).
 */
export function createLocaleRewrite(prefix: Locale) {
  return {
    input: ({ url }: { url: URL }) => {
      const { locale, path } = splitLocalePrefix(url.pathname);
      if (locale !== prefix) return undefined;
      url.pathname = path;
      return url;
    },
    output: ({ url }: { url: URL }) => {
      if (!isLocalizablePath(url.pathname)) return undefined;
      url.pathname = withLocalePrefix(url.pathname, prefix);
      return url;
    },
  };
}
