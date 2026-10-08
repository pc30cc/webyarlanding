import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getEnglishTemplate,
  getRespokBrandName,
  type EnglishTemplate,
  type SiteSettings,
} from "@/lib/settings";
import { useSiteTranslation } from "@/components/site/SiteLanguage";

export interface RespokContextValue {
  settings: SiteSettings;
  template: EnglishTemplate;
  /** "Respok", or the custom English brand name set in the admin panel. */
  brand: string;
  /** Translates editor-managed (database) text: catalog, apps, plans, settings. */
  t: (text: string) => string;
  /** Live chat is always on; calls and AI are shown only when the admin allows them. */
  callEnabled: boolean;
  aiEnabled: boolean;
  /** Absolute site origin without a trailing slash ("" when not configured). */
  siteUrl: string;
}

const RespokContext = createContext<RespokContextValue | null>(null);

export function RespokProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const translate = useSiteTranslation();
  const value = useMemo<RespokContextValue>(
    () => ({
      settings,
      template: getEnglishTemplate(settings),
      brand: getRespokBrandName(settings),
      t: (text: string) => translate(text),
      callEnabled: settings.videoCall.enabled,
      aiEnabled: settings.aiMarketing.enabled,
      siteUrl: (settings.brand.siteUrl || "").replace(/\/$/, ""),
    }),
    [settings, translate],
  );
  return <RespokContext.Provider value={value}>{children}</RespokContext.Provider>;
}

export function useRespok(): RespokContextValue {
  const value = useContext(RespokContext);
  if (!value) throw new Error("useRespok must be used inside <RespokPage>");
  return value;
}
