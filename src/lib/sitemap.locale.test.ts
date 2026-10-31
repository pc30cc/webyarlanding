// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import type { Locale } from "./locales";

type Row = Record<string, unknown>;

// تنظیمات، محتوا و جدول seo_pages ساختگی برای هندلر واقعی سایت‌مپ
const fake = vi.hoisted(() => ({
  settings: null as unknown,
  seoRows: [] as Record<string, unknown>[],
  /** ستون locale هنوز ساخته نشده (DATABASE_AUTO_MIGRATE=false) */
  noLocaleColumn: false,
  selects: [] as string[],
  posts: [] as { slug: string; updatedAt: string | null }[],
  tags: [] as { slug: string; postCount: number }[],
  products: [] as { slug: string; updatedAt: string | null }[],
  /** برنامه‌های هر زبان؛ null یعنی زبان پیش‌فرض */
  apps: {} as Record<string, { slug: string }[]>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("@/lib/settings.functions", () => ({ fetchSettings: async () => fake.settings }));
vi.mock("@/lib/blog.functions", () => ({
  listPublishedPosts: async () => fake.posts,
  listTags: async () => fake.tags,
}));
vi.mock("@/lib/catalog.functions", () => ({
  getPublicCatalog: async ({ data }: { data: { type: string } }) =>
    data.type === "product" ? [{ items: fake.products }] : [],
}));
vi.mock("@/lib/apps.functions", () => ({
  getPublicApps: async (input?: { data?: { locale?: string | null } }) =>
    fake.apps[input?.data?.locale ?? "default"] ?? [],
}));
vi.mock("@/lib/db.server", () => ({
  db: {
    from: (table: string) => ({
      select: async (columns: string) => {
        fake.selects.push(`${table}:${columns}`);
        if (fake.noLocaleColumn && /\blocale\b/.test(columns))
          return {
            data: null,
            error: { code: "42703", message: 'column "locale" does not exist' },
          };
        const names = columns.split(",").map((name) => name.trim());
        const data = fake.seoRows.map((row) =>
          Object.fromEntries(names.filter((name) => name in row).map((name) => [name, row[name]])),
        );
        return { data, error: null };
      },
    }),
  },
}));

import { Route } from "@/routes/sitemap[.]xml";

const GET = (
  Route as unknown as { options: { server: { handlers: { GET: () => Promise<Response> } } } }
).options.server.handlers.GET;

function site(mode: "single" | "multi" = "multi", locales: Locale[] = ["fa", "en"]): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.brand.siteUrl = "https://webyar.ai";
  settings.localization.language = "fa";
  settings.localization.mode = mode;
  settings.localization.locales = mode === "multi" ? locales : ["fa"];
  return settings;
}

function seoRow(path: string, locale: Locale | null, extra: Row = {}): Row {
  return { path, locale, canonical_url: null, robots: "index,follow", ...extra };
}

interface SitemapEntry {
  loc: string;
  alternates: Record<string, string>;
}

async function sitemap(): Promise<{ xml: string; entries: SitemapEntry[] }> {
  const xml = await (await GET()).text();
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body = ""]) => ({
    loc: /<loc>([^<]*)<\/loc>/.exec(body)?.[1] ?? "",
    alternates: Object.fromEntries(
      [...body.matchAll(/hreflang="([^"]*)" href="([^"]*)"/g)].map(([, lang, href]) => [
        lang,
        href,
      ]),
    ),
  }));
  return { xml, entries };
}

const locs = (entries: SitemapEntry[]) => entries.map((entry) => entry.loc);
const entry = (entries: SitemapEntry[], loc: string) => entries.find((e) => e.loc === loc);

beforeEach(() => {
  fake.settings = site();
  fake.seoRows = [];
  fake.noLocaleColumn = false;
  fake.selects = [];
  fake.posts = [];
  fake.tags = [];
  fake.products = [];
  fake.apps = {};
});

describe("sitemap custom canonicals", () => {
  it("uses only absolute same-host canonicals for <loc> and hreflang", async () => {
    fake.seoRows = [
      seoRow("/about", "en", { canonical_url: "/en/about-us" }),
      seoRow("/pricing", "en", { canonical_url: "https://webyar.com/pricing" }),
      seoRow("/contact", null, { canonical_url: "contact" }),
      seoRow("/terms", "en", { canonical_url: "ftp://webyar.ai/en/terms" }),
      seoRow("/sla", "en", { canonical_url: "https://webyar.ai/en/service-level" }),
    ];
    const { xml, entries } = await sitemap();
    // آدرس نسبی، دامنه دیگر یا پروتکل غیر http(s) کنار گذاشته می‌شود
    expect(xml).not.toContain("about-us");
    expect(xml).not.toContain("webyar.com");
    expect(xml).not.toMatch(/(href="|<loc>)contact/);
    expect(xml).not.toContain("ftp:");
    for (const loc of locs(entries)) expect(loc).toMatch(/^https:\/\/webyar\.ai\//);
    expect(entry(entries, "https://webyar.ai/en/about")?.alternates).toEqual({
      fa: "https://webyar.ai/about",
      en: "https://webyar.ai/en/about",
      "x-default": "https://webyar.ai/about",
    });
    expect(locs(entries)).toEqual(
      expect.arrayContaining([
        "https://webyar.ai/en/pricing",
        "https://webyar.ai/contact",
        "https://webyar.ai/en/terms",
      ]),
    );
    // canonical معتبر روی همین دامنه مثل قبل به‌کار می‌رود
    expect(entry(entries, "https://webyar.ai/en/service-level")?.alternates).toEqual({
      fa: "https://webyar.ai/sla",
      en: "https://webyar.ai/en/service-level",
      "x-default": "https://webyar.ai/sla",
    });
    expect(locs(entries)).not.toContain("https://webyar.ai/en/sla");
  });

  it("applies canonicals only to paths whose page reads seo_pages", async () => {
    fake.posts = [{ slug: "hello", updatedAt: null }];
    fake.tags = [{ slug: "crm", postCount: 2 }];
    fake.products = [{ slug: "chat", updatedAt: null }];
    fake.apps = { default: [{ slug: "webyar-ios" }], en: [{ slug: "webyar-ios" }] };
    fake.seoRows = [
      // صفحه برنامه override: null می‌دهد و ردیف seo_pages نمی‌خواند
      seoRow("/download/webyar-ios", null, {
        canonical_url: "https://webyar.ai/download/ios-custom",
      }),
      seoRow("/download/webyar-ios", "en", { robots: "noindex,follow" }),
      // بلاگ و برچسب فقط نسخه فارسی دارند و canonical سفارشی در سایت‌مپ نمی‌گیرند
      seoRow("/blog", null, { canonical_url: "https://webyar.ai/blog-custom" }),
      seoRow("/tag/crm", null, { canonical_url: "https://webyar.ai/tag-custom" }),
      seoRow("/blog/hello", null, { canonical_url: "https://webyar.ai/post-custom" }),
      // محصول صفحه‌ای است که getPublicSeoPage با همین مسیر می‌خواند
      seoRow("/products/chat", "en", { canonical_url: "https://webyar.ai/en/chat" }),
    ];
    const { xml, entries } = await sitemap();
    expect(xml).not.toContain("custom");
    expect(entry(entries, "https://webyar.ai/download/webyar-ios")?.alternates).toEqual({
      fa: "https://webyar.ai/download/webyar-ios",
      en: "https://webyar.ai/en/download/webyar-ios",
      "x-default": "https://webyar.ai/download/webyar-ios",
    });
    expect(locs(entries)).toContain("https://webyar.ai/en/download/webyar-ios");
    expect(locs(entries)).toEqual(
      expect.arrayContaining([
        "https://webyar.ai/blog",
        "https://webyar.ai/blog/hello",
        "https://webyar.ai/tag/crm",
        "https://webyar.ai/en/chat",
      ]),
    );
    expect(locs(entries)).not.toContain("https://webyar.ai/en/products/chat");
  });
});

describe("sitemap per-language noindex", () => {
  it("drops a noindex language version and its hreflang links", async () => {
    fake.settings = site("multi", ["fa", "en", "tr"]);
    fake.seoRows = [
      seoRow("/help", "en", { robots: "noindex,follow" }),
      seoRow("/about", null, { robots: "NOINDEX" }),
      // ردیف بدون زبان متعلق به زبان پیش‌فرض است و روی نسخه انگلیسی اثری ندارد
      seoRow("/pricing", null, { robots: "index,follow" }),
    ];
    const { entries } = await sitemap();
    expect(locs(entries)).toContain("https://webyar.ai/help");
    expect(locs(entries)).not.toContain("https://webyar.ai/en/help");
    // فقط یک نسخه قابل ایندکس می‌ماند: hreflang ندارد
    expect(entry(entries, "https://webyar.ai/help")?.alternates).toEqual({});
    expect(locs(entries)).not.toContain("https://webyar.ai/about");
    expect(locs(entries)).toContain("https://webyar.ai/en/about");
    expect(entry(entries, "https://webyar.ai/en/about")?.alternates).toEqual({});
    expect(entry(entries, "https://webyar.ai/en/pricing")?.alternates).toEqual({
      fa: "https://webyar.ai/pricing",
      en: "https://webyar.ai/en/pricing",
      "x-default": "https://webyar.ai/pricing",
    });
    expect(fake.selects).toEqual(["seo_pages:path, locale, canonical_url, robots"]);
  });
});

describe("sitemap without the seo_pages.locale column", () => {
  it("falls back to a query without locale and treats rows as default-language", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fake.noLocaleColumn = true;
    fake.seoRows = [
      { path: "/about", canonical_url: "https://webyar.ai/about-us", robots: "index,follow" },
      { path: "/help", canonical_url: null, robots: "noindex" },
    ];
    const { entries } = await sitemap();
    expect(fake.selects).toEqual([
      "seo_pages:path, locale, canonical_url, robots",
      "seo_pages:path, canonical_url, robots",
    ]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(entry(entries, "https://webyar.ai/about-us")?.alternates).toEqual({
      fa: "https://webyar.ai/about-us",
      en: "https://webyar.ai/en/about",
      "x-default": "https://webyar.ai/about-us",
    });
    expect(locs(entries)).not.toContain("https://webyar.ai/about");
    expect(locs(entries)).not.toContain("https://webyar.ai/help");
    expect(locs(entries)).toContain("https://webyar.ai/en/help");
    error.mockRestore();
  });
});

describe("single-language sitemap", () => {
  it("reads no seo_pages and lists plain URLs as before", async () => {
    fake.settings = site("single");
    fake.posts = [{ slug: "hello", updatedAt: "2026-10-02T10:00:00Z" }];
    fake.apps = { default: [{ slug: "webyar-ios" }] };
    fake.seoRows = [
      seoRow("/about", null, { canonical_url: "https://webyar.ai/about-us", robots: "noindex" }),
    ];
    const { xml } = await sitemap();
    expect(fake.selects).toEqual([]);
    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...[
          "/",
          "/products",
          "/solutions",
          "/about",
          "/pricing",
          "/contact",
          "/blog",
          "/terms",
          "/privacy",
          "/sla",
          "/help",
          "/download",
        ].map((path) => `  <url><loc>https://webyar.ai${path}</loc></url>`),
        "  <url><loc>https://webyar.ai/blog/hello</loc><lastmod>2026-10-02</lastmod></url>",
        "  <url><loc>https://webyar.ai/download/webyar-ios</loc></url>",
        "</urlset>",
      ].join("\n"),
    );
  });
});
