// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

// لایه دیتابیس فقط PostgreSQL است: بدون DATABASE_URL هر کوئری خطای روشن برمی‌گرداند (throw
// نمی‌کند) و صفحه‌های عمومی با تنظیمات پیش‌فرض رندر می‌شوند.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("db without DATABASE_URL", () => {
  it("returns an error naming DATABASE_URL instead of throwing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("./db.server");
    const res = await db.from("settings").select("id").eq("setting_key", "x").maybeSingle();
    expect(res.data).toBeNull();
    expect(res.error?.message).toContain("DATABASE_URL");
  });

  it("keeps public settings on their defaults", async () => {
    vi.stubEnv("DATABASE_URL", "   ");
    const { loadSettings } = await import("./settings.server");
    const { mergeSettings } = await import("./settings");
    expect(await loadSettings()).toEqual(mergeSettings({}));
  });

  it("reports the missing variable from the health endpoint", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("CRON_SECRET", "secret");
    const { Route } = await import("@/routes/api/public/health");
    const handlers = Route.options.server?.handlers as Record<string, () => Promise<Response>>;
    const res = await handlers["GET"]!();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      ok: false,
      env: {
        required: { DATABASE_URL: false },
        optional: { CRON_SECRET: true },
        missing: ["DATABASE_URL"],
      },
      database: "skipped",
    });
  });
});
