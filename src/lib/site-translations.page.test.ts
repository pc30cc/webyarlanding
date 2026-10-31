import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

// ترجمه‌های صفحه برای loader ریشه و کش hydration (فایل جدا: کش ماژول site-i18n تازه است)
const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("./site-translations.server", () => ({ loadSiteTranslations: mocks.load }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (handle: () => unknown) => handle,
    inputValidator: (validate: (input: unknown) => unknown) => ({
      handler: (handle: (args: { data: unknown }) => unknown) => async (args: { data: unknown }) =>
        handle({ data: validate(args.data) }),
    }),
  }),
}));

import { loadPageTranslations } from "./site-translations.functions";
import {
  SITE_TRANSLATIONS_TTL_MS,
  cachedSiteTranslations,
  i18nFromMatches,
  invalidateSiteTranslations,
  primeHydratedSiteTranslations,
  siteI18n,
} from "./site-i18n";

let now = 1_000_000;
beforeEach(() => {
  mocks.load.mockReset();
  now += 10 * SITE_TRANSLATIONS_TTL_MS; // هر تست با کش کهنه شروع می‌شود
  vi.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// پیش از تست‌های loader، تا کش هیچ زبانی هنوز پر نشده باشد
describe("priming the cache from hydrated root data", () => {
  it("does nothing during server render", () => {
    vi.stubGlobal("window", undefined);
    primeHydratedSiteTranslations("tr", { a: "old" });
    vi.unstubAllGlobals();
    // پس از رندر سرور هم کش پر نشده است (loader نسخه درست را گذاشته بود یا هیچ)
    expect(cachedSiteTranslations("tr")).toBeUndefined();
  });

  it("primes in the browser only while nothing is cached for the locale", async () => {
    primeHydratedSiteTranslations("ar", undefined);
    expect(cachedSiteTranslations("ar")).toBeUndefined();
    const hydrated = { a: "hydrated" };
    expect(cachedSiteTranslations("en")).toBeUndefined();
    mocks.load.mockResolvedValue(null);
    primeHydratedSiteTranslations("en", hydrated);
    expect(cachedSiteTranslations("en")).toBe(hydrated);
    expect(await loadPageTranslations("en")).toBe(hydrated);
    expect(mocks.load).not.toHaveBeenCalled();
    // پس از آن loader کش را نگه می‌دارد؛ رندر دوباره با داده قدیمی‌تر آن را عوض نمی‌کند
    now += SITE_TRANSLATIONS_TTL_MS;
    mocks.load.mockResolvedValue({ a: "newer" });
    expect(await loadPageTranslations("en")).toEqual({ a: "newer" });
    primeHydratedSiteTranslations("en", hydrated);
    expect(cachedSiteTranslations("en")).toEqual({ a: "newer" });
    expect(
      i18nFromMatches([], { context: { urlLocale: "en" } }, { settings: englishSite() })?.translate(
        "a",
      ),
    ).toBe("newer");
  });
});

describe("root loader translations", () => {
  it("sends nothing for English whose translations are still in the settings", async () => {
    mocks.load.mockResolvedValue(null);
    expect(await loadPageTranslations("en")).toBeUndefined();
    // تازه در کش: ناوبری بعدی دوباره نمی‌خواند
    expect(await loadPageTranslations("en")).toBeUndefined();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(cachedSiteTranslations("en")).toBeUndefined();
    // بدون overrides، مترجم صفحه ترجمه‌های قدیمی تنظیمات را می‌خواند (یک‌بار، نه دو بار)
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.english = { "چت زنده": "Live chat" };
    expect(
      siteI18n(settings, "en", {}, await loadPageTranslations("en")).translate("چت زنده"),
    ).toBe("Live chat");
  });

  it("sends the locale's own map once it exists and skips Persian", async () => {
    mocks.load.mockResolvedValue({ "چت زنده": "Canlı sohbet" });
    expect(await loadPageTranslations("tr")).toEqual({ "چت زنده": "Canlı sohbet" });
    expect(await loadPageTranslations("fa")).toBeUndefined();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.load).toHaveBeenCalledWith("tr");
  });

  it("falls back to the last loaded map when reading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.load.mockResolvedValue({ a: "A" });
    await loadPageTranslations("ar");
    invalidateSiteTranslations();
    mocks.load.mockRejectedValue(new Error("DB down"));
    expect(await loadPageTranslations("ar")).toEqual({ a: "A" });
  });
});

function englishSite() {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en"];
  return settings;
}
