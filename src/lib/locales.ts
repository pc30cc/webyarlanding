// زبان‌های سایت عمومی و آدرس‌دهی آن‌ها — مشترک بین کلاینت و سرور.
// زبان پیش‌فرض بدون پیشوند روی ریشه است (webyar.ai/pricing) و بقیه با پیشوند
// (webyar.ai/en/pricing). زبان هر صفحه فقط از آدرس آن تعیین می‌شود، نه کوکی یا مرورگر،
// تا کش Cloudflare و موتورهای جستجو هر نسخه را جدا ببینند.

export type Locale = "fa" | "en" | "tr" | "ar";

/** ترتیب ثابت زبان‌ها (در پنل، سایت‌مپ و hreflang) */
export const LOCALES: readonly Locale[] = ["fa", "en", "tr", "ar"];

export interface LocaleInfo {
  code: Locale;
  /** نام زبان به خود آن زبان (برای انتخابگر زبان) */
  nativeName: string;
  /** نام فارسی زبان (برای پنل مدیریت) */
  adminName: string;
  dir: "rtl" | "ltr";
  /** مقدار og:locale */
  ogLocale: string;
  /**
   * برچسب Intl برای تاریخ و عدد. سیستم عددنویسی صریح است تا سرور و مرورگر (با داده‌های
   * ICU متفاوت) خروجی یکسان بدهند و hydration به هم نخورد.
   */
  intl: string;
  /** ارز قیمت‌ها: فارسی به تومان، بقیه به دلار */
  currency: "IRT" | "USD";
  /** جداکننده‌های فهرست برای ترجمه متن‌هایی که با joinFa ساخته شده‌اند */
  listSeparator: string;
  listAnd: string;
  /** جداکننده هزارگان و اعشار برای اعداد فارسیِ ترجمه‌شده */
  groupSeparator: string;
  decimalSeparator: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  fa: {
    code: "fa",
    nativeName: "فارسی",
    adminName: "فارسی",
    dir: "rtl",
    ogLocale: "fa_IR",
    intl: "fa-IR",
    currency: "IRT",
    listSeparator: "، ",
    listAnd: " و ",
    groupSeparator: "٬",
    decimalSeparator: "٫",
  },
  en: {
    code: "en",
    nativeName: "English",
    adminName: "انگلیسی",
    dir: "ltr",
    ogLocale: "en_US",
    intl: "en-US",
    currency: "USD",
    listSeparator: ", ",
    listAnd: " and ",
    groupSeparator: ",",
    decimalSeparator: ".",
  },
  tr: {
    code: "tr",
    nativeName: "Türkçe",
    adminName: "ترکی",
    dir: "ltr",
    ogLocale: "tr_TR",
    intl: "tr-TR",
    currency: "USD",
    listSeparator: ", ",
    listAnd: " ve ",
    groupSeparator: ".",
    decimalSeparator: ",",
  },
  ar: {
    code: "ar",
    nativeName: "العربية",
    adminName: "عربی",
    dir: "rtl",
    ogLocale: "ar_AR",
    // ارقام لاتین (123) به انتخاب مدیر سایت؛ ارقام فارسی (۴۵۶) با عربی (٤٥٦) فرق دارند.
    intl: "ar-u-nu-latn",
    currency: "USD",
    listSeparator: "، ",
    listAnd: " و",
    groupSeparator: ",",
    decimalSeparator: ".",
  },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * مسیرهایی که هیچ‌وقت پیشوند زبان نمی‌گیرند: پنل مدیریت، APIها، توابع سرور، فایل‌های
 * ثابت (هر مسیری که بخش آخرش پسوند دارد) و مسیرهای فنی.
 */
const UNPREFIXED = /^\/(?:admin|admin-login|api|api-docs|go|healthz|_serverFn|cdn-cgi)(?:\/|$)/;

export function isLocalizablePath(pathname: string): boolean {
  if (UNPREFIXED.test(pathname)) return false;
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  return !last.includes(".");
}

/** /en/pricing → { locale: "en", path: "/pricing" }؛ بدون پیشوند → locale: null */
export function splitLocalePrefix(pathname: string): {
  locale: Locale | null;
  path: string;
} {
  const match = /^\/([a-z]{2})(?=\/|$)/.exec(pathname);
  if (!match || !isLocale(match[1])) return { locale: null, path: pathname };
  const path = pathname.slice(match[0].length) || "/";
  if (!isLocalizablePath(path)) return { locale: null, path: pathname };
  return { locale: match[1], path };
}

/** مسیر داخلی را با پیشوند زبان برمی‌گرداند؛ prefix خالی یعنی زبان پیش‌فرض. */
export function withLocalePrefix(path: string, prefix: Locale | null): string {
  if (!prefix || !isLocalizablePath(path)) return path;
  return path === "/" ? `/${prefix}` : `/${prefix}${path}`;
}

/** مسیرهای بلاگ؛ بلاگ فقط فارسی است و در سایت چندزبانه فقط در نسخه فارسی وجود دارد. */
export function isBlogPath(path: string): boolean {
  return /^\/(?:blog|tag)(?:\/|$)/.test(path);
}
