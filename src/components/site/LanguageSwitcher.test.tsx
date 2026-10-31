import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteLanguageProvider } from "./SiteLanguage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import type { Locale } from "@/lib/locales";

const state = vi.hoisted(() => ({ pathname: "/pricing", searchStr: "?plan=pro" }));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: state.pathname, searchStr: state.searchStr } }),
}));

function site(mode: "single" | "multi", locales: Locale[], language: Locale = "fa"): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization = { ...settings.localization, language, mode, locales };
  return settings;
}

function links(settings: SiteSettings, locale: Locale, path = "/pricing", search = "?plan=pro") {
  state.pathname = path;
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
});
