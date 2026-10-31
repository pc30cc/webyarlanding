import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import type { Locale } from "./locales";
import type { AppDto } from "./apps.functions";

type Row = Record<string, unknown>;

type Query = { table: string; action: string; filters: [string, "eq" | "in", unknown][] };

// دیتابیس ساختگی: جدول apps، ردیف‌های settings و کلیک‌ها؛ همه کوئری‌ها در queries ثبت می‌شوند
const fake = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
  queries: [] as Query[],
  settings: null as unknown,
  loadSettings: vi.fn(),
}));
vi.mock("./db.server", () => {
  function from(table: string) {
    const state = {
      action: "select",
      filters: [] as [string, "eq" | "in", unknown][],
      payload: null as Row | null,
      single: false,
    };
    const run = () => {
      fake.queries.push({ table, action: state.action, filters: state.filters });
      const rows = (fake.tables[table] ??= []);
      const match = (row: Row) =>
        state.filters.every(([column, op, value]) =>
          op === "eq" ? row[column] === value : (value as unknown[]).includes(row[column]),
        );
      if (state.action === "insert") {
        rows.push({ ...state.payload });
        return { data: null, error: null };
      }
      if (state.action === "update") {
        for (const row of rows.filter(match)) Object.assign(row, state.payload);
        return { data: null, error: null };
      }
      if (state.action === "delete") {
        fake.tables[table] = rows.filter((row) => !match(row));
        return { data: null, error: null };
      }
      const found = rows.filter(match);
      return state.single ? { data: found[0] ?? null, error: null } : { data: found, error: null };
    };
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column: string, value: unknown) => {
        state.filters.push([column, "eq", value]);
        return builder;
      },
      in: (column: string, values: unknown[]) => {
        state.filters.push([column, "in", values]);
        return builder;
      },
      maybeSingle: () => {
        state.single = true;
        return builder;
      },
      insert: (payload: Row) => {
        state.action = "insert";
        state.payload = payload;
        return builder;
      },
      update: (payload: Row) => {
        state.action = "update";
        state.payload = payload;
        return builder;
      },
      delete: () => {
        state.action = "delete";
        return builder;
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve().then(run).then(resolve, reject),
    };
    return builder;
  }
  return {
    db: { from },
    newId: () => "new-id",
    nowIso: () => "2026-10-31T00:00:00Z",
    toBool: (value: unknown) => value === 1 || value === true || value === "1",
    fromBool: (value: unknown) => (value ? 1 : 0),
    parseJson: <T>(value: string | null | undefined, fallback: T): T => {
      try {
        return value ? (JSON.parse(value) as T) : fallback;
      } catch {
        return fallback;
      }
    },
    slugify: (value: string) => value,
  };
});
vi.mock("./settings.server", () => ({ loadSettings: fake.loadSettings }));
vi.mock("./auth.server", () => ({ requireAdmin: vi.fn() }));
// createFileRoute ساختگی: Route همان تنظیمات مسیر است تا handler /go مستقیم صدا زده شود
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (handle: () => unknown) => handle,
    inputValidator: (validate: (input: unknown) => unknown) => ({
      handler: (handle: (args: { data: unknown }) => unknown) => async (args?: { data: unknown }) =>
        handle({ data: validate(args?.data) }),
    }),
  }),
}));

import {
  adminFetchApps,
  appDownloadTarget,
  appFallbackPath,
  appLocaleOverrides,
  fetchPublicApp,
  fetchPublicApps,
  goLinkLocale,
  localizeApp,
  recordClick,
  saveApp,
  deleteApp,
  type AppLocaleStore,
} from "./apps.server";
import { adminSaveApp, appDownloadHref, getPublicApp, getPublicApps } from "./apps.functions";
import { Route as GoRoute } from "@/routes/go.$slug";

type GoHandler = (ctx: { request: Request; params: { slug: string } }) => Promise<Response>;
/** آدرس ریدایرکت /go برای یک درخواست */
async function goLocation(url: string, headers: Record<string, string> = {}) {
  const { GET } = (GoRoute as unknown as { options: { server: { handlers: { GET: GoHandler } } } })
    .options.server.handlers;
  const slug = decodeURIComponent(new URL(url).pathname.split("/")[2] ?? "");
  const response = await GET({ request: new Request(url, { headers }), params: { slug } });
  expect(response.status).toBe(302);
  return response.headers.get("location");
}

function site(language: Locale = "fa", locales: Locale[] = ["fa"]): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  settings.localization.mode = locales.length > 1 ? "multi" : "single";
  settings.localization.locales = locales;
  return settings;
}

function appRow(id: string, extra: Row = {}): Row {
  return {
    id,
    slug: id,
    platform: "ios",
    name: `App ${id}`,
    subtitle: "",
    icon_url: "",
    short_desc: "",
    description: "",
    features_json: "[]",
    screenshots_json: "[]",
    version: "1.0",
    size: "",
    min_os: "",
    download_url: `https://store.example/${id}`,
    sort_order: 0,
    enabled: 1,
    ...extra,
  };
}

function settingRow(key: string, value: unknown): Row {
  return { id: `setting-${key}`, setting_key: key, setting_value: JSON.stringify(value) };
}

const app = (extra: Partial<AppDto> = {}): AppDto => ({
  id: "ios",
  slug: "ios",
  platform: "ios",
  name: "App",
  subtitle: "",
  iconUrl: "",
  shortDesc: "",
  description: "",
  features: [],
  screenshots: [],
  version: "",
  size: "",
  minOs: "",
  downloadUrl: "https://store.example/fa",
  sortOrder: 0,
  enabled: true,
  downloadUrlEn: "",
  enabledEn: true,
  ...extra,
});

const store = (value: Partial<AppLocaleStore>): AppLocaleStore => ({
  locales: {},
  legacyEn: {},
  ...value,
});

/** کوئری‌های یک جدول (پس از آخرین reset) */
const queriesOf = (table: string) => fake.queries.filter((q) => q.table === table);

beforeEach(() => {
  fake.tables = {};
  fake.queries = [];
  fake.settings = site();
  fake.loadSettings.mockReset();
  fake.loadSettings.mockImplementation(async () => fake.settings);
});

describe("app language overrides", () => {
  it("reads apps_locales and falls back to the legacy apps_en row", () => {
    const legacy = store({
      legacyEn: { ios: { downloadUrl: " https://en.example ", enabled: false } },
    });
    expect(appLocaleOverrides("ios", legacy)).toEqual({
      en: { downloadUrl: "https://en.example", enabled: false, legacy: true },
    });
    // نسخه انگلیسی apps_locales بر apps_en مقدم است؛ زبان‌های دیگر نسخه قدیمی را کنار نمی‌زنند
    expect(
      appLocaleOverrides("ios", {
        ...legacy,
        locales: { ios: { en: { downloadUrl: "y" }, tr: { downloadUrl: "x" } } },
      }),
    ).toEqual({ en: { downloadUrl: "y", enabled: true }, tr: { downloadUrl: "x", enabled: true } });
    expect(
      appLocaleOverrides("ios", { ...legacy, locales: { ios: { tr: { downloadUrl: "x" } } } }),
    ).toEqual({
      tr: { downloadUrl: "x", enabled: true },
      en: { downloadUrl: "https://en.example", enabled: false, legacy: true },
    });
    expect(appLocaleOverrides("ios", { ...legacy, locales: { ios: {} } })).toEqual({
      en: { downloadUrl: "https://en.example", enabled: false, legacy: true },
    });
    expect(appLocaleOverrides("android", legacy)).toEqual({});
  });

  it("ignores unknown languages and corrupt entries", () => {
    const corrupt = store({
      locales: {
        ios: {
          de: { downloadUrl: "x" },
          en: "bad" as never,
          ar: { downloadUrl: 5, enabled: "no" },
        },
      },
    });
    expect(appLocaleOverrides("ios", corrupt)).toEqual({
      ar: { downloadUrl: "", enabled: true },
    });
  });

  it("uses the language link, inherits an empty link and needs both switches on", () => {
    expect(localizeApp(app(), undefined)).toEqual(app());
    expect(localizeApp(app(), { downloadUrl: "https://tr.example", enabled: true })).toMatchObject({
      downloadUrl: "https://tr.example",
      enabled: true,
    });
    expect(localizeApp(app(), { downloadUrl: "", enabled: true }).downloadUrl).toBe(
      "https://store.example/fa",
    );
    expect(localizeApp(app(), { downloadUrl: "x", enabled: false }).enabled).toBe(false);
    expect(localizeApp(app({ enabled: false }), { downloadUrl: "x", enabled: true }).enabled).toBe(
      false,
    );
  });
});

describe("public apps per page language", () => {
  beforeEach(() => {
    fake.tables["apps"] = [
      appRow("ios", { sort_order: 1 }),
      appRow("android", { sort_order: 2 }),
      appRow("off", { enabled: 0 }),
    ];
    fake.tables["settings"] = [
      settingRow("apps_en", {
        ios: { downloadUrl: "https://en.example/ios", enabled: true },
        android: { downloadUrl: "", enabled: false },
      }),
    ];
  });

  it("keeps the default-language list unchanged", async () => {
    const apps = await getPublicApps();
    expect(apps.map((a) => a.slug)).toEqual(["ios", "android"]);
    expect(apps[0]).toEqual({
      id: "ios",
      slug: "ios",
      platform: "ios",
      name: "App ios",
      subtitle: "",
      iconUrl: "",
      shortDesc: "",
      description: "",
      features: [],
      screenshots: [],
      version: "1.0",
      size: "",
      minOs: "",
      downloadUrl: "1",
      sortOrder: 1,
      enabled: true,
      downloadUrlEn: "",
      enabledEn: true,
    });
    expect(await getPublicApps({ data: { locale: null } })).toEqual(apps);
  });

  it("applies the page language (legacy apps_en for English)", async () => {
    fake.settings = site("fa", ["fa", "en", "tr"]);
    expect((await fetchPublicApps("en")).map((a) => [a.slug, a.downloadUrl])).toEqual([
      ["ios", "https://en.example/ios"],
    ]);
    expect((await fetchPublicApps("tr")).map((a) => a.slug)).toEqual(["ios", "android"]);
    expect(await fetchPublicApp("android", "en")).toBeNull();
    expect((await fetchPublicApp("android", "tr"))?.downloadUrl).toBe(
      "https://store.example/android",
    );
    expect(await fetchPublicApp("off", "tr")).toBeNull();
    // پاسخ عمومی هیچ لینک یا نسخه زبانی را لو نمی‌دهد
    const publicApp = await getPublicApp({ data: { slug: "ios", locale: "en" } });
    expect(publicApp).toMatchObject({ downloadUrl: "1", downloadUrlEn: "" });
    expect(publicApp && "locales" in publicApp).toBe(false);
  });

  it("applies English overrides on an English-default site", async () => {
    fake.settings = site("en", ["en"]);
    expect((await fetchPublicApps(null)).map((a) => a.downloadUrl)).toEqual([
      "https://en.example/ios",
    ]);
  });

  it("falls back safely for unknown or inactive languages", async () => {
    const defaults = await getPublicApps();
    expect(await getPublicApps({ data: { locale: "de" } })).toEqual(defaults);
    expect(await getPublicApps({ data: { locale: 42 } })).toEqual(defaults);
    // انگلیسی فعال نیست: همان زبان پیش‌فرض
    expect(await getPublicApps({ data: { locale: "en" } })).toEqual(defaults);
  });
});

describe("saving and deleting", () => {
  const input = {
    id: "ios",
    slug: "ios",
    platform: "ios" as const,
    name: "App",
    subtitle: "",
    iconUrl: "",
    shortDesc: "",
    description: "",
    features: [],
    screenshots: [],
    version: "",
    size: "",
    minOs: "",
    downloadUrl: "https://store.example/fa",
    sortOrder: 0,
    enabled: true,
    downloadUrlEn: "",
    enabledEn: true,
  };
  const stored = () =>
    JSON.parse(
      String(
        fake.tables["settings"]?.find((r) => r["setting_key"] === "apps_locales")?.[
          "setting_value"
        ],
      ),
    );

  beforeEach(() => {
    fake.tables["apps"] = [appRow("ios"), appRow("android")];
    fake.tables["settings"] = [
      settingRow("apps_en", {
        ios: { downloadUrl: "https://en.example/ios", enabled: true },
        android: { downloadUrl: "https://en.example/android", enabled: true },
      }),
    ];
  });

  it("stores every language in apps_locales, replacing the legacy entry", async () => {
    await saveApp({
      ...input,
      locales: {
        tr: { downloadUrl: " https://tr.example ", enabled: true },
        ar: { downloadUrl: "", enabled: false },
        en: { downloadUrl: "", enabled: true },
      },
    });
    expect(stored()).toEqual({
      ios: {
        tr: { downloadUrl: "https://tr.example", enabled: true },
        ar: { downloadUrl: "", enabled: false },
      },
    });
    // نسخه انگلیسی پاک شد و apps_en قدیمی دیگر برای این برنامه خوانده نمی‌شود
    const [ios, android] = await adminFetchApps();
    expect(ios?.locales).toEqual(stored().ios);
    expect(ios).toMatchObject({ downloadUrlEn: "", enabledEn: true });
    expect(android).toMatchObject({
      downloadUrlEn: "https://en.example/android",
      locales: { en: { downloadUrl: "https://en.example/android", enabled: true } },
    });
  });

  it("keeps the old English fields working without locales", async () => {
    fake.tables["settings"]?.push(
      settingRow("apps_locales", {
        ios: { tr: { downloadUrl: "https://tr.example", enabled: true } },
      }),
    );
    await saveApp({ ...input, downloadUrlEn: "https://en.example/new", enabledEn: false });
    expect(stored().ios).toEqual({
      tr: { downloadUrl: "https://tr.example", enabled: true },
      en: { downloadUrl: "https://en.example/new", enabled: false },
    });
  });

  it("removes the app from both rows on delete", async () => {
    fake.tables["settings"]?.push(settingRow("apps_locales", { ios: {}, android: {} }));
    await deleteApp("ios");
    const value = (key: string) =>
      JSON.parse(
        String(fake.tables["settings"]?.find((r) => r["setting_key"] === key)?.["setting_value"]),
      );
    expect(Object.keys(value("apps_locales"))).toEqual(["android"]);
    expect(Object.keys(value("apps_en"))).toEqual(["android"]);
  });
});

describe("/go language", () => {
  const request = (url: string, headers: Record<string, string> = {}) =>
    new Request(url, { headers });

  it("builds ?l= links only for non-default pages", () => {
    expect(appDownloadHref("ios", null)).toBe("/go/ios");
    expect(appDownloadHref("ios", "tr")).toBe("/go/ios?l=tr");
  });

  it("reads ?l=, then a same-site referrer", () => {
    expect(goLinkLocale(request("https://webyar.ai/go/ios?l=en"))).toBe("en");
    expect(goLinkLocale(request("https://webyar.ai/go/ios?l=de"))).toBeNull();
    expect(
      goLinkLocale(
        request("https://webyar.ai/go/ios?l=xx", { referer: "https://webyar.ai/tr/download" }),
      ),
    ).toBeNull();
    expect(
      goLinkLocale(
        request("https://webyar.ai/go/ios", { referer: "https://webyar.ai/tr/download" }),
      ),
    ).toBe("tr");
    expect(
      goLinkLocale(
        request("http://localhost:3000/go/ios", {
          referer: "https://webyar.ai/ar",
          host: "webyar.ai",
        }),
      ),
    ).toBe("ar");
    expect(
      goLinkLocale(request("https://webyar.ai/go/ios", { referer: "https://other.example/en/x" })),
    ).toBeNull();
    expect(
      goLinkLocale(request("https://webyar.ai/go/ios", { referer: "https://webyar.ai/download" })),
    ).toBeNull();
    expect(goLinkLocale(request("https://webyar.ai/go/ios", { referer: "not a url" }))).toBeNull();
  });

  it("picks the page language's store link, then the default language's", () => {
    const overrides = {
      en: { downloadUrl: "https://en.example", enabled: true },
      tr: { downloadUrl: "", enabled: false },
    };
    expect(appDownloadTarget(app(), overrides, "en", "fa")).toBe("https://en.example");
    expect(appDownloadTarget(app(), overrides, "tr", "fa")).toBe("https://store.example/fa");
    expect(appDownloadTarget(app(), overrides, "fa", "fa")).toBe("https://store.example/fa");
    expect(appDownloadTarget(app({ downloadUrl: "" }), overrides, "tr", "fa")).toBeNull();
  });

  it("records the click with the resolved link", async () => {
    fake.settings = site("fa", ["fa", "en"]);
    fake.tables["apps"] = [appRow("ios")];
    fake.tables["settings"] = [
      settingRow("apps_locales", {
        ios: { en: { downloadUrl: "https://en.example", enabled: true } },
      }),
    ];
    expect(await recordClick("ios", { locale: "en" })).toEqual({
      target: "https://en.example",
      fallback: "/en/download/ios",
    });
    expect(await recordClick("ios", {})).toEqual({
      target: "https://store.example/ios",
      fallback: "/download/ios",
    });
    // زبان غیرفعال = زبان پیش‌فرض
    expect(await recordClick("ios", { locale: "tr" })).toEqual({
      target: "https://store.example/ios",
      fallback: "/download/ios",
    });
    expect(await recordClick("missing", { locale: "en" })).toEqual({
      target: null,
      fallback: "/download/missing",
    });
    expect(fake.tables["app_download_clicks"]).toHaveLength(3);
  });
});

describe("single-language Persian site (production) stays as before", () => {
  // داده صفحه و کوئری‌ها باید دقیقاً مثل نسخه پیش از چندزبانه باشد
  const baseShape = (id: string, sortOrder: number) => ({
    id,
    slug: id,
    platform: "ios",
    name: `App ${id}`,
    subtitle: "",
    iconUrl: "",
    shortDesc: "",
    description: "",
    features: [],
    screenshots: [],
    version: "1.0",
    size: "",
    minOs: "",
    downloadUrl: "1",
    sortOrder,
    enabled: true,
    downloadUrlEn: "",
    enabledEn: true,
  });

  beforeEach(() => {
    fake.tables["apps"] = [
      appRow("ios", { sort_order: 1 }),
      appRow("android", { sort_order: 2 }),
      appRow("off", { enabled: 0 }),
    ];
    // نسخه‌های ذخیره‌شده (حتی برای fa) روی سایت تک‌زبانه فارسی اثری ندارند
    fake.tables["settings"] = [
      settingRow("apps_en", { ios: { downloadUrl: "", enabled: false } }),
      settingRow("apps_locales", {
        android: { fa: { downloadUrl: "https://x.example", enabled: false } },
      }),
    ];
  });

  it("returns the app page data without visibleLocales", async () => {
    for (const locale of [null, "en", "tr"] as const) {
      const app = await getPublicApp({ data: { slug: "ios", locale } });
      expect(app).toEqual(baseShape("ios", 1));
      expect(Object.keys(app ?? {})).toEqual(Object.keys(baseShape("ios", 1)));
    }
    expect(await getPublicApp({ data: { slug: "off", locale: null } })).toBeNull();
  });

  it("returns the list unchanged", async () => {
    expect(await getPublicApps()).toEqual([baseShape("ios", 1), baseShape("android", 2)]);
  });

  it("does not read the language store (base number of queries)", async () => {
    await getPublicApps({ data: { locale: null } });
    await getPublicApp({ data: { slug: "ios", locale: null } });
    await getPublicApps({ data: { locale: "en" } });
    // فقط کوئری جدول apps (با فیلتر enabled مثل قبل)، بدون خواندن apps_locales/apps_en
    expect(queriesOf("settings")).toEqual([]);
    expect(queriesOf("apps")).toHaveLength(3);
    for (const query of queriesOf("apps"))
      expect(query.filters).toContainEqual(["enabled", "eq", 1]);
    expect(fake.loadSettings).toHaveBeenCalledTimes(3);
  });

  it("keeps /go at the base number of queries", async () => {
    expect(await goLocation("https://webyar.ai/go/ios")).toBe("https://store.example/ios");
    expect(queriesOf("settings")).toEqual([]);
    expect(fake.queries.map((q) => `${q.table}:${q.action}`)).toEqual([
      "apps:select",
      "app_download_clicks:insert",
    ]);
    expect(fake.loadSettings).toHaveBeenCalledTimes(1);
    // ?l= با زبان غیرفعال هم همان
    fake.queries = [];
    expect(await goLocation("https://webyar.ai/go/ios?l=en")).toBe("https://store.example/ios");
    expect(queriesOf("settings")).toEqual([]);
  });

  it("adds visibleLocales and reads the store only on a multi-language site", async () => {
    fake.settings = site("fa", ["fa", "en"]);
    const app = await getPublicApp({ data: { slug: "ios", locale: null } });
    // ios در انگلیسی (apps_en قدیمی) خاموش است
    expect(app?.visibleLocales).toEqual(["fa"]);
    expect(queriesOf("settings")).toHaveLength(1);
    // حالت چندزبانه با یک زبان فعال همان سایت تک‌زبانه است
    fake.queries = [];
    fake.settings = {
      ...site("fa", ["fa"]),
      localization: { ...site().localization, mode: "multi" },
    };
    const single = await getPublicApp({ data: { slug: "ios", locale: null } });
    expect(single && "visibleLocales" in single).toBe(false);
    expect(queriesOf("settings")).toEqual([]);
  });
});

describe("legacy apps_en keeps its old meaning on English pages", () => {
  // موارد بازبینی: لینک انگلیسی خالی = بدون لینک، خاموش در انگلیسی، و برنامه خاموش در فارسی
  // که در انگلیسی روشن است
  beforeEach(() => {
    fake.tables["apps"] = [
      appRow("ios", { sort_order: 1 }),
      appRow("android", { sort_order: 2 }),
      appRow("windows", { sort_order: 3, enabled: 0 }),
      appRow("off", { sort_order: 4, enabled: 0 }),
    ];
    fake.tables["settings"] = [
      settingRow("apps_en", {
        ios: { downloadUrl: "", enabled: true },
        android: { downloadUrl: "https://en.example/android", enabled: false },
        windows: { downloadUrl: "https://en.example/windows", enabled: true },
      }),
    ];
  });

  it("matches the old English-default site", async () => {
    fake.settings = site("en", ["en"]);
    expect((await fetchPublicApps(null)).map((a) => [a.slug, a.downloadUrl])).toEqual([
      ["ios", ""],
      ["windows", "https://en.example/windows"],
    ]);
    // صفحه عمومی: ios «به‌زودی» (بدون لینک)، windows با لینک
    expect((await getPublicApps()).map((a) => [a.slug, a.downloadUrl])).toEqual([
      ["ios", ""],
      ["windows", "1"],
    ]);
    expect(await fetchPublicApp("ios")).toMatchObject({ downloadUrl: "", enabled: true });
    expect(await fetchPublicApp("windows")).toMatchObject({
      downloadUrl: "https://en.example/windows",
      enabled: true,
    });
    expect(await fetchPublicApp("android")).toBeNull();
    expect(await fetchPublicApp("off")).toBeNull();
    expect((await fetchPublicApp("ios")) ?? {}).not.toHaveProperty("visibleLocales");
  });

  it("sends English clicks without a link to the app page, never to another language's link", async () => {
    fake.settings = site("en", ["en"]);
    expect(await recordClick("ios", {})).toEqual({ target: null, fallback: "/download/ios" });
    // در انگلیسی (زبان پیش‌فرض) خاموش است و صفحه‌ای ندارد: فهرست برنامه‌ها، نه ۴۰۴
    expect(await recordClick("android", {})).toEqual({
      target: null,
      fallback: "/download",
    });
    expect(await recordClick("windows", {})).toEqual({
      target: "https://en.example/windows",
      fallback: "/download/windows",
    });
    expect(fake.tables["app_download_clicks"]).toHaveLength(1);
    expect(await goLocation("https://webyar.ai/go/ios")).toBe("/download/ios");
    expect(await goLocation("https://webyar.ai/go/windows")).toBe("https://en.example/windows");
  });

  it("applies the same meaning to /en pages of a Persian-default site", async () => {
    fake.settings = site("fa", ["fa", "en"]);
    expect((await fetchPublicApps("en")).map((a) => [a.slug, a.downloadUrl])).toEqual([
      ["ios", ""],
      ["windows", "https://en.example/windows"],
    ]);
    expect((await fetchPublicApps(null)).map((a) => [a.slug, a.downloadUrl])).toEqual([
      ["ios", "https://store.example/ios"],
      ["android", "https://store.example/android"],
    ]);
    expect((await fetchPublicApp("windows", "en"))?.visibleLocales).toEqual(["en"]);
    expect(await fetchPublicApp("windows", null)).toBeNull();
    expect((await fetchPublicApp("ios", null))?.visibleLocales).toEqual(["fa", "en"]);
    expect((await fetchPublicApp("android", null))?.visibleLocales).toEqual(["fa"]);
    expect(await fetchPublicApp("android", "en")).toBeNull();

    // بدون لینک انگلیسی: صفحه انگلیسی برنامه، نه لینک فارسی
    expect(await recordClick("ios", { locale: "en" })).toEqual({
      target: null,
      fallback: "/en/download/ios",
    });
    // خاموش در انگلیسی: بدون لینک و صفحه زبان پیش‌فرض (نه /en که ۴۰۴ است)
    expect(await recordClick("android", { locale: "en" })).toEqual({
      target: null,
      fallback: "/download/android",
    });
    expect(await recordClick("windows", { locale: "en" })).toEqual({
      target: "https://en.example/windows",
      fallback: "/en/download/windows",
    });
    expect(await recordClick("ios", {})).toMatchObject({ target: "https://store.example/ios" });
    expect(await goLocation("https://webyar.ai/go/ios?l=en")).toBe("/en/download/ios");
  });

  it("uses the new meaning once the app is saved through the new admin", async () => {
    fake.settings = site("en", ["en"]);
    const [ios] = await adminFetchApps();
    expect(ios?.locales?.en).toEqual({ downloadUrl: "", enabled: true, legacy: true });
    await saveApp({
      ...ios!,
      locales: { en: { downloadUrl: "", enabled: true } },
    });
    // نسخه بی‌اثر ذخیره نمی‌شود و لینک خالی یعنی همان لینک پایه
    expect((await fetchPublicApp("ios"))?.downloadUrl).toBe("https://store.example/ios");
    expect((await adminFetchApps())[0]?.locales).toEqual({});
  });

  it("does not fall back to the default link for a legacy override", () => {
    const legacy = { en: { downloadUrl: "", enabled: true, legacy: true } };
    expect(appDownloadTarget(app(), legacy, "en", "fa")).toBeNull();
    expect(
      appDownloadTarget(
        app(),
        { en: { downloadUrl: "", enabled: false, legacy: true } },
        "en",
        "fa",
      ),
    ).toBeNull();
    expect(
      appDownloadTarget(
        app({ enabled: false }),
        { en: { downloadUrl: "https://en.example", enabled: true, legacy: true } },
        "en",
        "fa",
      ),
    ).toBe("https://en.example");
    expect(localizeApp(app({ enabled: false }), legacy.en)).toMatchObject({
      downloadUrl: "",
      enabled: true,
    });
  });
});

describe("/go fallback page language", () => {
  beforeEach(() => {
    fake.tables["apps"] = [appRow("ios"), appRow("nolink", { download_url: "" })];
    fake.tables["settings"] = [
      settingRow("apps_locales", {
        nolink: { tr: { downloadUrl: "", enabled: false } },
      }),
    ];
  });

  it("prefixes only an active, non-default page language where the app is visible", async () => {
    fake.settings = site("fa", ["fa", "en", "tr"]);
    expect(await goLocation("https://webyar.ai/go/nolink?l=en")).toBe("/en/download/nolink");
    expect(await goLocation("https://webyar.ai/go/nolink?l=fa")).toBe("/download/nolink");
    expect(await goLocation("https://webyar.ai/go/nolink")).toBe("/download/nolink");
    // زبان غیرفعال: صفحه زبان پیش‌فرض، نه /ar/download که ریدایرکت اضافه دارد
    expect(await goLocation("https://webyar.ai/go/nolink?l=ar")).toBe("/download/nolink");
    // برنامه در ترکی خاموش است: صفحه زبان پیش‌فرض، نه /tr/download که ۴۰۴ است
    expect(await goLocation("https://webyar.ai/go/nolink?l=tr")).toBe("/download/nolink");
    expect(
      await goLocation("https://webyar.ai/go/nolink", { referer: "https://webyar.ai/en/download" }),
    ).toBe("/en/download/nolink");
    expect(await goLocation("https://webyar.ai/go/missing?l=en")).toBe("/download/missing");
    expect(fake.tables["app_download_clicks"] ?? []).toHaveLength(0);
  });

  it("uses the resolved language on an English-default site", async () => {
    fake.settings = site("en", ["en", "fa"]);
    expect(await goLocation("https://webyar.ai/go/nolink?l=en")).toBe("/download/nolink");
    expect(await goLocation("https://webyar.ai/go/nolink?l=fa")).toBe("/fa/download/nolink");
    expect(appFallbackPath("x", null, {}, { locale: "fa", defaultLocale: "en" })).toBe(
      "/download/x",
    );
  });

  it("falls back to the unprefixed page on errors and unsafe links", async () => {
    fake.settings = site("fa", ["fa", "en"]);
    fake.tables["apps"]?.push(appRow("bad", { download_url: "javascript:alert(1)" }));
    expect(await goLocation("https://webyar.ai/go/bad?l=en")).toBe("/en/download/bad");
    fake.loadSettings.mockRejectedValueOnce(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await goLocation("https://webyar.ai/go/ios?l=en")).toBe("/download/ios");
    error.mockRestore();
  });
});

describe("saving keeps untouched legacy English entries", () => {
  // بازبینی: ذخیره هر فیلد بی‌ربط، نسخه قدیمی apps_en را بی‌خبر به قاعده جدید تبدیل می‌کرد
  // (لینک خالی = لینک فارسی، و برنامه خاموش در جدول apps از /en حذف می‌شد)
  const setting = (key: string) => {
    const row = fake.tables["settings"]?.find((r) => r["setting_key"] === key);
    return row ? JSON.parse(String(row["setting_value"])) : undefined;
  };
  /** فهرست /en: [slug، لینک] */
  const englishList = async () => (await fetchPublicApps("en")).map((a) => [a.slug, a.downloadUrl]);
  /** همان داده‌ای که پنل برای ذخیره می‌فرستد (برنامه از adminListApps با نسخه‌های زبان) */
  const formOf = async (id: string) => {
    const app = (await adminFetchApps()).find((a) => a.id === id)!;
    const { visibleLocales: _visible, ...rest } = app;
    return { ...rest, locales: { ...app.locales } };
  };
  const legacyEn = {
    a1: { downloadUrl: "", enabled: true },
    a2: { downloadUrl: "", enabled: true },
    a3: { downloadUrl: "https://en.example/a3", enabled: false },
  };

  beforeEach(() => {
    fake.settings = site("fa", ["fa", "en", "tr"]);
    fake.tables["apps"] = [
      appRow("a1", { sort_order: 1 }),
      appRow("a2", { sort_order: 2, enabled: 0 }),
      appRow("a3", { sort_order: 3 }),
    ];
    fake.tables["settings"] = [settingRow("apps_en", legacyEn)];
  });

  it("leaves the legacy entry in apps_en when only other fields change", async () => {
    const before = await englishList();
    expect(before).toEqual([
      ["a1", ""],
      ["a2", ""],
    ]);
    for (const id of ["a1", "a2", "a3"]) {
      const form = await formOf(id);
      expect(form.locales.en).toMatchObject({ legacy: true });
      await adminSaveApp({ data: { ...form, description: "توضیح تازه" } });
    }
    expect(setting("apps_en")).toEqual(legacyEn);
    expect(setting("apps_locales")).toEqual({ a1: {}, a2: {}, a3: {} });
    expect(await englishList()).toEqual(before);
    expect((await adminFetchApps()).map((a) => a.locales)).toEqual([
      { en: { ...legacyEn.a1, legacy: true } },
      { en: { ...legacyEn.a2, legacy: true } },
      { en: { ...legacyEn.a3, legacy: true } },
    ]);
    // لینک خالی قدیمی همچنان «بدون لینک» است، نه لینک فارسی
    expect(await recordClick("a1", { locale: "en" })).toEqual({
      target: null,
      fallback: "/en/download/a1",
    });
  });

  it("keeps the legacy entry next to another language's new entry", async () => {
    const form = await formOf("a2");
    await adminSaveApp({
      data: {
        ...form,
        locales: { ...form.locales, tr: { downloadUrl: "https://tr.example", enabled: true } },
      },
    });
    expect(setting("apps_locales")).toEqual({
      a2: { tr: { downloadUrl: "https://tr.example", enabled: true } },
    });
    expect(setting("apps_en")).toEqual(legacyEn);
    // a2 در جدول apps خاموش است ولی با نسخه قدیمی در /en نمایش داده می‌شود
    expect(await englishList()).toEqual([
      ["a1", ""],
      ["a2", ""],
    ]);
    // بدون کلید en هم نسخه قدیمی دست نمی‌خورد
    await saveApp({ ...(await formOf("a1")), locales: {} });
    expect(setting("apps_en")).toEqual(legacyEn);
  });

  it("converts the entry to the new rules only when English is edited", async () => {
    const form = await formOf("a1");
    await adminSaveApp({
      data: {
        ...form,
        locales: { ...form.locales, en: { downloadUrl: "https://en.example/a1", enabled: true } },
      },
    });
    expect(setting("apps_locales")).toEqual({
      a1: { en: { downloadUrl: "https://en.example/a1", enabled: true } },
    });
    // نسخه قدیمی a1 پاک شد؛ بقیه دست نخوردند
    expect(setting("apps_en")).toEqual({ a2: legacyEn.a2, a3: legacyEn.a3 });
    expect(await englishList()).toEqual([
      ["a1", "https://en.example/a1"],
      ["a2", ""],
    ]);

    // تبدیل به «همان لینک زبان پیش‌فرض» هم با پاک شدن نسخه قدیمی ماندگار است
    const a3 = await formOf("a3");
    await adminSaveApp({ data: { ...a3, locales: { en: { downloadUrl: "", enabled: true } } } });
    expect(setting("apps_locales").a3).toEqual({});
    expect(setting("apps_en")).toEqual({ a2: legacyEn.a2 });
    expect((await fetchPublicApp("a3", "en"))?.downloadUrl).toBe("https://store.example/a3");
  });

  it("removes a stale legacy entry when the new English entry is removed", async () => {
    fake.tables["settings"]?.push(
      settingRow("apps_locales", {
        a1: { en: { downloadUrl: "https://en.example/new", enabled: true } },
      }),
    );
    const form = await formOf("a1");
    expect(form.locales.en).toEqual({ downloadUrl: "https://en.example/new", enabled: true });
    await saveApp({ ...form, locales: {} });
    // apps_en قدیمی دوباره جای نسخه پاک‌شده خوانده نمی‌شود
    expect(setting("apps_en")).toEqual({ a2: legacyEn.a2, a3: legacyEn.a3 });
    expect((await fetchPublicApp("a1", "en"))?.downloadUrl).toBe("https://store.example/a1");
  });

  it("treats unchanged old English fields as untouched", async () => {
    const { locales: _locales, ...form } = await formOf("a3");
    expect(form).toMatchObject({ downloadUrlEn: "https://en.example/a3", enabledEn: false });
    await saveApp(form);
    expect(setting("apps_en")).toEqual(legacyEn);
    await saveApp({ ...form, enabledEn: true });
    expect(setting("apps_locales").a3).toEqual({
      en: { downloadUrl: "https://en.example/a3", enabled: true },
    });
    expect(setting("apps_en")).toEqual({ a1: legacyEn.a1, a2: legacyEn.a2 });
  });

  it("accepts the legacy flag only for English", async () => {
    const form = await formOf("a1");
    await adminSaveApp({
      data: {
        ...form,
        locales: { ...form.locales, tr: { downloadUrl: "", enabled: false, legacy: true } },
      },
    });
    expect(setting("apps_locales").a1).toEqual({ tr: { downloadUrl: "", enabled: false } });
  });
});

describe("/go fallback when the app has no page in either language", () => {
  // بازبینی: برنامه‌ای که فقط با نسخه قدیمی انگلیسی نمایش داده می‌شود، از زبان‌های دیگر به ۴۰۴ می‌رفت
  beforeEach(() => {
    fake.tables["apps"] = [
      appRow("mac", { enabled: 0 }),
      appRow("off", { enabled: 0 }),
      appRow("ios"),
    ];
    fake.tables["settings"] = [settingRow("apps_en", { mac: { downloadUrl: "", enabled: true } })];
  });

  it("goes to the app list of the resolved language, without an extra hop", async () => {
    fake.settings = site("fa", ["fa", "en", "tr"]);
    expect(await goLocation("https://webyar.ai/go/mac")).toBe("/download");
    expect(await goLocation("https://webyar.ai/go/mac?l=fa")).toBe("/download");
    expect(await goLocation("https://webyar.ai/go/mac?l=tr")).toBe("/tr/download");
    expect(
      await goLocation("https://webyar.ai/go/mac", {
        referer: "https://webyar.ai/tr/download/mac",
      }),
    ).toBe("/tr/download");
    // زبان غیرفعال: فهرست زبان پیش‌فرض (نه /ar/download که ریدایرکت اضافه دارد)
    expect(await goLocation("https://webyar.ai/go/mac?l=ar")).toBe("/download");
    // جایی که نمایش داده می‌شود، همان صفحه برنامه
    expect(await goLocation("https://webyar.ai/go/mac?l=en")).toBe("/en/download/mac");
    expect(await goLocation("https://webyar.ai/go/off?l=en")).toBe("/en/download");
    // slug ناشناخته مثل قبل
    expect(await goLocation("https://webyar.ai/go/missing?l=tr")).toBe("/download/missing");
    expect(fake.tables["app_download_clicks"] ?? []).toHaveLength(0);
    expect(
      appFallbackPath("x", app({ enabled: false }), {}, { locale: "en", defaultLocale: "fa" }),
    ).toBe("/en/download");
  });

  it("does not change the single-language Persian site", async () => {
    fake.settings = site();
    expect(await goLocation("https://webyar.ai/go/off")).toBe("/download/off");
    expect(await goLocation("https://webyar.ai/go/mac?l=tr")).toBe("/download/mac");
    for (const query of queriesOf("apps"))
      expect(query.filters).toContainEqual(["enabled", "eq", 1]);
    expect(queriesOf("settings")).toEqual([]);
  });
});
