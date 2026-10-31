import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildTranslationBatches } from "./site-translation-batches";
import { DEFAULT_SETTINGS } from "./settings";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  aiJson: vi.fn(),
}));
vi.mock("./auth.server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("./ai.server", () => ({ aiJson: mocks.aiJson }));
vi.mock("./settings.server", () => ({
  loadSettings: async () => DEFAULT_SETTINGS,
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (handle: () => unknown) => handle,
    inputValidator: (validate: (input: unknown) => unknown) => ({
      handler:
        (handle: (args: { data: unknown }) => unknown) =>
        async (args: { data: unknown }) =>
          handle({ data: validate(args.data) }),
    }),
  }),
}));

import { adminTranslateSiteMessages } from "./site-translation.functions";

describe("admin-only content translation", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.aiJson.mockReset();
  });
  it("requires an administrator before contacting the provider", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["متن"] } }),
    ).rejects.toThrow("Unauthorized");
    expect(mocks.aiJson).not.toHaveBeenCalled();
  });
  it("returns complete translations while preserving Persian URL slugs", async () => {
    mocks.aiJson.mockResolvedValue({
      translations: ["A [link](https://example.com/مقاله)"],
    });
    expect(
      await adminTranslateSiteMessages({ data: { texts: ["یک پیوند"] } }),
    ).toEqual(["A [link](https://example.com/مقاله)"]);
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
  });
  it("rejects missing or untranslated outputs rather than activating a mixed-language site", async () => {
    mocks.aiJson.mockResolvedValue({ translations: [] });
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["متن"] } }),
    ).rejects.toThrow("ترجمه کامل");
    mocks.aiJson.mockResolvedValue({ translations: ["متن فارسی"] });
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["متن"] } }),
    ).rejects.toThrow("هنوز فارسی");
  });
  it("rejects oversized requests before contacting the provider", async () => {
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["x".repeat(12_001)] } }),
    ).rejects.toThrow();
    expect(mocks.aiJson).not.toHaveBeenCalled();
  });
});

describe("translation into other languages", () => {
  /** متن عربی با حروف عربی (ي عربی، نه ی فارسی) */
  const arabic = "\u062f\u0631\u062f\u0634\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0641\u064a \u0645\u0648\u0642\u0639\u0643";
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.aiJson.mockReset();
  });
  it("keeps English as the default target and the Latin brand rule", async () => {
    mocks.aiJson.mockResolvedValue({ translations: ["Live chat"] });
    await adminTranslateSiteMessages({ data: { texts: ["چت زنده"] } });
    const prompt = mocks.aiJson.mock.calls[0]![0] as string;
    expect(prompt).toContain("Persian-to-English");
    expect(prompt).toContain('"وب‌یار" as "Webyar"');
  });
  it("uses a locale-specific prompt for Arabic and accepts Arabic output", async () => {
    mocks.aiJson.mockResolvedValue({ translations: [arabic] });
    expect(
      await adminTranslateSiteMessages({
        data: { texts: ["چت زنده در سایت شما"], targetLocale: "ar" },
      }),
    ).toEqual([arabic]);
    const prompt = mocks.aiJson.mock.calls[0]![0] as string;
    expect(prompt).toContain("Persian-to-Arabic");
    expect(prompt).toContain("Western digits");
    expect(prompt).toContain('"Webyar"');
  });
  it("rejects Arabic output that is still Persian", async () => {
    mocks.aiJson.mockResolvedValue({ translations: ["چت زنده"] });
    await expect(
      adminTranslateSiteMessages({
        data: { texts: ["چت زنده"], targetLocale: "ar" },
      }),
    ).rejects.toThrow("هنوز فارسی");
    // بدون حرف مخصوص فارسی، ولی عیناً همان متن مبدأ
    mocks.aiJson.mockResolvedValue({ translations: ["تماس"] });
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["تماس"], targetLocale: "ar" } }),
    ).rejects.toThrow("هنوز فارسی");
  });
  it("translates into Turkish and rejects Persian left in it", async () => {
    mocks.aiJson.mockResolvedValue({ translations: ["Canlı sohbet"] });
    expect(
      await adminTranslateSiteMessages({ data: { texts: ["چت زنده"], targetLocale: "tr" } }),
    ).toEqual(["Canlı sohbet"]);
    expect(mocks.aiJson.mock.calls[0]![0]).toContain("Persian-to-Turkish");
    mocks.aiJson.mockResolvedValue({ translations: ["Canlı چت"] });
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["چت زنده"], targetLocale: "tr" } }),
    ).rejects.toThrow("هنوز فارسی");
  });
  it("rejects Persian as a target", async () => {
    await expect(
      adminTranslateSiteMessages({ data: { texts: ["متن"], targetLocale: "fa" } }),
    ).rejects.toThrow();
    expect(mocks.aiJson).not.toHaveBeenCalled();
  });
});

describe("translation batches", () => {
  it("preserves every paragraph and bounds batches", () => {
    const source = [
      "# Heading",
      "a".repeat(4000),
      "b".repeat(4000),
      "c".repeat(4000),
    ].join("\n\n");
    const batches = buildTranslationBatches([source, "Another source"]);
    const chunks = batches.flat().filter((chunk) => chunk.source === source);
    expect(chunks.map((chunk) => chunk.text).join("\n\n")).toBe(source);
    expect(chunks.map((chunk) => chunk.index)).toEqual([0, 1, 2]);
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(6);
      expect(
        batch.map((chunk) => chunk.text).join("").length,
      ).toBeLessThanOrEqual(12_000);
    }
  });
});
