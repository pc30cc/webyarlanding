import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/settings";
import {
  createSiteTranslator,
  getSiteLanguage,
  translatorForSettings,
  type SiteLanguage,
} from "@/lib/site-i18n";

const defaultValue = {
  language: "fa" as SiteLanguage,
  translate: createSiteTranslator("fa"),
};
const SiteLanguageContext = createContext(defaultValue);

export function SiteLanguageProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const language = getSiteLanguage(settings);
  const value = useMemo(
    () => ({
      language,
      translate: translatorForSettings(settings),
    }),
    [language, settings],
  );
  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteTranslation() {
  return useContext(SiteLanguageContext).translate;
}

export function useSiteLocale() {
  return useContext(SiteLanguageContext).language === "en" ? "en-US" : "fa-IR";
}
