import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import type { Locale } from "@/lib/locales";

// loader ریشه: کلید overrides فقط وقتی در داده صفحه است که چیزی برای فرستادن باشد
const mocks = vi.hoisted(() => ({
  settings: null as unknown,
  loadPageTranslations: vi.fn(),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  // Route همان تنظیمات route است تا loader مستقیم صدا زده شود
  createRootRouteWithContext: () => (options: unknown) => ({ options }),
}));
vi.mock("@/lib/settings.functions", () => ({ fetchSettings: async () => mocks.settings }));
vi.mock("@/lib/catalog.functions", () => ({ getPublicCatalog: async () => [] }));
vi.mock("@/lib/site-messages", () => ({
  cachedSiteMessages: () => ({}),
  loadAllSiteMessages: async () => {},
  loadSiteMessages: async () => {},
}));
vi.mock("@/lib/site-translations.functions", () => ({
  loadPageTranslations: mocks.loadPageTranslations,
}));

import { Route } from "./__root";

type Loader = (ctx: {
  context: { urlLocale: Locale | null };
  location: { href: string };
}) => Promise<Record<string, unknown>>;

function multiSite(): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en", "tr", "ar"];
  return settings;
}

async function loadRoot(urlLocale: Locale | null) {
  const { loader } = (Route as unknown as { options: { loader: Loader } }).options;
  return loader({
    context: { urlLocale },
    location: { href: urlLocale ? `/${urlLocale}/pricing` : "/pricing" },
  });
}

beforeEach(() => {
  mocks.settings = multiSite();
  mocks.loadPageTranslations.mockReset();
});

describe("root loader overrides", () => {
  it("leaves out an empty map for Turkish and Arabic pages", async () => {
    mocks.loadPageTranslations.mockResolvedValue({});
    for (const locale of ["tr", "ar"] as const) {
      const data = await loadRoot(locale);
      expect(data["locale"]).toBe(locale);
      expect(data).not.toHaveProperty("overrides");
    }
  });

  it("sends a map that has translations", async () => {
    mocks.loadPageTranslations.mockResolvedValue({ "چت زنده": "دردشة مباشرة" });
    expect((await loadRoot("ar"))["overrides"]).toEqual({ "چت زنده": "دردشة مباشرة" });
  });

  it("keeps an empty English map (the row replaces the legacy settings copy)", async () => {
    mocks.loadPageTranslations.mockResolvedValue({});
    expect((await loadRoot("en"))["overrides"]).toEqual({});
    // بدون ردیف انگلیسی چیزی فرستاده نمی‌شود (ترجمه‌ها همان localization.english است)
    mocks.loadPageTranslations.mockResolvedValue(undefined);
    expect(await loadRoot("en")).not.toHaveProperty("overrides");
  });

  it("never reads or sends translations for Persian pages", async () => {
    const data = await loadRoot(null);
    expect(Object.keys(data)).toEqual(["settings", "productCatalog", "solutionCatalog", "locale"]);
    mocks.settings = structuredClone(DEFAULT_SETTINGS);
    expect(Object.keys(await loadRoot(null))).toEqual([
      "settings",
      "productCatalog",
      "solutionCatalog",
      "locale",
    ]);
    expect(mocks.loadPageTranslations).not.toHaveBeenCalled();
  });
});
