import { describe, expect, it } from "vitest";
import {
  LOCALES,
  LOCALE_INFO,
  isBlogPath,
  isLocale,
  isLocalizablePath,
  splitLocalePrefix,
  withLocalePrefix,
  type Locale,
} from "./locales";
import {
  DEFAULT_SETTINGS,
  getActiveLocales,
  getDefaultLocale,
  isEnglishChrome,
  mergeSettings,
  pageContentLocale,
  resolvePageLocale,
  type SiteSettings,
} from "./settings";
import {
  createSiteTranslator,
  getSiteLanguage,
  i18nFromMatches,
  localizeStructuredData,
  siteI18n,
} from "./site-i18n";
import englishMessages from "./site-translations.en.json";

/** تنظیمات پیش‌فرض با زبان پیش‌فرض و زبان‌های فعال دلخواه */
function siteWith(language: Locale, locales?: Locale[]): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  if (locales) {
    settings.localization.mode = "multi";
    settings.localization.locales = locales;
  }
  return settings;
}

describe("locale URLs", () => {
  it("knows the supported locales", () => {
    expect(LOCALES).toEqual(["fa", "en", "tr", "ar"]);
    for (const locale of LOCALES) {
      expect(isLocale(locale)).toBe(true);
      expect(LOCALE_INFO[locale].code).toBe(locale);
    }
    for (const value of ["xx", "EN", "fa-IR", "", null, undefined, 1]) {
      expect(isLocale(value)).toBe(false);
    }
    expect(LOCALE_INFO.fa.dir).toBe("rtl");
    expect(LOCALE_INFO.en.dir).toBe("ltr");
    expect(LOCALE_INFO.tr.dir).toBe("ltr");
    expect(LOCALE_INFO.ar.dir).toBe("rtl");
  });

  it("splits the locale prefix off public paths", () => {
    expect(splitLocalePrefix("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocalePrefix("/en/")).toEqual({ locale: "en", path: "/" });
    expect(splitLocalePrefix("/en/pricing")).toEqual({ locale: "en", path: "/pricing" });
    expect(splitLocalePrefix("/tr/products/chat")).toEqual({
      locale: "tr",
      path: "/products/chat",
    });
    expect(splitLocalePrefix("/ar/blog/post")).toEqual({ locale: "ar", path: "/blog/post" });
    // پیشوند زبان پیش‌فرض هم شناخته می‌شود (سرور آن را به آدرس بدون پیشوند ریدایرکت می‌کند)
    expect(splitLocalePrefix("/fa")).toEqual({ locale: "fa", path: "/" });
    expect(splitLocalePrefix("/fa/pricing")).toEqual({ locale: "fa", path: "/pricing" });
  });

  it("leaves unprefixed paths and unknown codes alone", () => {
    expect(splitLocalePrefix("/")).toEqual({ locale: null, path: "/" });
    expect(splitLocalePrefix("/pricing")).toEqual({ locale: null, path: "/pricing" });
    expect(splitLocalePrefix("/xx")).toEqual({ locale: null, path: "/xx" });
    expect(splitLocalePrefix("/xx/pricing")).toEqual({ locale: null, path: "/xx/pricing" });
    expect(splitLocalePrefix("/english")).toEqual({ locale: null, path: "/english" });
    expect(splitLocalePrefix("/EN/pricing")).toEqual({ locale: null, path: "/EN/pricing" });
  });

  it("never localizes the admin panel, APIs or files", () => {
    for (const path of [
      "/admin",
      "/admin/settings",
      "/admin-login",
      "/api/plans",
      "/api-docs",
      "/go/telegram",
      "/healthz",
      "/_serverFn/abc",
      "/cdn-cgi/trace",
      "/favicon.svg",
      "/robots.txt",
      "/sitemap.xml",
      "/fonts/vazirmatn.woff2",
    ]) {
      expect(isLocalizablePath(path), path).toBe(false);
      expect(withLocalePrefix(path, "en"), path).toBe(path);
      expect(splitLocalePrefix("/en" + path), path).toEqual({ locale: null, path: "/en" + path });
    }
    for (const path of ["/", "/pricing", "/blog/some-post", "/administrator", "/apis"]) {
      expect(isLocalizablePath(path), path).toBe(true);
    }
  });

  it("adds the locale prefix and round-trips", () => {
    expect(withLocalePrefix("/", "en")).toBe("/en");
    expect(withLocalePrefix("/pricing", "en")).toBe("/en/pricing");
    expect(withLocalePrefix("/pricing", "ar")).toBe("/ar/pricing");
    expect(withLocalePrefix("/", null)).toBe("/");
    expect(withLocalePrefix("/pricing", null)).toBe("/pricing");
    for (const locale of LOCALES) {
      for (const path of ["/", "/pricing", "/products/chat", "/blog/post"]) {
        expect(splitLocalePrefix(withLocalePrefix(path, locale))).toEqual({ locale, path });
      }
    }
  });

  it("recognizes blog paths", () => {
    expect(isBlogPath("/blog")).toBe(true);
    expect(isBlogPath("/blog/post")).toBe(true);
    expect(isBlogPath("/tag/crm")).toBe(true);
    expect(isBlogPath("/blogger")).toBe(false);
    expect(isBlogPath("/pricing")).toBe(false);
  });
});

describe("locale settings", () => {
  it("defaults to a single-language Persian site", () => {
    const settings = mergeSettings(null);
    expect(settings.localization).toMatchObject({
      language: "fa",
      mode: "single",
      locales: ["fa"],
      english: {},
    });
    expect(getDefaultLocale(settings)).toBe("fa");
    expect(getSiteLanguage(settings)).toBe("fa");
    expect(getActiveLocales(settings)).toEqual(["fa"]);
  });

  it("normalizes stored mode and locales", () => {
    const settings = mergeSettings({
      localization: {
        language: "fa",
        mode: "multi",
        locales: ["ar", "xx", "en", "en", "fa-IR"] as Locale[],
        english: { متن: "Text" },
      },
    });
    // کدهای نامعتبر حذف، تکراری‌ها یکی و ترتیب ثابت LOCALES؛ زبان پیش‌فرض همیشه هست
    expect(settings.localization.locales).toEqual(["fa", "en", "ar"]);
    expect(settings.localization.mode).toBe("multi");
    expect(settings.localization.english).toEqual({ متن: "Text" });
    expect(getActiveLocales(settings)).toEqual(["fa", "en", "ar"]);
  });

  it("always includes the default language and drops invalid values", () => {
    const turkish = mergeSettings({
      localization: { language: "tr", mode: "multi", locales: ["en"], english: {} },
    });
    expect(turkish.localization.locales).toEqual(["en", "tr"]);
    expect(getDefaultLocale(turkish)).toBe("tr");
    expect(getActiveLocales(turkish)).toEqual(["en", "tr"]);

    const invalid = mergeSettings({
      localization: {
        language: "de",
        mode: "everything",
        locales: "en",
        english: {},
      } as never,
    });
    expect(invalid.localization.language).toBe("fa");
    expect(invalid.localization.mode).toBe("single");
    expect(invalid.localization.locales).toEqual(["fa"]);
  });

  it("keeps legacy English settings working", () => {
    const settings = mergeSettings({
      localization: { language: "en", english: { "متن سفارشی": "Custom content" } },
    });
    expect(settings.localization).toMatchObject({
      language: "en",
      mode: "single",
      locales: ["en"],
      english: { "متن سفارشی": "Custom content" },
    });
    expect(getDefaultLocale(settings)).toBe("en");
    expect(getActiveLocales(settings)).toEqual(["en"]);
    expect(resolvePageLocale(settings, null)).toBe("en");
    expect(isEnglishChrome(settings, resolvePageLocale(settings, null), "/about")).toBe(true);
  });

  it("does not share the default locale list between merges", () => {
    const a = mergeSettings({});
    a.localization.locales?.push("en");
    expect(mergeSettings({}).localization.locales).toEqual(["fa"]);
    expect(DEFAULT_SETTINGS.localization.locales).toEqual(["fa"]);
  });

  it("serves only the default language in single mode", () => {
    const settings = siteWith("fa");
    settings.localization.mode = "single";
    settings.localization.locales = ["fa", "en", "tr"];
    expect(getActiveLocales(settings)).toEqual(["fa"]);
    expect(getActiveLocales(siteWith("fa", ["fa", "en", "tr"]))).toEqual(["fa", "en", "tr"]);
    // تنظیمات خام بدون زبان پیش‌فرض در فهرست
    expect(getActiveLocales(siteWith("fa", ["en"]))).toEqual(["fa", "en"]);
  });

  it("resolves the page locale from the URL prefix only when that locale is active", () => {
    const multi = siteWith("fa", ["fa", "en"]);
    expect(resolvePageLocale(multi, "en")).toBe("en");
    expect(resolvePageLocale(multi, null)).toBe("fa");
    expect(resolvePageLocale(multi, undefined)).toBe("fa");
    expect(resolvePageLocale(multi, "tr")).toBe("fa");
    expect(resolvePageLocale(siteWith("fa"), "en")).toBe("fa");
    const english = siteWith("en", ["en", "fa", "ar"]);
    expect(resolvePageLocale(english, null)).toBe("en");
    expect(resolvePageLocale(english, "fa")).toBe("fa");
    expect(resolvePageLocale(english, "ar")).toBe("ar");
    expect(resolvePageLocale(english, "tr")).toBe("en");
  });

  it("shows legal pages of a Persian site in English unless /en is active", () => {
    const single = siteWith("fa");
    for (const path of ["/privacy", "/privacy/", "/terms", "/help"]) {
      expect(pageContentLocale(single, "fa", path), path).toBe("en");
      expect(isEnglishChrome(single, "fa", path), path).toBe(true);
    }
    expect(pageContentLocale(single, "fa", "/about")).toBe("fa");
    expect(pageContentLocale(single, "fa", "/")).toBe("fa");
    expect(isEnglishChrome(single, "fa", "/about")).toBe(false);

    const switchedOff = siteWith("fa");
    switchedOff.brand.legalEnglishChrome = false;
    expect(pageContentLocale(switchedOff, "fa", "/privacy")).toBe("fa");

    // نسخه انگلیسی فعال است، پس صفحات حقوقی فارسی فارسی می‌مانند
    const withEnglish = siteWith("fa", ["fa", "en"]);
    expect(pageContentLocale(withEnglish, "fa", "/privacy")).toBe("fa");
    expect(isEnglishChrome(withEnglish, "fa", "/privacy")).toBe(false);
    expect(pageContentLocale(withEnglish, "en", "/privacy")).toBe("en");
    expect(isEnglishChrome(withEnglish, "en", "/about")).toBe(true);

    // زبان‌های دیگر بدون /en همان قاعده سایت فارسی را دارند
    const withTurkish = siteWith("fa", ["fa", "tr"]);
    expect(pageContentLocale(withTurkish, "fa", "/privacy")).toBe("en");
  });

  it("leaves Turkish and Arabic pages in their own language", () => {
    for (const settings of [siteWith("fa"), siteWith("fa", ["fa", "tr", "ar"])]) {
      for (const locale of ["tr", "ar"] as const) {
        for (const path of ["/privacy", "/terms", "/help", "/about"]) {
          expect(pageContentLocale(settings, locale, path)).toBe(locale);
          expect(isEnglishChrome(settings, locale, path)).toBe(false);
        }
      }
    }
  });
});

describe("page translator per locale", () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.brand.name = "نام ویژه";
  settings.brand.nameEn = "Example Brand";
  settings.localization.english = {
    "متن سفارشی": "Custom content",
    "چت زنده": "Live support",
  };

  it("applies the English brand name and admin translations only in English", () => {
    const en = siteI18n(settings, "en", englishMessages);
    expect(en.locale).toBe("en");
    expect(en.info).toBe(LOCALE_INFO.en);
    expect(en.translate("نام ویژه")).toBe("Example Brand");
    expect(en.translate("متن سفارشی")).toBe("Custom content");
    // ترجمه مدیر بر دیکشنری داخلی مقدم است
    expect(en.translate("چت زنده")).toBe("Live support");
    expect(en.translate("درباره ما")).toBe("About us");
  });

  it("uses the Latin brand name but not the English overrides for Turkish and Arabic", () => {
    for (const locale of ["tr", "ar"] as const) {
      const i18n = siteI18n(settings, locale);
      expect(i18n.locale).toBe(locale);
      expect(i18n.info).toBe(LOCALE_INFO[locale]);
      expect(i18n.translate("نام ویژه")).toBe("Example Brand");
      expect(i18n.translate("متن سفارشی")).toBe("متن سفارشی");
      expect(i18n.translate("چت زنده")).toBe("چت زنده");
    }
    const tr = siteI18n(settings, "tr", { "چت زنده": "Canlı sohbet" });
    expect(tr.translate("چت زنده")).toBe("Canlı sohbet");
  });

  it("keeps Persian unchanged", () => {
    const fa = siteI18n(settings, "fa", { "چت زنده": "should not apply" });
    expect(fa.info).toBe(LOCALE_INFO.fa);
    for (const text of ["نام ویژه", "متن سفارشی", "چت زنده", "قیمت ۴۹۰٬۰۰۰ تومان؟"]) {
      expect(fa.translate(text)).toBe(text);
    }
    expect(createSiteTranslator("fa", { "چت زنده": "X" }, { "چت زنده": "Y" })("چت زنده")).toBe(
      "چت زنده",
    );
  });

  it("picks up changed admin translations", () => {
    const changed = structuredClone(settings);
    changed.localization.english = { "متن سفارشی": "Edited content" };
    expect(siteI18n(settings, "en", englishMessages).translate("متن سفارشی")).toBe(
      "Custom content",
    );
    expect(siteI18n(changed, "en", englishMessages).translate("متن سفارشی")).toBe("Edited content");
  });

  it("formats Persian digits for Turkish", () => {
    const t = createSiteTranslator("tr");
    expect(t("۴۹۰٬۰۰۰")).toBe("490.000");
    expect(t("۲٫۵")).toBe("2,5");
    expect(t("۲۰٪")).toBe("20%");
    expect(t("٤٥٦")).toBe("456");
    expect(t("چرا؟")).toBe("چرا?");
    const withTemplate = createSiteTranslator("tr", { "صفحه {0}": "Sayfa {0}" });
    expect(withTemplate("صفحه ۱۲٬۳۴۵")).toBe("Sayfa 12.345");
    expect(withTemplate(" صفحه ۲ ")).toBe(" Sayfa 2 ");
  });

  it("uses Latin digits for Arabic and keeps the Arabic question mark", () => {
    const t = createSiteTranslator("ar");
    expect(t("۴۹۰٬۰۰۰")).toBe("490,000");
    expect(t("۲٫۵")).toBe("2.5");
    expect(t("٤٥٦")).toBe("456");
    expect(t("چرا؟")).toBe("چرا؟");
    expect(t("قیمت ۴۹۰٬۰۰۰؟")).toBe("قیمت 490,000؟");
  });

  it("joins generated lists with the Turkish conjunction", () => {
    const t = createSiteTranslator("tr", {
      "چت زنده": "Canlı sohbet",
      "ایجنت هوش مصنوعی": "Yapay zekâ ajanı",
      "پایگاه دانش": "Bilgi bankası",
    });
    expect(t("چت زنده، ایجنت هوش مصنوعی و پایگاه دانش")).toBe(
      "Canlı sohbet, Yapay zekâ ajanı ve Bilgi bankası",
    );
    expect(t("چت زنده و پایگاه دانش")).toBe("Canlı sohbet ve Bilgi bankası");
    // یک بخش ترجمه نشده: کل فهرست به زبان اصلی می‌ماند
    expect(t("چت زنده و تماس تصویری")).toBe("چت زنده و تماس تصویری");
  });

  it("accepts Arabic output when joining generated lists", () => {
    const t = createSiteTranslator("ar", {
      "چت زنده": "دردشة مباشرة",
      "ایجنت هوش مصنوعی": "وكيل ذكاء اصطناعي",
      "پایگاه دانش": "قاعدة المعرفة",
    });
    expect(t("چت زنده، ایجنت هوش مصنوعی و پایگاه دانش")).toBe(
      "دردشة مباشرة، وكيل ذكاء اصطناعي وقاعدة المعرفة",
    );
    expect(t("چت زنده و تماس تصویری")).toBe("چت زنده و تماس تصویری");
  });

  it("marks structured data with the page language", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "چت زنده",
      description: "قیمت ۴۹۰٬۰۰۰",
      url: "https://webyar.ai/چت-زنده",
      inLanguage: "fa-IR",
      hasPart: [{ "@type": "WebPageElement", name: "چت زنده", inLanguage: "fa-IR" }],
    };
    expect(localizeStructuredData(siteI18n(DEFAULT_SETTINGS, "fa"), data)).toEqual(data);
    expect(localizeStructuredData(siteI18n(DEFAULT_SETTINGS, "en", englishMessages), data)).toEqual(
      {
        ...data,
        name: "Live chat",
        description: "قیمت 490,000",
        inLanguage: "en-US",
        hasPart: [{ "@type": "WebPageElement", name: "Live chat", inLanguage: "en-US" }],
      },
    );
    const turkish = siteI18n(DEFAULT_SETTINGS, "tr", { "چت زنده": "Canlı sohbet" });
    expect(localizeStructuredData(turkish, data)).toEqual({
      ...data,
      name: "Canlı sohbet",
      description: "قیمت 490.000",
      inLanguage: "tr",
      hasPart: [{ "@type": "WebPageElement", name: "Canlı sohbet", inLanguage: "tr" }],
    });
    const arabic = siteI18n(DEFAULT_SETTINGS, "ar", { "چت زنده": "دردشة مباشرة" });
    expect(localizeStructuredData(arabic, data)).toEqual({
      ...data,
      name: "دردشة مباشرة",
      description: "قیمت 490,000",
      inLanguage: "ar",
      hasPart: [{ "@type": "WebPageElement", name: "دردشة مباشرة", inLanguage: "ar" }],
    });
  });

  it("reads the page language from the root route in head()", () => {
    expect(i18nFromMatches([])).toBeNull();
    expect(i18nFromMatches([{ routeId: "__root__", loaderData: undefined }])).toBeNull();
    const messages = { "چت زنده": "Canlı sohbet" };
    const i18n = i18nFromMatches([
      { routeId: "__root__", loaderData: { settings: DEFAULT_SETTINGS, locale: "tr", messages } },
      { routeId: "/pricing", loaderData: { settings: DEFAULT_SETTINGS } },
    ]);
    expect(i18n?.locale).toBe("tr");
    expect(i18n?.info).toBe(LOCALE_INFO.tr);
    expect(i18n?.translate("چت زنده")).toBe("Canlı sohbet");
    expect(i18n?.translate(DEFAULT_SETTINGS.brand.name)).toBe("Webyar");
  });
});
