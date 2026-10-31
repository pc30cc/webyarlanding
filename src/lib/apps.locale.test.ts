import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import type { Locale } from "./locales";
import type { AppDto } from "./apps.functions";

type Row = Record<string, unknown>;

// دیتابیس ساختگی: جدول apps، ردیف‌های settings و کلیک‌ها
const fake = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
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
import { appDownloadHref, getPublicApp, getPublicApps } from "./apps.functions";

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

beforeEach(() => {
  fake.tables = {};
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
      en: { downloadUrl: "https://en.example", enabled: false },
    });
    // apps_locales برای این برنامه (حتی خالی) بر apps_en مقدم است
    expect(
      appLocaleOverrides("ios", { ...legacy, locales: { ios: { tr: { downloadUrl: "x" } } } }),
    ).toEqual({ tr: { downloadUrl: "x", enabled: true } });
    expect(appLocaleOverrides("ios", { ...legacy, locales: { ios: {} } })).toEqual({});
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
    expect(await recordClick("ios", { locale: "en" })).toBe("https://en.example");
    expect(await recordClick("ios", {})).toBe("https://store.example/ios");
    // زبان غیرفعال = زبان پیش‌فرض
    expect(await recordClick("ios", { locale: "tr" })).toBe("https://store.example/ios");
    expect(await recordClick("missing", { locale: "en" })).toBeNull();
    expect(fake.tables["app_download_clicks"]).toHaveLength(3);
  });
});
