import { describe, expect, it } from "vitest";
import { createLocaleRewrite, localeRedirectTarget, persianBlogPath } from "./locale-routing";
import { DEFAULT_SETTINGS, isBlogAvailable, mergeSettings, pageContentLocale } from "./settings";
import type { Locale } from "./locales";

function site(language: Locale, mode: "single" | "multi", locales: Locale[]) {
  return mergeSettings({
    localization: { ...DEFAULT_SETTINGS.localization, language, mode, locales },
  });
}

describe("localeRedirectTarget", () => {
  const multiFa = site("fa", "multi", ["fa", "en", "tr"]);

  it("leaves unprefixed pages and served languages alone", () => {
    expect(localeRedirectTarget("/pricing", "?v=2.10", multiFa)).toBeNull();
    expect(localeRedirectTarget("/en/pricing", "", multiFa)).toBeNull();
    expect(localeRedirectTarget("/tr", "", multiFa)).toBeNull();
    expect(localeRedirectTarget("/blog/post", "", multiFa)).toBeNull();
  });

  it("sends the default language prefix to the unprefixed URL permanently", () => {
    expect(localeRedirectTarget("/fa/pricing", "?a=1", multiFa)).toEqual({
      location: "/pricing?a=1",
      status: 301,
    });
    expect(localeRedirectTarget("/fa", "", multiFa)).toEqual({ location: "/", status: 301 });
  });

  it("sends inactive languages to the default language temporarily", () => {
    expect(localeRedirectTarget("/ar/about", "", multiFa)).toEqual({
      location: "/about",
      status: 302,
    });
    const single = site("fa", "single", ["fa", "en"]);
    expect(localeRedirectTarget("/en/pricing", "", single)).toEqual({
      location: "/pricing",
      status: 302,
    });
  });

  it("keeps the blog Persian-only on multi-language sites", () => {
    expect(localeRedirectTarget("/en/blog/post", "?x=1", multiFa)).toEqual({
      location: "/blog/post?x=1",
      status: 301,
    });
    expect(localeRedirectTarget("/tr/tag/crm", "", multiFa)).toEqual({
      location: "/tag/crm",
      status: 301,
    });
    const multiEn = site("en", "multi", ["en", "fa"]);
    expect(localeRedirectTarget("/blog", "", multiEn)).toEqual({
      location: "/fa/blog",
      status: 301,
    });
    expect(localeRedirectTarget("/fa/blog", "", multiEn)).toBeNull();
    const noFa = site("en", "multi", ["en", "tr"]);
    expect(localeRedirectTarget("/tr/blog", "", noFa)).toEqual({ location: "/tr", status: 302 });
  });

  it("keeps the blog on single-language sites", () => {
    expect(localeRedirectTarget("/blog", "", site("en", "single", ["en"]))).toBeNull();
  });

  it("never redirects to another host", () => {
    for (const path of ["/fa//evil.com/", "/en//evil.com/x", "/fa/\\evil.com/", "/en//pricing"])
      expect(localeRedirectTarget(path, "", multiFa)).toBeNull();
  });

  it("ignores paths that never carry a language", () => {
    expect(localeRedirectTarget("/en/admin", "", multiFa)).toBeNull();
    expect(localeRedirectTarget("/fa/favicon.svg", "", multiFa)).toBeNull();
    expect(localeRedirectTarget("/xx/pricing", "", multiFa)).toBeNull();
  });
});

describe("createLocaleRewrite", () => {
  const rewrite = createLocaleRewrite("en");
  const input = (path: string) => rewrite.input({ url: new URL(path, "http://x") })?.pathname;
  const output = (path: string) => rewrite.output({ url: new URL(path, "http://x") })?.pathname;

  it("strips its own prefix on input only", () => {
    expect(input("/en/pricing")).toBe("/pricing");
    expect(input("/en")).toBe("/");
    expect(input("/tr/pricing")).toBeUndefined();
    expect(input("/admin")).toBeUndefined();
  });

  it("prefixes localizable links on output", () => {
    expect(output("/about")).toBe("/en/about");
    expect(output("/")).toBe("/en");
    expect(output("/admin/blog")).toBeUndefined();
    expect(output("/go/webyar-ios")).toBeUndefined();
    expect(output("/og-image.png")).toBeUndefined();
  });
});

describe("blog and legal pages per language", () => {
  it("has the blog only in Persian on multi-language sites", () => {
    const multi = site("fa", "multi", ["fa", "en"]);
    expect(isBlogAvailable(multi, "fa")).toBe(true);
    expect(isBlogAvailable(multi, "en")).toBe(false);
    expect(isBlogAvailable(site("en", "single", ["en"]), "en")).toBe(true);
    expect(persianBlogPath(multi, "/blog/x")).toBe("/blog/x");
    expect(persianBlogPath(site("en", "multi", ["en", "fa"]), "/blog/x")).toBe("/fa/blog/x");
  });

  it("shows each language's own legal text", () => {
    const multi = site("fa", "multi", ["fa", "en", "tr", "ar"]);
    expect(pageContentLocale(multi, "tr", "/privacy")).toBe("tr");
    expect(pageContentLocale(multi, "ar", "/terms/")).toBe("ar");
    expect(pageContentLocale(multi, "ar", "/help")).toBe("ar");
    expect(pageContentLocale(multi, "ar", "/about")).toBe("ar");
    expect(pageContentLocale(multi, "fa", "/privacy")).toBe("fa");
    expect(pageContentLocale(site("fa", "single", ["fa"]), "fa", "/privacy")).toBe("en");
  });

  it("shows English legal text for a language without its own", () => {
    // همه زبان‌های فعلی متن حقوقی دارند؛ زبانی تازه که هنوز متن ندارد انگلیسی می‌گیرد، نه فارسی
    const future = "de" as Locale;
    const multi = site("fa", "multi", ["fa", "en", "tr", "ar"]);
    for (const path of ["/privacy", "/terms/", "/help"])
      expect(pageContentLocale(multi, future, path)).toBe("en");
    expect(pageContentLocale(multi, future, "/about")).toBe(future);
  });

  it("tolerates a malformed stored language list", () => {
    const settings = mergeSettings({
      localization: { language: "fa", mode: "multi", locales: { en: true }, english: {} } as never,
    });
    expect(settings.localization.locales).toEqual(["fa"]);
  });
});
