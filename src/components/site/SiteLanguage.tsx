import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDefaultLocale, type SiteSettings } from "@/lib/settings";
import { LOCALE_INFO, withLocalePrefix, type Locale } from "@/lib/locales";
import { createSiteTranslator, siteI18n, type SiteI18n } from "@/lib/site-i18n";

const defaultValue: SiteI18n = {
  locale: "fa",
  info: LOCALE_INFO.fa,
  translate: createSiteTranslator("fa"),
};
interface SiteLanguageValue extends SiteI18n {
  /** پیشوند آدرس زبان صفحه؛ null برای زبان پیش‌فرض */
  prefix: Locale | null;
}

const SiteLanguageContext = createContext<SiteLanguageValue>({ ...defaultValue, prefix: null });

/**
 * زبان صفحه (از آدرس) و مترجم آن برای همه اجزای سایت عمومی. `messages` دیکشنری همان
 * زبان است که loader ریشه بارگذاری می‌کند و `overrides` ترجمه‌های محتوای ویرایشگر برای همان
 * زبان (از loader ریشه؛ برای فارسی وجود ندارد).
 */
export function SiteLanguageProvider({
  settings,
  locale,
  messages,
  overrides,
  children,
}: {
  settings: SiteSettings;
  locale: Locale;
  messages?: Record<string, string> | undefined;
  overrides?: Record<string, string> | undefined;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      ...siteI18n(settings, locale, messages, overrides),
      prefix: locale === getDefaultLocale(settings) ? null : locale,
    }),
    [settings, locale, messages, overrides],
  );
  return <SiteLanguageContext.Provider value={value}>{children}</SiteLanguageContext.Provider>;
}

/** زبان، اطلاعات زبان و مترجم صفحه */
export function useSiteI18n(): SiteI18n {
  return useContext(SiteLanguageContext);
}

export function useSiteTranslation() {
  return useContext(SiteLanguageContext).translate;
}

/**
 * آدرس داخلی (مثل /contact در تنظیمات ثبت‌نام) را به همان زبان صفحه برمی‌گرداند؛ لینک‌های
 * <Link> خودشان پیشوند می‌گیرند ولی <a href> ساده نه. آدرس‌های بیرونی بدون تغییر می‌مانند.
 */
export function useLocalizeHref(): (href: string) => string {
  const { prefix } = useContext(SiteLanguageContext);
  return (href) =>
    prefix && /^\/(?![\\/])/.test(href) ? withLocalePrefix(href, prefix) : href;
}

/** پیشوند آدرس زبان صفحه (/en، /tr، /ar)؛ null برای زبان پیش‌فرض */
export function useSitePrefix(): Locale | null {
  return useContext(SiteLanguageContext).prefix;
}

/** زبان صفحه: fa | en | tr | ar */
export function useSiteLanguage(): Locale {
  return useContext(SiteLanguageContext).locale;
}

/** جهت متن صفحه */
export function useSiteDir(): "rtl" | "ltr" {
  return useContext(SiteLanguageContext).info.dir;
}

/** برچسب Intl برای قالب‌بندی تاریخ و عدد (مثلاً fa-IR یا en-US) */
export function useSiteLocale() {
  return useContext(SiteLanguageContext).info.intl;
}
