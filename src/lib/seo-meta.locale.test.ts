import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBreadcrumbJsonLd,
  buildPageMeta,
  hreflangAlternates,
  localePrefix,
  localizedUrl,
} from "./seo-meta";
import type { SeoPageDto } from "./seo.functions";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import { i18nFromMatches, siteI18n } from "./site-i18n";
import type { Locale } from "./locales";
import englishMessages from "./site-translations.en.json";

// همه زبان‌ها الان دیکشنری دارند؛ برای پوشش مسیر «زبان بدون دیکشنری» دیکشنری یک زبان را در
// تست‌های مربوط پنهان می‌کنیم.
const dictionaries = vi.hoisted(() => ({ missing: new Set<string>() }));
vi.mock("./site-messages", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./site-messages")>();
  return {
    ...actual,
    hasSiteMessages: (locale: Locale) =>
      !dictionaries.missing.has(locale) && actual.hasSiteMessages(locale),
  };
});
afterEach(() => dictionaries.missing.clear());

/** سایت فارسی با نسخه‌های انگلیسی، ترکی و عربی */
function multiSite(language: Locale = "fa"): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en", "tr", "ar"];
  return settings;
}

function messagesFor(locale: Locale): Record<string, string> {
  return locale === "en" ? englishMessages : {};
}

/** مثل head() یک route: زبان از داده‌های route ریشه */
function headMatches(settings: SiteSettings, locale: Locale) {
  return [
    {
      routeId: "__root__",
      loaderData: { settings, locale, messages: messagesFor(locale) },
    },
  ];
}

type PageInput = Pick<
  Parameters<typeof buildPageMeta>[0],
  "path" | "override" | "fallbackTitle" | "fallbackDescription"
>;

const aboutPage: PageInput = {
  path: "/about",
  override: null,
  fallbackTitle: "درباره ما | وب‌یار",
  fallbackDescription:
    "وب‌یار پلتفرم جامع مدیریت ارتباط با مشتری برای توانمندسازی کسب‌وکارهای ایرانی.",
};

function meta(settings: SiteSettings, locale: Locale | null, page: PageInput = aboutPage) {
  return buildPageMeta({
    i18n: locale ? i18nFromMatches(headMatches(settings, locale)) : null,
    settings,
    ...page,
  });
}

/** فقط لینک canonical (لینک‌های hreflang جدا تست می‌شوند) */
function canonicalOf(result: ReturnType<typeof buildPageMeta>) {
  return result.links.filter((link) => link.rel === "canonical");
}

function find(result: ReturnType<typeof buildPageMeta>, property: string) {
  return result.meta.find((entry) => "property" in entry && entry.property === property);
}

const override: SeoPageDto = {
  id: "1",
  pageKey: "about",
  path: "/about",
  title: "عنوان سفارشی درباره ما",
  description: "توضیحات سفارشی",
  ogImage: "https://cdn.example.com/about.png",
  canonicalUrl: "https://webyar.ai/about-us",
  robots: "noindex,follow",
  schemaJson: null,
  createdAt: "2026-10-04T00:00:00Z",
  updatedAt: "2026-10-04T00:00:00Z",
};

describe("page meta per locale", () => {
  it("keeps the default-locale output unchanged", () => {
    const settings = multiSite();
    const result = meta(settings, "fa");
    expect(result).toEqual({
      meta: [
        { title: "درباره ما | وب‌یار" },
        { name: "description", content: aboutPage.fallbackDescription },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "درباره ما | وب‌یار" },
        { property: "og:description", content: aboutPage.fallbackDescription },
        { property: "og:image", content: "https://webyar.ai/og-image.png?v=2" },
        { name: "twitter:title", content: "درباره ما | وب‌یار" },
        { name: "twitter:description", content: aboutPage.fallbackDescription },
        { name: "twitter:image", content: "https://webyar.ai/og-image.png?v=2" },
        { property: "og:url", content: "https://webyar.ai/about" },
        { property: "og:locale", content: "fa_IR" },
      ],
      links: [
        { rel: "canonical", href: "https://webyar.ai/about" },
        { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/about" },
        { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/about" },
        { rel: "alternate", hrefLang: "tr", href: "https://webyar.ai/tr/about" },
        { rel: "alternate", hrefLang: "ar", href: "https://webyar.ai/ar/about" },
        { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/about" },
      ],
    });
    // بدون داده‌های route ریشه همان زبان پیش‌فرض سایت
    expect(meta(settings, null)).toEqual(result);
    // سایت تک‌زبانه: همان خروجی، بدون hreflang
    expect(meta(structuredClone(DEFAULT_SETTINGS), "fa")).toEqual({
      ...result,
      links: canonicalOf(result),
    });
  });

  it("prefixes the canonical URL and sets og:locale for other locales", () => {
    const settings = multiSite();
    const expected: Record<Exclude<Locale, "fa">, string> = {
      en: "en_US",
      tr: "tr_TR",
      ar: "ar_AR",
    };
    for (const [locale, ogLocale] of Object.entries(expected) as [Locale, string][]) {
      const result = meta(settings, locale);
      const url = `https://webyar.ai/${locale}/about`;
      expect(canonicalOf(result)).toEqual([{ rel: "canonical", href: url }]);
      expect(find(result, "og:url")).toEqual({ property: "og:url", content: url });
      expect(find(result, "og:locale")).toEqual({ property: "og:locale", content: ogLocale });
    }
    const home = meta(settings, "tr", { ...aboutPage, path: "/" });
    expect(canonicalOf(home)).toEqual([{ rel: "canonical", href: "https://webyar.ai/tr" }]);
  });

  it("translates the English page", () => {
    const result = meta(multiSite(), "en");
    expect(result.meta[0]).toEqual({ title: "About us | Webyar" });
    expect(find(result, "og:title")).toEqual({
      property: "og:title",
      content: "About us | Webyar",
    });
  });

  it("prefixes Persian when English is the default language", () => {
    const settings = multiSite("en");
    expect(canonicalOf(meta(settings, "en"))).toEqual([
      { rel: "canonical", href: "https://webyar.ai/about" },
    ]);
    const fa = meta(settings, "fa");
    expect(canonicalOf(fa)).toEqual([{ rel: "canonical", href: "https://webyar.ai/fa/about" }]);
    expect(find(fa, "og:locale")).toEqual({ property: "og:locale", content: "fa_IR" });
  });

  it("applies the admin page override only to the default locale", () => {
    const settings = multiSite();
    const page = { ...aboutPage, override };
    const fa = meta(settings, "fa", page);
    expect(fa.meta[0]).toEqual({ title: override.title });
    expect(fa.meta).toContainEqual({ name: "robots", content: "noindex,follow" });
    expect(fa.meta).toContainEqual({ property: "og:image", content: override.ogImage });
    expect(canonicalOf(fa)).toEqual([{ rel: "canonical", href: override.canonicalUrl }]);

    for (const locale of ["en", "tr", "ar"] as const) {
      const other = meta(settings, locale, page);
      expect(canonicalOf(other)).toEqual([
        { rel: "canonical", href: `https://webyar.ai/${locale}/about` },
      ]);
      // robots سفارشی زبان پیش‌فرض به نسخه‌های دیگر سرایت نمی‌کند
      expect(other.meta).toContainEqual({ name: "robots", content: "index,follow" });
      expect(other.meta[0]).not.toEqual({ title: override.title });
    }
    expect(meta(settings, "en", page).meta[0]).toEqual({ title: "About us | Webyar" });
  });

  it("keeps a language without a UI dictionary out of the index", () => {
    dictionaries.missing.add("ar");
    const settings = multiSite();
    const ar = meta(settings, "ar");
    // متن فارسی نشان می‌دهد؛ تا ترجمه آماده نشده ایندکس نمی‌شود و hreflang ندارد
    expect(ar.meta).toContainEqual({ name: "robots", content: "noindex,follow" });
    expect(ar.links.filter((link) => link.rel === "alternate")).toEqual([]);
    expect(canonicalOf(ar)).toEqual([{ rel: "canonical", href: "https://webyar.ai/ar/about" }]);
    // حتی override زبان پیش‌فرض با index هم آن را ایندکس نمی‌کند
    const page = { ...aboutPage, override: { ...override, robots: "index,follow" } };
    expect(meta(settings, "ar", page).meta).toContainEqual({
      name: "robots",
      content: "noindex,follow",
    });
    for (const locale of ["fa", "en", "tr"] as const) {
      expect(meta(settings, locale).meta).toContainEqual({
        name: "robots",
        content: "index,follow",
      });
    }
  });

  it("omits canonical links without a site URL", () => {
    const settings = multiSite();
    settings.brand.siteUrl = "";
    for (const locale of ["fa", "en", "tr", "ar"] as const) {
      const result = meta(settings, locale);
      expect(canonicalOf(result)).toEqual([]);
      expect(find(result, "og:url")).toBeUndefined();
    }
  });
});

describe("localized URLs", () => {
  it("prefixes every locale except the default", () => {
    const settings = multiSite();
    settings.brand.siteUrl = "https://webyar.ai/";
    expect(localePrefix(settings, "fa")).toBeNull();
    expect(localePrefix(settings, "ar")).toBe("ar");
    expect(localizedUrl(settings, "fa", "/")).toBe("https://webyar.ai/");
    expect(localizedUrl(settings, "fa", "/pricing")).toBe("https://webyar.ai/pricing");
    expect(localizedUrl(settings, "en", "/")).toBe("https://webyar.ai/en");
    expect(localizedUrl(settings, "en", "/pricing")).toBe("https://webyar.ai/en/pricing");
    expect(localizedUrl(settings, "ar", "/products/chat")).toBe(
      "https://webyar.ai/ar/products/chat",
    );
    settings.brand.siteUrl = "";
    expect(localizedUrl(settings, "en", "/pricing")).toBeUndefined();
  });

  it("builds breadcrumbs in the page language", () => {
    const settings = multiSite();
    const items = [
      { name: "صفحه اصلی", path: "/" },
      { name: "درباره ما", path: "/about" },
    ];
    expect(buildBreadcrumbJsonLd(siteI18n(settings, "fa"), settings, items)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "صفحه اصلی", item: "https://webyar.ai/" },
        { "@type": "ListItem", position: 2, name: "درباره ما", item: "https://webyar.ai/about" },
      ],
    });
    const en = buildBreadcrumbJsonLd(siteI18n(settings, "en", englishMessages), settings, items);
    expect(en.itemListElement.map((item) => item.item)).toEqual([
      "https://webyar.ai/en",
      "https://webyar.ai/en/about",
    ]);
    expect(en.itemListElement[1]?.name).toBe("About us");
    const tr = buildBreadcrumbJsonLd(siteI18n(settings, "tr"), settings, items);
    expect(tr.itemListElement.map((item) => item.item)).toEqual([
      "https://webyar.ai/tr",
      "https://webyar.ai/tr/about",
    ]);
  });
});

describe("hreflang alternates", () => {
  const alternates = (result: ReturnType<typeof buildPageMeta>) =>
    result.links.filter((link) => link.rel === "alternate");

  it("is empty on a single-language site", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    expect(hreflangAlternates(settings, "/about")).toEqual([]);
    expect(alternates(meta(settings, "fa"))).toEqual([]);
  });

  it("lists translated languages and x-default, from every language version", () => {
    const expected = [
      { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/about" },
      { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/about" },
      { rel: "alternate", hrefLang: "tr", href: "https://webyar.ai/tr/about" },
      { rel: "alternate", hrefLang: "ar", href: "https://webyar.ai/ar/about" },
      { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/about" },
    ];
    for (const locale of ["fa", "en", "tr", "ar"] as const)
      expect(alternates(meta(multiSite(), locale))).toEqual(expected);
  });

  it("leaves languages without a UI dictionary out of hreflang", () => {
    // زبان بدون دیکشنری noindex است، پس در hreflang نمی‌آید و خودش هم hreflang ندارد
    dictionaries.missing.add("tr");
    const expected = [
      { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/about" },
      { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/about" },
      { rel: "alternate", hrefLang: "ar", href: "https://webyar.ai/ar/about" },
      { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/about" },
    ];
    expect(alternates(meta(multiSite(), "fa"))).toEqual(expected);
    expect(alternates(meta(multiSite(), "ar"))).toEqual(expected);
    expect(alternates(meta(multiSite(), "tr"))).toEqual([]);
  });

  it("points x-default at the default language", () => {
    expect(hreflangAlternates(multiSite("en"), "/")).toEqual([
      { hrefLang: "fa", href: "https://webyar.ai/fa" },
      { hrefLang: "en", href: "https://webyar.ai/" },
      { hrefLang: "tr", href: "https://webyar.ai/tr" },
      { hrefLang: "ar", href: "https://webyar.ai/ar" },
      { hrefLang: "x-default", href: "https://webyar.ai/" },
    ]);
  });

  it("uses the default language's custom canonical and skips noindex pages", () => {
    const page = { ...aboutPage, override: { ...override, robots: "index,follow" } };
    expect(alternates(meta(multiSite(), "en", page))[0]).toEqual({
      rel: "alternate",
      hrefLang: "fa",
      href: override.canonicalUrl,
    });
    expect(alternates(meta(multiSite(), "fa", { ...aboutPage, override }))).toEqual([]);
  });

  it("can be turned off for Persian-only pages", () => {
    const settings = multiSite();
    const result = buildPageMeta({
      i18n: i18nFromMatches(headMatches(settings, "fa")),
      settings,
      ...aboutPage,
      path: "/blog",
      alternates: false,
    });
    expect(alternates(result)).toEqual([]);
  });
});
