import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import type { Locale } from "./locales";
import { siteI18n } from "./site-i18n";
import englishMessages from "./site-translations.en.json";

type Row = Record<string, unknown>;

// دیتابیس و تنظیمات ساختگی برای getPublicSeoPage/saveSeoPage
const fake = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  queries: [] as { table: string; action: string; filters: [string, unknown][] }[],
  settings: null as unknown,
  loadSettings: vi.fn(),
}));
vi.mock("./db.server", () => {
  function from(table: string) {
    const state = {
      action: "select",
      filters: [] as [string, unknown][],
      payload: null as Row | null,
      single: false,
    };
    const run = () => {
      fake.queries.push({ table, action: state.action, filters: state.filters });
      const match = (row: Row) => state.filters.every(([column, value]) => row[column] === value);
      if (state.action === "insert") {
        fake.rows.push({ ...state.payload });
        return { data: null, error: null };
      }
      if (state.action === "update") {
        for (const row of fake.rows.filter(match)) Object.assign(row, state.payload);
        return { data: null, error: null };
      }
      const found = fake.rows.filter(match);
      if (!state.single) return { data: found, error: null };
      return found.length > 1
        ? { data: null, error: { message: "multiple rows" } }
        : { data: found[0] ?? null, error: null };
    };
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column: string, value: unknown) => {
        state.filters.push([column, value]);
        return builder;
      },
      maybeSingle: () => {
        state.single = true;
        return builder;
      },
      insert: (payload: Row) => {
        state.action = "insert";
        state.payload = payload;
        return builder;
      },
      update: (payload: Row) => {
        state.action = "update";
        state.payload = payload;
        return builder;
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve().then(run).then(resolve, reject),
    };
    return builder;
  }
  return { db: { from }, newId: () => "new-id", nowIso: () => "2026-10-31T00:00:00Z" };
});
vi.mock("./settings.server", () => ({ loadSettings: fake.loadSettings }));
vi.mock("./auth.server", () => ({ requireAdmin: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (handle: () => unknown) => handle,
    inputValidator: (validate: (input: unknown) => unknown) => ({
      handler: (handle: (args: { data: unknown }) => unknown) => async (args: { data: unknown }) =>
        handle({ data: validate(args.data) }),
    }),
  }),
}));

import {
  buildPageMeta,
  hreflangAlternates,
  sameSiteCanonical,
  selectSeoPageRow,
  seoOverrideFor,
  seoPageCanonicals,
  seoPageNoindexLocales,
} from "./seo-meta";
import {
  getPublicSeoPage,
  saveSeoPage,
  seoBasePageKey,
  seoStoredPageKey,
  type SeoPageDto,
} from "./seo.functions";

function site(language: Locale = "fa", mode: "single" | "multi" = "multi"): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  settings.localization.mode = mode;
  settings.localization.locales = mode === "multi" ? ["fa", "en", "tr", "ar"] : [language];
  return settings;
}

function dbRow(id: string, locale: string | null | undefined, extra: Row = {}): Row {
  const row: Row = {
    id,
    page_key: locale ? `about@${locale}` : "about",
    path: "/about",
    title: `title ${id}`,
    description: `description ${id}`,
    og_image: null,
    canonical_url: null,
    robots: "index,follow",
    schema_json: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...extra,
  };
  // ردیف‌های پیش از مایگریشن اصلاً ستون locale ندارند
  if (locale !== undefined) row["locale"] = locale;
  return row;
}

const dto = (id: string, locale?: Locale, extra: Partial<SeoPageDto> = {}): SeoPageDto => ({
  id,
  pageKey: locale ? `about@${locale}` : "about",
  path: "/about",
  title: `title ${id}`,
  description: `description ${id}`,
  ogImage: null,
  canonicalUrl: null,
  robots: "index,follow",
  schemaJson: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ...(locale ? { locale } : {}),
  ...extra,
});

beforeEach(() => {
  fake.rows = [];
  fake.queries = [];
  fake.settings = site("fa", "single");
  fake.loadSettings.mockReset();
  fake.loadSettings.mockImplementation(async () => fake.settings);
});

describe("selectSeoPageRow", () => {
  const legacy = dto("legacy");
  const en = dto("en", "en");
  const tr = dto("tr", "tr");

  it("picks the page language's own row", () => {
    expect(selectSeoPageRow([legacy, en, tr], "en", "fa")).toBe(en);
    expect(selectSeoPageRow([legacy, en, tr], "tr", "fa")).toBe(tr);
  });

  it("falls back to the default-language row", () => {
    expect(selectSeoPageRow([legacy, en], "fa", "fa")).toBe(legacy);
    // بدون تنظیمات (مسیر ردیف زبان‌دار ندارد) فقط ردیف بدون زبان معنا دارد
    expect(selectSeoPageRow([legacy], null, null)).toBe(legacy);
    // روی زبان دیگر هم برمی‌گردد (برای hreflang)، ولی buildPageMeta اعمالش نمی‌کند
    expect(selectSeoPageRow([legacy, en], "ar", "fa")).toBe(legacy);
    expect(selectSeoPageRow([en], "ar", "fa")).toBeNull();
    expect(selectSeoPageRow([], "fa", "fa")).toBeNull();
  });

  it("prefers an explicit default-language row over the legacy row", () => {
    const explicit = dto("explicit-en", "en");
    expect(selectSeoPageRow([legacy, explicit], "en", "en")).toBe(explicit);
    expect(selectSeoPageRow([legacy, explicit], null, "en")).toBe(explicit);
    expect(selectSeoPageRow([legacy, explicit], "fa", "en")).toBe(explicit);
  });

  it("ignores ambiguous duplicates like the old single-row lookup", () => {
    expect(selectSeoPageRow([legacy, dto("legacy-2")], null, null)).toBeNull();
    expect(selectSeoPageRow([legacy, en, dto("en-2", "en")], "en", "fa")).toBe(legacy);
  });

  it("collects each language's custom canonical", () => {
    const rows = [
      dto("legacy", undefined, { canonicalUrl: "https://webyar.ai/about-us" }),
      dto("en", "en", { canonicalUrl: "https://webyar.ai/en/about-us" }),
      dto("tr", "tr"),
    ];
    expect(seoPageCanonicals(rows, "fa")).toEqual({
      fa: "https://webyar.ai/about-us",
      en: "https://webyar.ai/en/about-us",
    });
    // زبان پیش‌فرض انگلیسی: ردیف بدون زبان به انگلیسی تعلق دارد و ردیف en صریح مقدم است
    expect(seoPageCanonicals(rows, "en")).toEqual({ en: "https://webyar.ai/en/about-us" });
  });
});

describe("custom canonical validation", () => {
  const settings = site();

  it("accepts only absolute URLs on the site's origin (scheme, host and port)", () => {
    expect(sameSiteCanonical(settings, "https://webyar.ai/en/about-us")).toBe(
      "https://webyar.ai/en/about-us",
    );
    expect(sameSiteCanonical(settings, " https://webyar.ai/about-us ")).toBe(
      "https://webyar.ai/about-us",
    );
    expect(sameSiteCanonical(settings, "http://webyar.ai/about-us")).toBeUndefined();
    expect(sameSiteCanonical(settings, "/en/about-us")).toBeUndefined();
    expect(sameSiteCanonical(settings, "about-us")).toBeUndefined();
    expect(sameSiteCanonical(settings, "https://webyar.com/about")).toBeUndefined();
    expect(sameSiteCanonical(settings, "https://blog.webyar.ai/about")).toBeUndefined();
    expect(sameSiteCanonical(settings, "ftp://webyar.ai/about")).toBeUndefined();
    expect(sameSiteCanonical(settings, "")).toBeUndefined();
    expect(sameSiteCanonical(settings, null)).toBeUndefined();
    const noSiteUrl = site();
    noSiteUrl.brand.siteUrl = "";
    expect(sameSiteCanonical(noSiteUrl, "https://webyar.ai/about")).toBeUndefined();
  });

  it("uses the default localized URL in hreflang for invalid canonicals", () => {
    expect(
      hreflangAlternates(settings, "/about", {
        fa: "about-us",
        en: "https://webyar.com/en/about",
      }),
    ).toEqual([
      { hrefLang: "fa", href: "https://webyar.ai/about" },
      { hrefLang: "en", href: "https://webyar.ai/en/about" },
      { hrefLang: "x-default", href: "https://webyar.ai/about" },
    ]);
    // صفحه: canonical خود صفحه مثل قبل همان مقدار ذخیره‌شده است، ولی hreflang آدرس معتبر می‌گیرد
    const en = dto("en", "en", {
      canonicalUrl: "/en/about-us",
      alternateCanonicals: { en: "/en/about-us" },
    });
    const meta = buildPageMeta({
      i18n: siteI18n(settings, "en", englishMessages),
      settings,
      path: "/about",
      override: en,
      fallbackTitle: "درباره ما | وب‌یار",
      fallbackDescription: "توضیح",
    });
    expect(meta.links.find((link) => link.rel === "canonical")?.href).toBe("/en/about-us");
    expect(meta.links.filter((link) => link.rel === "alternate").map((link) => link.href)).toEqual([
      "https://webyar.ai/about",
      "https://webyar.ai/en/about",
      "https://webyar.ai/about",
    ]);
  });
});

describe("per-language noindex", () => {
  const settings = site();
  const meta = (override: SeoPageDto | null, locale: Locale) =>
    buildPageMeta({
      i18n: siteI18n(settings, locale, locale === "en" ? englishMessages : {}),
      settings,
      path: "/help",
      override,
      fallbackTitle: "راهنما | وب‌یار",
      fallbackDescription: "توضیح",
    });
  const robots = (result: ReturnType<typeof meta>) =>
    result.meta.find((entry) => "name" in entry && entry.name === "robots");
  const alternates = (result: ReturnType<typeof meta>) =>
    result.links.filter((link) => link.rel === "alternate");

  it("collects the languages whose own row is noindex", () => {
    const rows = [
      dto("legacy", undefined, { robots: "noindex,follow" }),
      dto("en", "en", { robots: "NOINDEX" }),
      dto("tr", "tr"),
    ];
    expect(seoPageNoindexLocales(rows, "fa")).toEqual(["fa", "en"]);
    // زبان پیش‌فرض انگلیسی: ردیف en صریح مقدم است و ردیف بدون زبان دیگر به کسی تعلق ندارد
    expect(seoPageNoindexLocales(rows, "en")).toEqual(["en"]);
    expect(seoPageNoindexLocales([dto("en", "en", { robots: "index,follow" })], "fa")).toEqual([]);
  });

  it("removes a noindex language version from every version's hreflang", async () => {
    fake.settings = settings;
    fake.rows = [
      dbRow("en", "en", { path: "/help", page_key: "help@en", robots: "noindex,follow" }),
    ];
    const fa = await getPublicSeoPage({ data: { path: "/help", locale: null } });
    const en = await getPublicSeoPage({ data: { path: "/help", locale: "en" } });
    expect(fa).toMatchObject({ id: "en", locale: "en", noindexLocales: ["en"] });
    expect(fa && "alternateCanonicals" in fa).toBe(false);
    expect(en).toMatchObject({ id: "en", noindexLocales: ["en"] });
    // صفحه فارسی ایندکس می‌شود ولی به نسخه noindex انگلیسی لینک نمی‌دهد
    expect(robots(meta(fa, "fa"))).toEqual({ name: "robots", content: "index,follow" });
    expect(alternates(meta(fa, "fa"))).toEqual([]);
    expect(robots(meta(en, "en"))).toEqual({ name: "robots", content: "noindex,follow" });
    expect(alternates(meta(en, "en"))).toEqual([]);
    // بدون ردیف noindex همان hreflang دوطرفه
    expect(alternates(meta(null, "fa")).map((link) => link.href)).toEqual([
      "https://webyar.ai/help",
      "https://webyar.ai/en/help",
      "https://webyar.ai/help",
    ]);
  });

  it("drops a noindex default-language row (legacy) from other versions' hreflang", async () => {
    fake.settings = settings;
    fake.rows = [dbRow("legacy", null, { path: "/help", robots: "noindex" })];
    const en = await getPublicSeoPage({ data: { path: "/help", locale: "en" } });
    // مسیر بدون ردیف زبان‌دار: مثل قبل یک کوئری، بدون تنظیمات و بدون فیلد اضافه
    expect(fake.loadSettings).not.toHaveBeenCalled();
    expect(en && "noindexLocales" in en).toBe(false);
    expect(alternates(meta(en, "en"))).toEqual([]);
    expect(robots(meta(en, "en"))).toEqual({ name: "robots", content: "index,follow" });
    expect(robots(meta(en, "fa"))).toEqual({ name: "robots", content: "noindex" });
  });

  it("keeps hreflang between the versions that are still indexable", () => {
    // نسخه ترکی noindex است؛ فارسی و انگلیسی همچنان به هم لینک می‌دهند
    const legacy = dto("legacy", undefined, {
      path: "/help",
      robots: "index,follow",
      noindexLocales: ["tr"],
    });
    expect(alternates(meta(legacy, "fa"))).toEqual([
      { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/help" },
      { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/help" },
      { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/help" },
    ]);
    // نسخه فارسی (پیش‌فرض) noindex: فقط نسخه انگلیسی می‌ماند و hreflang ندارد
    expect(alternates(meta({ ...legacy, noindexLocales: ["fa"] }, "en"))).toEqual([]);
  });
});

describe("page key per language", () => {
  it("suffixes non-default rows and strips the suffix for editing", () => {
    expect(seoStoredPageKey("about", null)).toBe("about");
    expect(seoStoredPageKey("about", "en")).toBe("about@en");
    expect(seoStoredPageKey("about@en", "tr")).toBe("about@tr");
    expect(seoBasePageKey("about@ar")).toBe("about");
    expect(seoBasePageKey("mail@example")).toBe("mail@example");
  });
});

describe("buildPageMeta override by language", () => {
  const settings = site();
  const page = (override: SeoPageDto | null, locale: Locale) =>
    buildPageMeta({
      i18n: siteI18n(settings, locale, locale === "en" ? englishMessages : {}),
      settings,
      path: "/about",
      override,
      fallbackTitle: "درباره ما | وب‌یار",
      fallbackDescription: "توضیح",
    });
  const canonical = (result: ReturnType<typeof page>) =>
    result.links.find((link) => link.rel === "canonical")?.href;

  it("applies a language row only on its own language", () => {
    const en = dto("en", "en", {
      title: "About Webyar",
      canonicalUrl: "https://webyar.ai/en/about-us",
    });
    expect(page(en, "en").meta[0]).toEqual({ title: "About Webyar" });
    expect(canonical(page(en, "en"))).toBe("https://webyar.ai/en/about-us");
    expect(page(en, "fa").meta[0]).toEqual({ title: "درباره ما | وب‌یار" });
    expect(canonical(page(en, "fa"))).toBe("https://webyar.ai/about");
    expect(page(en, "tr").meta[0]).not.toEqual({ title: "About Webyar" });
  });

  it("applies legacy rows only on the default language", () => {
    const legacy = dto("legacy", undefined, { title: "عنوان سفارشی" });
    expect(page(legacy, "fa").meta[0]).toEqual({ title: "عنوان سفارشی" });
    expect(page(legacy, "en").meta[0]).toEqual({ title: "About us | Webyar" });
    expect(seoOverrideFor(settings, "fa", legacy)).toBe(legacy);
    expect(seoOverrideFor(settings, "en", legacy)).toBeNull();
    expect(seoOverrideFor(site("en"), "en", legacy)).toBe(legacy);
    expect(seoOverrideFor(settings, "fa", null)).toBeNull();
  });

  it("uses every language's custom canonical in hreflang", () => {
    const en = dto("en", "en", {
      canonicalUrl: "https://webyar.ai/en/about-us",
      alternateCanonicals: {
        fa: "https://webyar.ai/about-us",
        en: "https://webyar.ai/en/about-us",
      },
    });
    const expected = [
      { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/about-us" },
      { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/about-us" },
      { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/about-us" },
    ];
    expect(page(en, "en").links.filter((link) => link.rel === "alternate")).toEqual(expected);
    expect(page(en, "fa").links.filter((link) => link.rel === "alternate")).toEqual(expected);
    // رشته (امضای قبلی) یعنی canonical زبان پیش‌فرض
    expect(hreflangAlternates(settings, "/about", "https://webyar.ai/about-us")[0]).toEqual({
      hrefLang: "fa",
      href: "https://webyar.ai/about-us",
    });
  });
});

describe("getPublicSeoPage", () => {
  it("keeps the single-language result and reads no settings", async () => {
    fake.rows = [dbRow("legacy", undefined)];
    const result = await getPublicSeoPage({ data: { path: "/about", locale: null } });
    expect(result).toEqual({
      id: "legacy",
      pageKey: "about",
      path: "/about",
      title: "title legacy",
      description: "description legacy",
      ogImage: null,
      canonicalUrl: null,
      robots: "index,follow",
      schemaJson: null,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    });
    // همان کلیدها و همان ترتیب قبل؛ بدون locale/alternateCanonicals
    expect(Object.keys(result ?? {})).toEqual([
      "id",
      "pageKey",
      "path",
      "title",
      "description",
      "ogImage",
      "canonicalUrl",
      "robots",
      "schemaJson",
      "createdAt",
      "updatedAt",
    ]);
    expect(fake.loadSettings).not.toHaveBeenCalled();
    expect(fake.queries).toHaveLength(1);
    // پیش از مایگریشن (بدون ستون locale) و با ستون NULL یکسان است
    fake.rows = [dbRow("legacy", null)];
    expect(await getPublicSeoPage({ data: { path: "/about" } })).toEqual(result);
    expect(await getPublicSeoPage({ data: { path: "/missing" } })).toBeNull();
    expect(fake.loadSettings).not.toHaveBeenCalled();
  });

  it("returns the page language's row and falls back to the default row", async () => {
    fake.settings = site();
    fake.rows = [
      dbRow("legacy", null, { canonical_url: "https://webyar.ai/about-us" }),
      dbRow("en", "en"),
      dbRow("broken", "xx"),
    ];
    const en = await getPublicSeoPage({ data: { path: "/about", locale: "en" } });
    expect(en).toMatchObject({ id: "en", locale: "en" });
    expect(en?.alternateCanonicals).toEqual({ fa: "https://webyar.ai/about-us" });
    const fa = await getPublicSeoPage({ data: { path: "/about", locale: null } });
    expect(fa?.id).toBe("legacy");
    expect(fa && "locale" in fa).toBe(false);
    // زبان بدون ردیف خودش: ردیف زبان پیش‌فرض (اعمال نمی‌شود، فقط canonical برای hreflang)
    const tr = await getPublicSeoPage({ data: { path: "/about", locale: "tr" } });
    expect(tr).toMatchObject({
      id: "legacy",
      canonicalUrl: "https://webyar.ai/about-us",
      title: null,
      description: null,
    });
    expect(fa?.title).toBe("title legacy");
    // زبان نامعتبر یا غیرفعال = زبان پیش‌فرض
    expect((await getPublicSeoPage({ data: { path: "/about", locale: "de" } }))?.id).toBe("legacy");
    fake.settings = site("fa", "single");
    expect((await getPublicSeoPage({ data: { path: "/about", locale: "en" } }))?.id).toBe("legacy");
  });

  it("returns other languages' canonicals for hreflang when the page has no row of its own", async () => {
    const settings = site();
    fake.settings = settings;
    fake.rows = [
      dbRow("en", "en", {
        title: "About Webyar",
        canonical_url: "https://webyar.ai/en/about-us",
        schema_json: '{"@type":"AboutPage"}',
      }),
    ];
    fake.rows[0]!["og_image"] = "https://webyar.ai/en-og.png";
    fake.rows[0]!["description"] = "About Webyar in English";
    const fa = await getPublicSeoPage({ data: { path: "/about", locale: null } });
    const en = await getPublicSeoPage({ data: { path: "/about", locale: "en" } });
    expect(fa?.alternateCanonicals).toEqual({ en: "https://webyar.ai/en/about-us" });
    expect(en?.alternateCanonicals).toEqual({ en: "https://webyar.ai/en/about-us" });
    // صفحه فارسی فقط اطلاعات hreflang ردیف انگلیسی را می‌گیرد، نه عنوان و محتوای آن
    expect(fa).toMatchObject({
      locale: "en",
      canonicalUrl: "https://webyar.ai/en/about-us",
      robots: "index,follow",
      title: null,
      description: null,
      ogImage: null,
      schemaJson: null,
    });
    expect(en).toMatchObject({
      title: "About Webyar",
      description: "About Webyar in English",
      ogImage: "https://webyar.ai/en-og.png",
      schemaJson: '{"@type":"AboutPage"}',
    });
    // ردیف انگلیسی روی صفحه فارسی اعمال نمی‌شود (عنوان، canonical و اسکیما)
    expect(seoOverrideFor(settings, "fa", fa)).toBeNull();
    const meta = (override: SeoPageDto | null, locale: Locale) =>
      buildPageMeta({
        i18n: siteI18n(settings, locale, locale === "en" ? englishMessages : {}),
        settings,
        path: "/about",
        override,
        fallbackTitle: "درباره ما | وب‌یار",
        fallbackDescription: "توضیح",
      });
    const faMeta = meta(fa, "fa");
    const enMeta = meta(en, "en");
    expect(faMeta.meta[0]).toEqual({ title: "درباره ما | وب‌یار" });
    expect(faMeta.links.find((link) => link.rel === "canonical")?.href).toBe(
      "https://webyar.ai/about",
    );
    expect(enMeta.meta[0]).toEqual({ title: "About Webyar" });
    // hreflang دوطرفه: هر دو نسخه به canonical سفارشی نسخه انگلیسی لینک می‌دهند
    const alternates = (result: ReturnType<typeof meta>) =>
      result.links.filter((link) => link.rel === "alternate");
    expect(alternates(faMeta)).toEqual([
      { rel: "alternate", hrefLang: "fa", href: "https://webyar.ai/about" },
      { rel: "alternate", hrefLang: "en", href: "https://webyar.ai/en/about-us" },
      { rel: "alternate", hrefLang: "x-default", href: "https://webyar.ai/about" },
    ]);
    expect(alternates(enMeta)).toEqual(alternates(faMeta));
    // بدون canonical سفارشی چیزی برای hreflang نیست و مثل قبل null برمی‌گردد
    fake.rows = [dbRow("tr", "tr")];
    expect(await getPublicSeoPage({ data: { path: "/about", locale: null } })).toBeNull();
    // ردیف‌های مبهم یک زبان هم مثل قبل نادیده گرفته می‌شوند
    fake.rows = [
      dbRow("en", "en", { canonical_url: "https://webyar.ai/en/a" }),
      dbRow("en-2", "en", { canonical_url: "https://webyar.ai/en/b" }),
    ];
    expect(await getPublicSeoPage({ data: { path: "/about", locale: "en" } })).toBeNull();
  });

  it("returns null when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementationOnce(() => undefined);
    fake.rows = null as unknown as Row[];
    expect(await getPublicSeoPage({ data: { path: "/about" } })).toBeNull();
  });
});

describe("saveSeoPage", () => {
  const input = (extra: Row = {}) => ({
    pageKey: "about",
    path: "/about",
    title: "About",
    ...extra,
  });

  it("writes default-language rows without a locale", async () => {
    await saveSeoPage({ data: input() });
    expect(fake.rows).toHaveLength(1);
    expect(fake.rows[0]).toMatchObject({ id: "new-id", page_key: "about" });
    expect(fake.rows[0] && "locale" in fake.rows[0]).toBe(false);
    // زبان پیش‌فرض صریح هم ردیف بدون زبان می‌شود
    fake.rows = [];
    await saveSeoPage({ data: input({ locale: "fa" }) });
    expect(fake.rows[0] && "locale" in fake.rows[0]).toBe(false);
  });

  it("writes other languages with a suffixed key and keeps the row language on edit", async () => {
    fake.settings = site();
    fake.rows = [dbRow("legacy", null)];
    await saveSeoPage({ data: input({ locale: "en", title: "About" }) });
    expect(fake.rows[1]).toMatchObject({ page_key: "about@en", locale: "en", title: "About" });

    await saveSeoPage({ data: input({ id: "new-id", pageKey: "about", title: "About us" }) });
    expect(fake.rows[1]).toMatchObject({ page_key: "about@en", locale: "en", title: "About us" });
    expect(fake.rows[0]).toMatchObject({ page_key: "about", title: "title legacy" });
  });

  it("rejects a second row for the same path and language", async () => {
    fake.settings = site();
    fake.rows = [dbRow("legacy", null), dbRow("en", "en")];
    await expect(saveSeoPage({ data: input({ pageKey: "about-2" }) })).rejects.toThrow(
      "برای این مسیر در این زبان",
    );
    await expect(
      saveSeoPage({ data: input({ pageKey: "about-2", locale: "en" }) }),
    ).rejects.toThrow("برای این مسیر در این زبان");
    // کلیدی که پنل با پسوند زبان بفرستد، با پسوند زبان خود ردیف ذخیره می‌شود
    await saveSeoPage({ data: input({ pageKey: "about@en", locale: "tr" }) });
    expect(fake.rows).toHaveLength(3);
    expect(fake.rows[2]).toMatchObject({ page_key: "about@tr", locale: "tr" });
  });

  it("validates the input", async () => {
    await expect(saveSeoPage({ data: input({ pageKey: " " }) })).rejects.toThrow();
    await expect(saveSeoPage({ data: input({ locale: "de" }) })).rejects.toThrow();
    await expect(saveSeoPage({ data: input({ path: "" }) })).rejects.toThrow();
    expect(fake.rows).toEqual([]);
  });
});
