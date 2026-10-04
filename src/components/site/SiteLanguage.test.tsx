import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SiteLanguageProvider,
  useSiteTranslation,
  useSiteLocale,
} from "./SiteLanguage";
import { DEFAULT_SETTINGS } from "@/lib/settings";

function Sample() {
  const t = useSiteTranslation();
  const locale = useSiteLocale();
  return (
    <div lang={locale} aria-label={t("باز کردن منو")}>
      <h1>{t("چت زنده")}</h1>
      <p>{t("درباره ما")}</p>
    </div>
  );
}

describe("SSR language context", () => {
  it("renders English on the server before hydration", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.language = "en";
    const html = renderToStaticMarkup(
      <SiteLanguageProvider settings={settings}>
        <Sample />
      </SiteLanguageProvider>,
    );
    expect(html).toContain("Live chat");
    expect(html).toContain('aria-label="Open menu"');
    expect(html).toContain('lang="en-US"');
    expect(html).not.toMatch(/[\u0600-\u06ff]/);
  });
  it("keeps independent English and Persian renders isolated", () => {
    const english = structuredClone(DEFAULT_SETTINGS);
    english.localization.language = "en";
    const en = renderToStaticMarkup(
      <SiteLanguageProvider settings={english}>
        <Sample />
      </SiteLanguageProvider>,
    );
    const fa = renderToStaticMarkup(
      <SiteLanguageProvider settings={DEFAULT_SETTINGS}>
        <Sample />
      </SiteLanguageProvider>,
    );
    expect(en).toContain("Live chat");
    expect(fa).toContain("چت زنده");
  });
});
