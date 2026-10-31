import { describe, expect, it, vi } from "vitest";

// ردیف تنظیمات محرمانه در دیتابیس ساختگی: setting_value همان JSON ذخیره‌شده است
const mocks = vi.hoisted(() => ({
  stored: null as string | null,
  writes: [] as Record<string, unknown>[],
}));
vi.mock("./db.server", () => ({
  db: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: mocks.stored === null ? null : { id: "private", setting_value: mocks.stored },
            error: null,
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        mocks.writes.push(payload);
        return { eq: async () => ({ error: null }) };
      },
      insert: async (payload: Record<string, unknown>) => {
        mocks.writes.push(payload);
        return { error: null };
      },
    }),
  },
  newId: () => "new-id",
  nowIso: () => "2026-10-31T00:00:00Z",
  parseJson: (value: string | null | undefined, fallback: unknown) =>
    value ? JSON.parse(value) : fallback,
}));
import { loadAiKeys, saveAiKeys } from "./settings.server";

describe("private settings", () => {
  it("ignores the removed destination-database connection and drops it on the next save", async () => {
    mocks.stored = JSON.stringify({
      aiOpenaiApiKey: "openai",
      captchaSecret: "captcha",
      url: "https://old.example",
      serviceRoleKey: "old-secret",
    });
    expect(await loadAiKeys()).toMatchObject({ aiOpenaiApiKey: "openai", aiGeminiApiKey: "" });

    await saveAiKeys({ aiGeminiApiKey: "gemini" });

    expect(mocks.writes).toHaveLength(1);
    expect(JSON.parse(String(mocks.writes[0]!["setting_value"]))).toEqual({
      aiOpenaiApiKey: "openai",
      aiGeminiApiKey: "gemini",
      captchaSecret: "captcha",
    });
  });
});
