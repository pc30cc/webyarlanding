import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  load: vi.fn(),
  read: vi.fn(),
  save: vi.fn(),
}));
vi.mock("./auth.server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("./site-translations.server", () => ({
  loadSiteTranslations: mocks.load,
  readSiteTranslations: mocks.read,
  saveSiteTranslations: mocks.save,
}));
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
  adminGetSiteTranslations,
  adminSaveSiteTranslations,
  fetchSiteTranslations,
} from "./site-translations.functions";

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.save.mockResolvedValue({ clearedLegacy: false });
});

describe("public translations", () => {
  it("returns nothing for Persian without touching the database", async () => {
    expect(await fetchSiteTranslations({ data: { locale: "fa" } })).toEqual({});
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it("returns the map of one locale", async () => {
    mocks.load.mockResolvedValue({ متن: "Metin" });
    expect(await fetchSiteTranslations({ data: { locale: "tr" } })).toEqual({ متن: "Metin" });
    expect(mocks.load).toHaveBeenCalledWith("tr");
  });
  it("rejects unknown locales", async () => {
    await expect(fetchSiteTranslations({ data: { locale: "de" } })).rejects.toThrow();
  });
});

describe("admin translations", () => {
  it("requires an administrator for reading and saving", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(adminGetSiteTranslations()).rejects.toThrow("UNAUTHORIZED");
    await expect(
      adminSaveSiteTranslations({ data: { locale: "en", translations: {} } }),
    ).rejects.toThrow("UNAUTHORIZED");
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("returns every translated locale strictly and flags legacy English", async () => {
    mocks.read.mockImplementation(async (locale: string) => ({
      translations: { متن: locale },
      legacy: locale === "en",
    }));
    expect(await adminGetSiteTranslations()).toEqual({
      translations: { en: { متن: "en" }, tr: { متن: "tr" }, ar: { متن: "ar" } },
      legacyEnglish: true,
    });
    expect(mocks.read.mock.calls).toEqual([
      ["en", true],
      ["tr", true],
      ["ar", true],
    ]);
  });
  it("normalizes keys like the site translator and drops empty translations", async () => {
    mocks.save.mockResolvedValue({ clearedLegacy: true });
    expect(
      await adminSaveSiteTranslations({
        data: {
          locale: "ar",
          translations: { "  متن\n  اول ": "النص", "متن دوم": "   " },
        },
      }),
    ).toEqual({ ok: true, clearedLegacy: true });
    expect(mocks.save).toHaveBeenCalledWith("ar", { "متن اول": "النص" });
  });
  it.each([
    { locale: "fa", translations: {} },
    { locale: "en", translations: { متن: 3 } },
    { locale: "en", translations: [] },
    { locale: "en", translations: { متن: "x".repeat(100_001) } },
  ])("rejects invalid input %#", async (data) => {
    await expect(adminSaveSiteTranslations({ data })).rejects.toThrow();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
