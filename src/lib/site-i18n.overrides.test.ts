import { describe, expect, it } from "vitest";
import {
  SITE_TRANSLATIONS_TTL_MS,
  cachedSiteTranslations,
  freshSiteTranslations,
  i18nFromMatches,
  invalidateSiteTranslations,
  primeSiteTranslations,
  siteI18n,
  siteTranslationsRevision,
} from "./site-i18n";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import englishMessages from "./site-translations.en.json";

function settingsWithLegacyEnglish(): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en", "tr", "ar"];
  settings.localization.english = { "متن سفارشی": "Legacy content" };
  return settings;
}

describe("editor translations per locale", () => {
  const settings = settingsWithLegacyEnglish();

  it("applies each locale's own overrides", () => {
    const tr = siteI18n(settings, "tr", {}, { "متن سفارشی": "Özel içerik" });
    const ar = siteI18n(settings, "ar", {}, { "متن سفارشی": "محتوى مخصص" });
    expect(tr.translate("متن سفارشی")).toBe("Özel içerik");
    expect(ar.translate("متن سفارشی")).toBe("محتوى مخصص");
    // نام برند همچنان لاتین است
    expect(tr.translate(DEFAULT_SETTINGS.brand.name)).toBe("Webyar");
  });

  it("prefers the stored English map over the legacy settings copy", () => {
    const en = siteI18n(settings, "en", englishMessages, { "متن سفارشی": "Row content" });
    expect(en.translate("متن سفارشی")).toBe("Row content");
    // نقشه خالی یعنی ردیف وجود دارد ولی ترجمه‌ای ندارد؛ نسخه قدیمی دیگر خوانده نمی‌شود
    expect(siteI18n(settings, "en", englishMessages, {}).translate("متن سفارشی")).toBe(
      "متن سفارشی",
    );
    // بدون نقشه (مثلاً خواندن ناموفق) ترجمه‌های قدیمی تنظیمات استفاده می‌شوند
    expect(siteI18n(settings, "en", englishMessages).translate("متن سفارشی")).toBe(
      "Legacy content",
    );
  });

  it("never applies the legacy English copy or overrides to other locales or Persian", () => {
    expect(siteI18n(settings, "tr").translate("متن سفارشی")).toBe("متن سفارشی");
    const fa = siteI18n(settings, "fa", {}, { "متن سفارشی": "X" });
    expect(fa.translate("متن سفارشی")).toBe("متن سفارشی");
    expect(fa.translate(DEFAULT_SETTINGS.brand.name)).toBe(DEFAULT_SETTINGS.brand.name);
  });

  it("returns a fresh translator when the map content changes", () => {
    const messages = {};
    const a = siteI18n(settings, "tr", messages, { "متن سفارشی": "A" });
    const same = siteI18n(settings, "tr", messages, { "متن سفارشی": "A" });
    const b = siteI18n(settings, "tr", messages, { "متن سفارشی": "B" });
    expect(same).toBe(a);
    expect(b.translate("متن سفارشی")).toBe("B");
  });
});

describe("translations in head()", () => {
  it("reads the overrides from the root loader data", () => {
    const i18n = i18nFromMatches([
      {
        routeId: "__root__",
        loaderData: {
          settings: DEFAULT_SETTINGS,
          locale: "ar",
          messages: {},
          overrides: { "چت زنده": "دردشة مباشرة" },
        },
      },
    ]);
    expect(i18n?.translate("چت زنده")).toBe("دردشة مباشرة");
  });

  it("falls back to the process cache before the root loader data exists", () => {
    const settings = settingsWithLegacyEnglish();
    primeSiteTranslations("tr", { "چت زنده": "Canlı sohbet" });
    const i18n = i18nFromMatches(
      [{ routeId: "__root__", loaderData: undefined }],
      { context: { urlLocale: "tr" } },
      { settings },
    );
    expect(i18n?.locale).toBe("tr");
    expect(i18n?.translate("چت زنده")).toBe("Canlı sohbet");
    // صفحه فارسی هیچ ترجمه‌ای نمی‌گیرد
    const fa = i18nFromMatches([], { context: { urlLocale: null } }, { settings });
    expect(fa?.translate("چت زنده")).toBe("چت زنده");
  });
});

describe("translations cache", () => {
  it("expires after the TTL and after an admin save, but stays readable for head()", () => {
    const map = { a: "A" };
    primeSiteTranslations("en", map, siteTranslationsRevision(), 1_000);
    expect(freshSiteTranslations("en", 1_000 + SITE_TRANSLATIONS_TTL_MS - 1)).toBe(map);
    expect(freshSiteTranslations("en", 1_000 + SITE_TRANSLATIONS_TTL_MS)).toBeUndefined();
    primeSiteTranslations("en", { a: "B" }, siteTranslationsRevision(), 5_000);
    invalidateSiteTranslations();
    expect(freshSiteTranslations("en", 5_001)).toBeUndefined();
    expect(cachedSiteTranslations("en")).toEqual({ a: "B" });
  });

  it("treats a map read before a save as stale", () => {
    const revision = siteTranslationsRevision();
    invalidateSiteTranslations(); // مدیر در حین خواندن ذخیره کرد
    primeSiteTranslations("ar", { a: "old" }, revision, 1_000);
    expect(freshSiteTranslations("ar", 1_001)).toBeUndefined();
    expect(cachedSiteTranslations("ar")).toEqual({ a: "old" });
  });

  it("does not extend the TTL when the same map is primed again", () => {
    const map = { a: "A" };
    primeSiteTranslations("tr", map, siteTranslationsRevision(), 1_000);
    primeSiteTranslations("tr", map, siteTranslationsRevision(), 1_000 + SITE_TRANSLATIONS_TTL_MS);
    expect(freshSiteTranslations("tr", 1_000 + SITE_TRANSLATIONS_TTL_MS)).toBeUndefined();
  });

  it("never caches Persian", () => {
    primeSiteTranslations("fa", { a: "A" });
    expect(cachedSiteTranslations("fa")).toBeUndefined();
    expect(freshSiteTranslations("fa")).toEqual({});
  });
});
