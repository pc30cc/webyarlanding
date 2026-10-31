// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// پاک‌سازی ترجمه‌های قدیمی انگلیسی روی کلاینت Postgres مستقیم (pg-db.server) با Pool ساختگی:
// نوشتن شرطی روی updated_at باید همان SQL درست را بسازد و مقدار خوانده‌شده را دست‌نخورده برگرداند.
const fake = vi.hoisted(() => {
  vi.stubEnv("DATABASE_URL", "postgres://fake/webyar");
  vi.stubEnv("DATABASE_AUTO_MIGRATE", "false");
  return {
    parsers: new Map<number, (value: string) => unknown>(),
    queries: [] as { sql: string; params: unknown[] }[],
    /** مقدار ستون‌ها همان‌طور که Postgres به صورت متن برمی‌گرداند */
    row: { id: "site", setting_value: "", updated_at: "" },
    concurrentSave: null as null | (() => void),
  };
});
vi.mock("pg", () => {
  const TIMESTAMP = 1114;
  class Pool {
    on() {}
    async query(sql: string, params: unknown[] = []) {
      fake.queries.push({ sql, params });
      const parse = fake.parsers.get(TIMESTAMP)!;
      if (sql.startsWith("SELECT")) {
        return {
          rows: [
            {
              id: fake.row.id,
              setting_value: fake.row.setting_value,
              updated_at: parse(fake.row.updated_at),
            },
          ],
        };
      }
      // UPDATE ... WHERE "id" = $n AND "updated_at" = $m RETURNING "id"
      fake.concurrentSave?.();
      fake.concurrentSave = null;
      const [, , id, updatedAt] = params as string[];
      const same = id === fake.row.id && updatedAt === parse(fake.row.updated_at);
      if (!same) return { rows: [] };
      fake.row.setting_value = params[0] as string;
      fake.row.updated_at = String(params[1]).replace("T", " ").replace("Z", "");
      return { rows: [{ id: fake.row.id }] };
    }
  }
  const types = {
    setTypeParser: (oid: number, parse: (value: string) => unknown) => fake.parsers.set(oid, parse),
  };
  return { default: { Pool, types } };
});

import { clearLegacyEnglishTranslations } from "./settings.server";

const legacy = { localization: { english: { متن: "Text" } }, brand: { name: "نام" } };

afterAll(() => vi.unstubAllEnvs());
beforeEach(() => {
  fake.queries.length = 0;
  fake.concurrentSave = null;
  fake.row = {
    id: "site",
    setting_value: JSON.stringify(legacy),
    // ردیف قدیمی با پیش‌فرض now() دیتابیس: میکروثانیه دارد
    updated_at: "2026-10-30 08:00:00.123456",
  };
});

describe("clearing legacy English on the direct Postgres client", () => {
  it("writes conditionally on the updated_at it read and checks the returned row", async () => {
    expect(await clearLegacyEnglishTranslations()).toBe(true);
    const update = fake.queries.find((query) => query.sql.startsWith("UPDATE"))!;
    expect(update.sql).toBe(
      'UPDATE public."settings" SET "setting_value" = $1, "updated_at" = $2 WHERE "id" = $3 AND "updated_at" = $4 RETURNING "id"',
    );
    // مقدار خوانده‌شده (با میکروثانیه) بدون تغییر در شرط برمی‌گردد
    expect(update.params[3]).toBe("2026-10-30T08:00:00.123456");
    expect(JSON.parse(fake.row.setting_value)).toEqual({
      ...legacy,
      localization: { english: {} },
    });
  });

  it("re-reads and keeps a save that landed between reading and writing", async () => {
    fake.concurrentSave = () => {
      fake.row.setting_value = JSON.stringify({ ...legacy, brand: { name: "نام تازه" } });
      fake.row.updated_at = "2026-10-30 08:00:01.5";
    };
    expect(await clearLegacyEnglishTranslations()).toBe(true);
    expect(fake.queries.filter((query) => query.sql.startsWith("UPDATE"))).toHaveLength(2);
    expect(JSON.parse(fake.row.setting_value)).toEqual({
      brand: { name: "نام تازه" },
      localization: { english: {} },
    });
  });
});
