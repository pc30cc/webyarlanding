import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

// جدول settings در حافظه (فقط همان بخشی از API که این ماژول‌ها استفاده می‌کنند)
const mocks = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  reads: [] as string[],
  failKey: null as string | null,
}));
vi.mock("./db.server", () => {
  const byId = (id: unknown) => Array.from(mocks.rows.values()).find((row) => row["id"] === id);
  return {
    db: {
      from: () => ({
        select: () => ({
          eq: (_column: string, key: string) => ({
            maybeSingle: async () => {
              mocks.reads.push(key);
              if (key === mocks.failKey) return { data: null, error: new Error("DB down") };
              return { data: mocks.rows.get(key) ?? null, error: null };
            },
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_column: string, id: unknown) => {
            const row = byId(id);
            if (row) Object.assign(row, payload);
            return { error: null };
          },
        }),
        insert: async (payload: Record<string, unknown>) => {
          mocks.rows.set(String(payload["setting_key"]), { ...payload });
          return { error: null };
        },
      }),
    },
    newId: () => "id-" + (mocks.rows.size + 1),
    nowIso: () => "2026-10-31T00:00:00Z",
    parseJson: <T>(value: string | null | undefined, fallback: T): T => {
      if (!value) return fallback;
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    },
  };
});

import { saveSettings, settingsRevision } from "./settings.server";
import {
  loadSiteTranslations,
  readSiteTranslations,
  saveSiteTranslations,
} from "./site-translations.server";
import { SITE_TRANSLATIONS_TTL_MS, cachedSiteTranslations } from "./site-i18n";

function storeSettings(value: unknown) {
  mocks.rows.set("site_settings", {
    id: "site",
    setting_key: "site_settings",
    setting_value: JSON.stringify(value),
    is_private: 0,
  });
}
const storedSettings = () => JSON.parse(String(mocks.rows.get("site_settings")!["setting_value"]));
const storedRow = (key: string) => JSON.parse(String(mocks.rows.get(key)!["setting_value"]));

/** تنظیمات قدیمی: ترجمه‌های انگلیسی داخل JSON تنظیمات عمومی + فیلدی که پیش‌فرض‌ها ندارند */
const legacy = {
  localization: { language: "fa", mode: "multi", locales: ["fa", "en"], english: { متن: "Text" } },
  brand: { name: "نام ویژه" },
  futureSection: { keep: true },
};

let now = 1_000_000;
beforeEach(() => {
  mocks.rows.clear();
  mocks.reads.length = 0;
  mocks.failKey = null;
  now += 10 * SITE_TRANSLATIONS_TTL_MS; // هر تست با کش کهنه شروع می‌شود
  vi.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());

describe("per-locale editor translations", () => {
  it("reads legacy English translations from the public settings until the row exists", async () => {
    storeSettings(legacy);
    expect(await readSiteTranslations("en", true)).toEqual({
      translations: { متن: "Text" },
      legacy: true,
    });
    // ترکی و عربی هیچ داده قدیمی ندارند؛ فارسی زبان مبدأ است
    expect(await readSiteTranslations("tr", true)).toEqual({ translations: {}, legacy: false });
    expect(await readSiteTranslations("fa")).toEqual({ translations: {}, legacy: false });
    expect(await loadSiteTranslations("en")).toEqual({ متن: "Text" });
  });

  it("stores each locale in its own row and clears the legacy copy on the first English save", async () => {
    storeSettings(legacy);
    const revision = settingsRevision;
    const result = await saveSiteTranslations("en", { متن: "New text" });
    expect(result).toEqual({ clearedLegacy: true });
    expect(storedRow("site_translations_en")).toEqual({ متن: "New text" });
    expect(mocks.rows.get("site_translations_en")!["is_private"]).toBe(0);
    // خواندن-تغییر-نوشتن روی ردیف خام: فقط english خالی شده، بقیه دست‌نخورده
    expect(storedSettings()).toEqual({
      ...legacy,
      localization: { ...legacy.localization, english: {} },
    });
    expect(settingsRevision).toBe(revision + 1);
    expect(await readSiteTranslations("en", true)).toEqual({
      translations: { متن: "New text" },
      legacy: false,
    });
    // ذخیره بعدی چیزی برای پاک کردن ندارد
    expect(await saveSiteTranslations("en", { متن: "Newer" })).toEqual({ clearedLegacy: false });
    await saveSiteTranslations("ar", { متن: "نص" });
    expect(storedRow("site_translations_ar")).toEqual({ متن: "نص" });
    expect(storedRow("site_translations_en")).toEqual({ متن: "Newer" });
  });

  it("does not let a stale settings form write legacy English back after migration", async () => {
    storeSettings(legacy);
    await saveSiteTranslations("en", { متن: "New text" });
    const form = structuredClone(DEFAULT_SETTINGS);
    form.localization.english = { متن: "Text" };
    await saveSettings(form);
    expect(storedSettings().localization.english).toEqual({});
  });

  it("keeps legacy English in settings saves while no English row exists", async () => {
    storeSettings(legacy);
    const form = structuredClone(DEFAULT_SETTINGS);
    form.localization.english = { متن: "Text" };
    await saveSettings(form);
    expect(storedSettings().localization.english).toEqual({ متن: "Text" });
  });

  it("ignores malformed stored values", async () => {
    mocks.rows.set("site_translations_tr", {
      id: "tr",
      setting_key: "site_translations_tr",
      setting_value: JSON.stringify({ a: "A", b: 3, c: "  ", d: null }),
    });
    expect((await readSiteTranslations("tr")).translations).toEqual({ a: "A" });
    mocks.rows.set("site_translations_tr", {
      id: "tr",
      setting_key: "site_translations_tr",
      setting_value: "not json",
    });
    expect((await readSiteTranslations("tr")).translations).toEqual({});
  });

  it("reports database errors instead of returning an empty map", async () => {
    mocks.failKey = "site_translations_tr";
    await expect(readSiteTranslations("tr", true)).rejects.toThrow("DB down");
    await expect(loadSiteTranslations("tr")).rejects.toThrow("DB down");
  });

  it("caches the public map briefly and refreshes it after an admin save", async () => {
    await saveSiteTranslations("tr", { متن: "Metin" });
    mocks.reads.length = 0;
    expect(await loadSiteTranslations("tr")).toEqual({ متن: "Metin" });
    expect(await loadSiteTranslations("tr")).toEqual({ متن: "Metin" });
    expect(mocks.reads).toEqual(["site_translations_tr"]);
    expect(cachedSiteTranslations("tr")).toEqual({ متن: "Metin" });
    // ذخیره مدیر کش همین فرایند را بلافاصله کهنه می‌کند
    await saveSiteTranslations("tr", { متن: "Yeni metin" });
    expect(await loadSiteTranslations("tr")).toEqual({ متن: "Yeni metin" });
    // تغییر از نمونه دیگر سرور: پس از TTL دوباره خوانده می‌شود
    mocks.rows.get("site_translations_tr")!["setting_value"] = JSON.stringify({ متن: "Başka" });
    expect(await loadSiteTranslations("tr")).toEqual({ متن: "Yeni metin" });
    now += SITE_TRANSLATIONS_TTL_MS;
    expect(await loadSiteTranslations("tr")).toEqual({ متن: "Başka" });
  });
});
