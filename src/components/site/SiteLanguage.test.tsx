import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SiteLanguageProvider,
  useSiteDir,
  useSiteLanguage,
  useSiteTranslation,
  useSiteLocale,
} from "./SiteLanguage";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import messages from "@/lib/site-translations.en.json";

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

function Direction() {
  const t = useSiteTranslation();
  return (
    <section data-locale={useSiteLanguage()} dir={useSiteDir()} lang={useSiteLocale()}>
      {t(DEFAULT_SETTINGS.brand.name)}
    </section>
  );
}

describe("SSR language context", () => {
  it("renders English on the server before hydration", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.language = "en";
    const html = renderToStaticMarkup(
      <SiteLanguageProvider settings={settings} locale="en" messages={messages}>
        <Sample />
      </SiteLanguageProvider>,
    );
    expect(html).toContain("Live chat");
    expect(html).toContain('aria-label="Open menu"');
    expect(html).toContain('lang="en-US"');
    expect(html).not.toMatch(/[؀-ۿ]/);
  });
  it("keeps independent English and Persian renders isolated", () => {
    const english = structuredClone(DEFAULT_SETTINGS);
    english.localization.language = "en";
    const en = renderToStaticMarkup(
      <SiteLanguageProvider settings={english} locale="en" messages={messages}>
        <Sample />
      </SiteLanguageProvider>,
    );
    const fa = renderToStaticMarkup(
      <SiteLanguageProvider settings={DEFAULT_SETTINGS} locale="fa" messages={{}}>
        <Sample />
      </SiteLanguageProvider>,
    );
    expect(en).toContain("Live chat");
    expect(fa).toContain("چت زنده");
    expect(fa).toContain('lang="fa-IR"');
  });
  it("takes the page language from the provider, not the site default", () => {
    // سایت فارسی با نسخه انگلیسی: صفحه /en انگلیسی است، تنظیمات همان تنظیمات فارسی
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.mode = "multi";
    settings.localization.locales = ["fa", "en"];
    const html = renderToStaticMarkup(
      <SiteLanguageProvider settings={settings} locale="en" messages={messages}>
        <Sample />
      </SiteLanguageProvider>,
    );
    expect(html).toContain("Live chat");
    expect(html).toContain('lang="en-US"');
    expect(html).not.toMatch(/[؀-ۿ]/);
  });
  it("gives each locale its own direction and Intl tag", () => {
    const render = (locale: "fa" | "en" | "tr" | "ar") =>
      renderToStaticMarkup(
        <SiteLanguageProvider settings={DEFAULT_SETTINGS} locale={locale} messages={{}}>
          <Direction />
        </SiteLanguageProvider>,
      );
    expect(render("fa")).toBe('<section data-locale="fa" dir="rtl" lang="fa-IR">وب‌یار</section>');
    expect(render("en")).toBe('<section data-locale="en" dir="ltr" lang="en-US">Webyar</section>');
    expect(render("tr")).toBe('<section data-locale="tr" dir="ltr" lang="tr-TR">Webyar</section>');
    expect(render("ar")).toBe(
      '<section data-locale="ar" dir="rtl" lang="ar-u-nu-latn">Webyar</section>',
    );
  });
});
