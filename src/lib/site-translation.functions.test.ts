import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildTranslationBatches } from "./site-translation-batches";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  aiJson: vi.fn(),
  range: vi.fn(),
}));
vi.mock("./auth.server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("./ai.server", () => ({ aiJson: mocks.aiJson }));
vi.mock("./db.server", () => ({
  db: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ range: mocks.range }) }) }),
    }),
  },
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

import {
  adminTranslateSiteMessages,
  adminListTranslationPosts,
} from "./site-translation.functions";

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

describe("published article translation inventory", () => {
  it("reads beyond the first 500 articles without omitting content", async () => {
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.range.mockReset();
    mocks.range.mockResolvedValueOnce({
      data: Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        title: "Title",
      })),
      error: null,
    });
    mocks.range.mockResolvedValueOnce({
      data: [{ id: "500", title: "Last article" }],
      error: null,
    });
    expect(await adminListTranslationPosts()).toHaveLength(501);
    expect(mocks.range).toHaveBeenNthCalledWith(1, 0, 499);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 500, 999);
  });
  it("reports inventory failures rather than activating English with missing articles", async () => {
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.range.mockReset();
    mocks.range.mockResolvedValue({
      data: null,
      error: new Error("Inventory unavailable"),
    });
    await expect(adminListTranslationPosts()).rejects.toThrow(
      "Inventory unavailable",
    );
  });
});
