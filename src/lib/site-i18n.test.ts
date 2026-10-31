import { describe, expect, it } from "vitest";
import {
  createSiteTranslator,
  getSiteLanguage,
  localizeStructuredData,
  siteI18n,
} from "./site-i18n";
import messages from "./site-translations.en.json";
import { DEFAULT_SETTINGS, isEnglishChrome, mergeSettings, resolvePageLocale } from "./settings";
import { buildPageMeta } from "./seo-meta";

describe("site language", () => {
  it("keeps existing settings and the Persian default", () => {
    const settings = mergeSettings({
      brand: { ...DEFAULT_SETTINGS.brand, name: "آزمایش" },
    });
    expect(getSiteLanguage(settings)).toBe("fa");
    expect(settings.brand.name).toBe("آزمایش");
    expect(settings.localization.english).toEqual({});
  });
  it("drops the removed English-template setting from stored settings", () => {
    const settings = mergeSettings({
      localization: {
        language: "fa",
        english: {},
        englishTemplate: "thread",
      } as never,
    });
    expect("englishTemplate" in settings.localization).toBe(false);
  });
  it("applies English to every public path regardless of the legal-page switch", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.language = "en";
    settings.brand.legalEnglishChrome = false;
    // آدرس بدون پیشوند در سایتی که زبان پیش‌فرضش انگلیسی است
    const locale = resolvePageLocale(settings, null);
    for (const path of [
      "/",
      "/about",
      "/pricing",
      "/products/example",
      "/solutions/example",
      "/blog/example",
      "/download",
      "/contact",
      "/sla",
      "/terms",
      "/privacy",
      "/help",
    ]) {
      expect(isEnglishChrome(settings, locale, path)).toBe(true);
    }
  });
  it("preserves the separate legacy legal-page setting in Persian mode", () => {
    expect(isEnglishChrome(DEFAULT_SETTINGS, "fa", "/terms/")).toBe(true);
    expect(isEnglishChrome(DEFAULT_SETTINGS, "fa", "/about")).toBe(false);
    expect(
      isEnglishChrome(
        {
          ...DEFAULT_SETTINGS,
          brand: { ...DEFAULT_SETTINGS.brand, legalEnglishChrome: false },
        },
        "fa",
        "/terms",
      ),
    ).toBe(false);
  });
  it("does not mutate source content when switching back", () => {
    const source = "چت زنده";
    expect(createSiteTranslator("en", messages)(source)).toBe("Live chat");
    expect(createSiteTranslator("fa")(source)).toBe(source);
    expect(DEFAULT_SETTINGS.localization.language).toBe("fa");
  });
  it("translates interpolation and generated lists", () => {
    const t = createSiteTranslator("en", messages);
    expect(t("بلاگ، صفحه ۲ | وب‌یار")).toBe("Blog, page 2 | Webyar");
    expect(t("مجموع سالانه ۴۹۰٬۰۰۰ تومان")).toBe("Annual total: 490,000 Toman");
    expect(t("چت زنده، ایجنت هوش مصنوعی و پایگاه دانش")).toBe(
      "Live chat, AI agent and Knowledge base",
    );
  });
  it("preserves spaces between text and inline elements", () => {
    const t = createSiteTranslator("en", messages);
    expect(t("داستان ")).toBe("Our story ");
    expect(t(" داستان")).toBe(" Our story");
    expect(t("داستان")).toBe("Our story");
  });
  it("uses custom English content without translating identifiers", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization = {
      language: "en",
      english: { "متن سفارشی": "Custom content" },
    };
    settings.brand.name = "نام ویژه";
    settings.brand.nameEn = "Example Brand";
    const i18n = siteI18n(settings, resolvePageLocale(settings, null), messages);
    const t = i18n.translate;
    expect(t("متن سفارشی")).toBe("Custom content");
    expect(t("نام ویژه")).toBe("Example Brand");
    const schema = localizeStructuredData(i18n, {
      name: "متن سفارشی",
      url: "/blog/متن-سفارشی",
      inLanguage: "fa-IR",
      datePublished: "2026-10-04",
    });
    expect(schema).toEqual({
      name: "Custom content",
      url: "/blog/متن-سفارشی",
      inLanguage: "en-US",
      datePublished: "2026-10-04",
    });
  });
  it("localizes SEO titles and descriptions without changing canonical links", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.language = "en";
    const meta = buildPageMeta({
      i18n: siteI18n(settings, resolvePageLocale(settings, null), messages),
      settings,
      path: "/about",
      override: null,
      fallbackTitle: "درباره ما | وب‌یار",
      fallbackDescription:
        "وب‌یار پلتفرم جامع مدیریت ارتباط با مشتری برای توانمندسازی کسب‌وکارهای ایرانی.",
    });
    expect(meta.meta).toContainEqual({ title: "About us | Webyar" });
    expect(meta.meta).toContainEqual({
      property: "og:locale",
      content: "en_US",
    });
    expect(meta.links).toContainEqual({
      rel: "canonical",
      href: "https://webyar.ai/about",
    });
  });
  it("leaves arbitrary article content intact until its translation is provided", () => {
    const source = "مقاله جدید با محتوای اختصاصی";
    expect(createSiteTranslator("en", messages)(source)).toBe(source);
    expect(
      createSiteTranslator("en", messages, {
        [source]: "A newly translated article",
      })(source),
    ).toBe("A newly translated article");
  });
});
