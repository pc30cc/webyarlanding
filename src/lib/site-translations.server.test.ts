import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

// جدول settings در حافظه (فقط همان بخشی از API که این ماژول‌ها استفاده می‌کنند)
const mocks = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  reads: [] as string[],
  failKey: null as string | null,
  /**
   * نوشتن‌های هم‌زمان: هر update پاک‌سازی ترجمه‌های قدیمی (payload بدون setting_key، برخلاف
   * ذخیره‌های کامل ردیف) پیش از اجرا یکی از این‌ها را اجرا می‌کند، یعنی نمونه دیگری از سرور
   * درست بین خواندن و نوشتن ردیف آن را ذخیره کرده است.
   */
  concurrentWrites: [] as (() => Promise<void> | void)[],
}));
vi.mock("./db.server", () => {
  type Row = Record<string, unknown>;
  function from() {
    const state = {
      action: "select" as "select" | "update" | "insert",
      filters: [] as [string, unknown][],
      payload: {} as Row,
      returning: false,
      single: false,
    };
    const matches = (row: Row) => state.filters.every(([column, value]) => row[column] === value);
    const run = async () => {
      if (state.action === "insert") {
        mocks.rows.set(String(state.payload["setting_key"]), { ...state.payload });
        return { data: null, error: null };
      }
      if (state.action === "update") {
        if (!("setting_key" in state.payload)) await mocks.concurrentWrites.shift()?.();
        const updated = Array.from(mocks.rows.values()).filter(matches);
        for (const row of updated) Object.assign(row, state.payload);
        return {
          data: state.returning ? updated.map((row) => ({ id: row["id"] })) : null,
          error: null,
        };
      }
      const key = state.filters.find(([column]) => column === "setting_key")?.[1];
      mocks.reads.push(String(key));
      if (key === mocks.failKey) return { data: null, error: new Error("DB down") };
      const found = Array.from(mocks.rows.values())
        .filter(matches)
        .map((row) => ({ ...row }));
      return { data: state.single ? (found[0] ?? null) : found, error: null };
    };
    const builder = {
      select: () => {
        if (state.action !== "select") state.returning = true;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        state.filters.push([column, value]);
        return builder;
      },
      maybeSingle: () => {
        state.single = true;
        return builder;
      },
      update: (payload: Row) => {
        state.action = "update";
        state.payload = payload;
        return builder;
      },
      insert: (payload: Row) => {
        state.action = "insert";
        state.payload = payload;
        return builder;
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        run().then(resolve, reject),
    };
    return builder;
  }
  return {
    db: { from },
    newId: () => "id-" + (mocks.rows.size + 1),
    nowIso: () => "2026-10-31T00:00:00.000Z",
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

function storeSettings(value: unknown, updatedAt = "2026-10-30T00:00:00") {
  mocks.rows.set("site_settings", {
    id: "site",
    setting_key: "site_settings",
    setting_value: JSON.stringify(value),
    is_private: 0,
    // ستون timestamp بدون منطقه زمانی، همان شکلی که pg و PostgREST برمی‌گردانند
    updated_at: updatedAt,
  });
}
/** ذخیره تنظیمات از جای دیگر (نمونه دیگر سرور) با مقدار و زمان تازه */
function writeSettingsElsewhere(value: unknown, updatedAt: string) {
  Object.assign(mocks.rows.get("site_settings")!, {
    setting_value: JSON.stringify(value),
    updated_at: updatedAt,
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
  mocks.concurrentWrites.length = 0;
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
  });

  it("does not send legacy English separately from the settings that already carry it", async () => {
    storeSettings(legacy);
    // null: ترجمه‌ها همان localization.english تنظیمات عمومی است (siteI18n از همان می‌خواند)
    expect(await loadSiteTranslations("en")).toBeNull();
    expect(cachedSiteTranslations("en")).toBeUndefined();
    // کش null هم تازه است و دیتابیس دوباره خوانده نمی‌شود
    mocks.reads.length = 0;
    expect(await loadSiteTranslations("en")).toBeNull();
    expect(mocks.reads).toEqual([]);
    // زبان‌های دیگر بدون ردیف نقشه خالی دارند (داده قدیمی ندارند)
    expect(await loadSiteTranslations("tr")).toEqual({});
    // پس از اولین ذخیره انگلیسی، ردیف خودش فرستاده می‌شود
    await saveSiteTranslations("en", { متن: "New text" });
    expect(await loadSiteTranslations("en")).toEqual({ متن: "New text" });
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

describe("clearing legacy English while settings are saved concurrently", () => {
  const brand = (name: string) => ({ ...legacy, brand: { name } });

  it("keeps a settings save that lands between reading and writing", async () => {
    storeSettings(legacy);
    // ذخیره هم‌زمانی که هنوز english را دارد (فرمی که پیش از ساخته شدن ردیف ذخیره شد)
    mocks.concurrentWrites.push(() =>
      writeSettingsElsewhere(brand("نام تازه"), "2026-10-30T00:00:05.123456"),
    );
    const revision = settingsRevision;
    expect(await saveSiteTranslations("en", { متن: "New text" })).toEqual({ clearedLegacy: true });
    // ذخیره هم‌زمان از دست نرفته و english با تلاش دوباره روی نسخه تازه پاک شده است
    expect(storedSettings()).toEqual({
      ...brand("نام تازه"),
      localization: { ...legacy.localization, english: {} },
    });
    expect(settingsRevision).toBe(revision + 1);
    // زمان ذخیره پاک‌سازی بعد از زمان ذخیره هم‌زمان است (برای نوشتن شرطی بعدی)
    expect(mocks.rows.get("site_settings")!["updated_at"]).toBe("2026-10-31T00:00:00.000Z");
  });

  it("keeps a concurrent saveSettings and does not write legacy English back", async () => {
    storeSettings(legacy);
    const form = structuredClone(DEFAULT_SETTINGS);
    form.brand.name = "نام از فرم";
    form.localization.english = { متن: "Text" };
    mocks.concurrentWrites.push(() => saveSettings(form));
    await saveSiteTranslations("en", { متن: "New text" });
    expect(storedSettings().brand.name).toBe("نام از فرم");
    expect(storedSettings().localization.english).toEqual({});
  });

  it("gives up without overwriting when the settings keep changing", async () => {
    storeSettings(legacy);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    for (let i = 0; i < 5; i++)
      mocks.concurrentWrites.push(() =>
        writeSettingsElsewhere(brand(`نام ${i}`), `2026-10-30T00:00:0${i}.5`),
      );
    // ترجمه‌ها ذخیره شده‌اند؛ پاک‌سازی به ذخیره انگلیسی بعدی می‌ماند
    expect(await saveSiteTranslations("en", { متن: "New text" })).toEqual({ clearedLegacy: false });
    expect(storedRow("site_translations_en")).toEqual({ متن: "New text" });
    expect(storedSettings()).toEqual(brand("نام 4"));
    expect(warn).toHaveBeenCalled();
    expect(await saveSiteTranslations("en", { متن: "New text" })).toEqual({ clearedLegacy: true });
    expect(storedSettings().brand).toEqual({ name: "نام 4" });
  });

  it("changes updated_at on every settings save, even within the same millisecond", async () => {
    // nowIso ثابت است؛ ذخیره‌ها باید باز هم زمان متفاوتی بنویسند
    storeSettings(legacy, "2026-10-31T00:00:00");
    const seen = new Set<unknown>([mocks.rows.get("site_settings")!["updated_at"]]);
    for (let i = 0; i < 3; i++) {
      await saveSettings(structuredClone(DEFAULT_SETTINGS));
      const updatedAt = mocks.rows.get("site_settings")!["updated_at"];
      expect(seen.has(updatedAt)).toBe(false);
      seen.add(updatedAt);
    }
    expect([...seen].slice(1)).toEqual([
      "2026-10-31T00:00:00.001Z",
      "2026-10-31T00:00:00.002Z",
      "2026-10-31T00:00:00.003Z",
    ]);
    // ردیفی با میکروثانیه (پیش‌فرض now() دیتابیس) هم جلو می‌رود
    storeSettings(legacy, "2026-10-31T00:00:00.000999");
    await saveSettings(structuredClone(DEFAULT_SETTINGS));
    expect(mocks.rows.get("site_settings")!["updated_at"]).toBe("2026-10-31T00:00:00.001Z");
  });
});
