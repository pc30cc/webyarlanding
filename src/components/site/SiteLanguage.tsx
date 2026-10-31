import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/settings";
import { LOCALE_INFO, type Locale } from "@/lib/locales";
import { createSiteTranslator, siteI18n, type SiteI18n } from "@/lib/site-i18n";

const defaultValue: SiteI18n = {
  locale: "fa",
  info: LOCALE_INFO.fa,
  translate: createSiteTranslator("fa"),
};
const SiteLanguageContext = createContext<SiteI18n>(defaultValue);

/**
 * زبان صفحه (از آدرس) و مترجم آن برای همه اجزای سایت عمومی. `messages` دیکشنری همان
 * زبان است که loader ریشه بارگذاری می‌کند.
 */
export function SiteLanguageProvider({
  settings,
  locale,
  messages,
  children,
}: {
  settings: SiteSettings;
  locale: Locale;
  messages?: Record<string, string> | undefined;
  children: ReactNode;
}) {
  const value = useMemo(
    () => siteI18n(settings, locale, messages),
    [settings, locale, messages],
  );
  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

/** زبان، اطلاعات زبان و مترجم صفحه */
export function useSiteI18n(): SiteI18n {
  return useContext(SiteLanguageContext);
}

export function useSiteTranslation() {
  return useContext(SiteLanguageContext).translate;
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
