import { describe, expect, it } from "vitest";
import {
  createSiteTranslator,
  getSiteLanguage,
  localizeStructuredData,
  translatorForSettings,
} from "./site-i18n";
import { DEFAULT_SETTINGS, isEnglishChrome, mergeSettings } from "./settings";
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
  it("applies English to every public path regardless of the legal-page switch", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.language = "en";
    settings.brand.legalEnglishChrome = false;
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
      expect(isEnglishChrome(settings, path)).toBe(true);
    }
  });
  it("preserves the separate legacy legal-page setting in Persian mode", () => {
    expect(isEnglishChrome(DEFAULT_SETTINGS, "/terms/")).toBe(true);
    expect(isEnglishChrome(DEFAULT_SETTINGS, "/about")).toBe(false);
    expect(
      isEnglishChrome(
        {
          ...DEFAULT_SETTINGS,
          brand: { ...DEFAULT_SETTINGS.brand, legalEnglishChrome: false },
        },
        "/terms",
      ),
    ).toBe(false);
  });
  it("does not mutate source content when switching back", () => {
    const source = "چت زنده";
    expect(createSiteTranslator("en")(source)).toBe("Live chat");
    expect(createSiteTranslator("fa")(source)).toBe(source);
    expect(DEFAULT_SETTINGS.localization.language).toBe("fa");
  });
  it("translates interpolation and generated lists", () => {
    const t = createSiteTranslator("en");
    expect(t("بلاگ، صفحه ۲ | وب‌یار")).toBe("Blog, page 2 | Webyar");
    expect(t("مجموع سالانه ۴۹۰٬۰۰۰ تومان")).toBe("Annual total: 490,000 Toman");
    expect(t("چت زنده، ایجنت هوش مصنوعی و پایگاه دانش")).toBe(
      "Live chat, AI agent and Knowledge base",
    );
  });
  it("preserves spaces between text and inline elements", () => {
    const t = createSiteTranslator("en");
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
    const t = translatorForSettings(settings);
    expect(t("متن سفارشی")).toBe("Custom content");
    expect(t("نام ویژه")).toBe("Example Brand");
    const schema = localizeStructuredData(settings, {
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
    expect(createSiteTranslator("en")(source)).toBe(source);
    expect(
      createSiteTranslator("en", { [source]: "A newly translated article" })(
        source,
      ),
    ).toBe("A newly translated article");
  });
});
