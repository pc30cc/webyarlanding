import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteLanguageProvider } from "./SiteLanguage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import type { Locale } from "@/lib/locales";

const state = vi.hoisted(() => ({
  pathname: "/pricing",
  searchStr: "?plan=pro",
  matches: [] as { loaderData?: unknown }[],
}));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({
      location: { pathname: state.pathname, searchStr: state.searchStr },
      matches: state.matches,
    }),
}));

function site(mode: "single" | "multi", locales: Locale[], language: Locale = "fa"): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization = { ...settings.localization, language, mode, locales };
  return settings;
}

function links(
  settings: SiteSettings,
  locale: Locale,
  path = "/pricing",
  search = "?plan=pro",
  matches: { loaderData?: unknown }[] = [],
) {
  state.pathname = path;
  state.matches = matches;
  state.searchStr = search;
  const html = renderToStaticMarkup(
    <SiteLanguageProvider settings={settings} locale={locale}>
      <LanguageSwitcher settings={settings} variant="mobile" />
    </SiteLanguageProvider>,
  );
  return [...html.matchAll(/<a href="([^"]*)" hrefLang="([^"]*)"/g)].map((m) => [m[2], m[1]]);
}

describe("LanguageSwitcher", () => {
  it("renders nothing on a single-language site", () => {
    expect(links(site("single", ["fa", "en"]), "fa")).toEqual([]);
    expect(links(site("multi", ["fa"]), "fa")).toEqual([]);
  });

  it("links the same page in every active language", () => {
    expect(links(site("multi", ["fa", "en", "ar"]), "en")).toEqual([
      ["fa", "/pricing?plan=pro"],
      ["en", "/en/pricing?plan=pro"],
      ["ar", "/ar/pricing?plan=pro"],
    ]);
    expect(links(site("multi", ["en", "fa"], "en"), "fa", "/")).toEqual([
      ["en", "/?plan=pro"],
      ["fa", "/fa?plan=pro"],
    ]);
  });

  it("sends other languages to their home page from the Persian-only blog", () => {
    expect(links(site("multi", ["fa", "en"]), "fa", "/blog/post", "")).toEqual([
      ["fa", "/blog/post"],
      ["en", "/en"],
    ]);
  });

  it("sends languages where the app is hidden to their download list, not a 404", () => {
    // بازبینی: برنامه پنهان در انگلیسی، از /download/<slug> به /en/download/<slug> (۴۰۴) لینک می‌شد
    const matches = [
      { loaderData: { locale: "fa" } },
      { loaderData: { app: { slug: "android", visibleLocales: ["fa", "tr"] }, others: [] } },
    ];
    expect(
      links(site("multi", ["fa", "en", "tr", "ar"]), "fa", "/download/android", "?ref=x", matches),
    ).toEqual([
      ["fa", "/download/android?ref=x"],
      ["en", "/en/download"],
      ["tr", "/tr/download/android?ref=x"],
      ["ar", "/ar/download"],
    ]);
    // زبان پیش‌فرض بدون پیشوند
    expect(
      links(site("multi", ["fa", "en"]), "en", "/download/mac", "", [
        { loaderData: { app: { visibleLocales: ["en"] } } },
      ]),
    ).toEqual([
      ["fa", "/download"],
      ["en", "/en/download/mac"],
    ]);
  });

  it("links every language as before when the page does not list its languages", () => {
    // سایت تک‌زبانه visibleLocales ندارد و سوئیچر چیزی نمی‌سازد
    const app = [{ loaderData: { app: { visibleLocales: ["fa"] } } }];
    expect(links(site("single", ["fa", "en"]), "fa", "/download/android", "", app)).toEqual([]);
    expect(
      links(site("multi", ["fa", "en"]), "fa", "/download/android", "", [
        { loaderData: { app: { slug: "android" }, others: [{ visibleLocales: ["fa"] }] } },
      ]),
    ).toEqual([
      ["fa", "/download/android"],
      ["en", "/en/download/android"],
    ]);
  });

  it("reads visibleLocales only from the page route's loader data", () => {
    const multi = site("multi", ["fa", "en"]);
    const every = [
      ["fa", "/download/x"],
      ["en", "/en/download/x"],
    ];
    expect(links(multi, "fa", "/download/x", "", [{ loaderData: undefined }])).toEqual(every);
    // visibleLocales در خود داده صفحه
    expect(
      links(multi, "fa", "/download/x", "", [{ loaderData: { visibleLocales: ["fa"] } }]),
    ).toEqual([
      ["fa", "/download/x"],
      ["en", "/en/download"],
    ]);
    // فقط route صفحه (آخرین match)، نه route ریشه
    expect(
      links(multi, "fa", "/download/x", "", [
        { loaderData: { visibleLocales: ["fa"] } },
        { loaderData: {} },
      ]),
    ).toEqual(every);
  });
});
