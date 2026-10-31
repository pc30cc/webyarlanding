// برنامه‌های قابل دانلود (iOS / Android / Windows) و آمار کلیک دانلود — فقط سمت سرور.
import { db, newId, nowIso, toBool, fromBool, parseJson, slugify } from "./db.server";
import { loadSettings } from "./settings.server";
import { getDefaultLocale, resolvePageLocale, getActiveLocales } from "./settings";
import { isLocale, splitLocalePrefix, type Locale } from "./locales";
import type {
  AppDto,
  AppInput,
  AppLocaleOverride,
  AppLocaleOverrides,
  AppStats,
} from "./apps.functions";

type Row = Record<string, unknown>;

// لینک و وضعیت نمایش برنامه‌ها در هر زبان، جدا از مقادیر پایه جدول apps، در ردیف apps_locales
// جدول settings نگه داشته می‌شوند: { appId: { en?: {...}, tr?: {...}, ar?: {...} } } (بدون نیاز به
// تغییر ساختار جدول apps) و هرگز مستقیم به کلاینت فرستاده نمی‌شوند. ردیف قدیمی apps_en
// ({ appId: { downloadUrl, enabled } }) برای برنامه‌ای که هنوز در apps_locales نیست، همان نسخه
// انگلیسی حساب می‌شود؛ با اولین ذخیره برنامه، apps_locales جای آن را می‌گیرد.
const LOCALES_KEY = "apps_locales";
const LEGACY_EN_KEY = "apps_en";

type StoredOverride = { downloadUrl?: unknown; enabled?: unknown };

export interface AppLocaleStore {
  /** apps_locales: برای هر برنامه، نسخه هر زبان */
  locales: Record<string, Record<string, StoredOverride>>;
  /** apps_en قدیمی: نسخه انگلیسی هر برنامه */
  legacyEn: Record<string, StoredOverride>;
}

const emptyStore = (): AppLocaleStore => ({ locales: {}, legacyEn: {} });

function asObject<T>(value: unknown): Record<string, T> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

function parseStore(rows: { setting_key: string; setting_value: string | null }[]): AppLocaleStore {
  const value = (key: string) =>
    asObject<never>(parseJson<unknown>(rows.find((r) => r.setting_key === key)?.setting_value, {}));
  return { locales: value(LOCALES_KEY), legacyEn: value(LEGACY_EN_KEY) };
}

/** خواندن هر دو ردیف در یک کوئری؛ با `strict` خطای دیتابیس پرتاب می‌شود (برای ذخیره). */
async function loadLocaleStore(strict = false): Promise<AppLocaleStore> {
  const { data, error } = await db
    .from("settings")
    .select("setting_key, setting_value")
    .in("setting_key", [LOCALES_KEY, LEGACY_EN_KEY]);
  if (error) {
    if (strict) throw error;
    // صفحه عمومی بدون نسخه‌های زبان (با مقادیر پایه) رندر می‌شود، نه با خطا
    console.error("apps locale overrides load failed:", error);
    return emptyStore();
  }
  return parseStore(data ?? []);
}

async function saveSettingRow(key: string, value: unknown): Promise<void> {
  const { data, error: readError } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", key)
    .maybeSingle();
  if (readError) throw readError;
  const payload = {
    setting_key: key,
    setting_value: JSON.stringify(value),
    is_private: 1,
    updated_at: nowIso(),
  };
  const { error } = data
    ? await db.from("settings").update(payload).eq("id", data.id)
    : await db.from("settings").insert({ id: newId(), ...payload });
  if (error) throw error;
}

function normalizeOverride(entry: StoredOverride): AppLocaleOverride {
  return {
    downloadUrl: typeof entry.downloadUrl === "string" ? entry.downloadUrl.trim() : "",
    enabled: entry.enabled !== false,
  };
}

/**
 * نسخه هر زبان یک برنامه. ردیف apps_en قدیمی فقط وقتی خوانده می‌شود که برنامه هنوز در
 * apps_locales ثبت نشده باشد؛ زبان ناشناخته و مقدار خراب نادیده گرفته می‌شود.
 */
export function appLocaleOverrides(appId: string, store: AppLocaleStore): AppLocaleOverrides {
  const stored = store.locales[appId];
  const legacy = store.legacyEn[appId];
  const source: Record<string, unknown> =
    stored !== undefined ? asObject(stored) : legacy !== undefined ? { en: legacy } : {};
  const result: AppLocaleOverrides = {};
  for (const [locale, entry] of Object.entries(source)) {
    if (isLocale(locale) && entry && typeof entry === "object")
      result[locale] = normalizeOverride(entry as StoredOverride);
  }
  return result;
}

/**
 * نسخه‌ای که صفحه یک زبان می‌بیند: لینک همان زبان (خالی = لینک پایه) و نمایش فقط اگر برنامه
 * هم در کل سایت و هم در آن زبان روشن باشد. بدون نسخه زبان، همان مقادیر پایه.
 */
export function localizeApp(app: AppDto, override: AppLocaleOverride | undefined): AppDto {
  if (!override) return app;
  return {
    ...app,
    downloadUrl: override.downloadUrl || app.downloadUrl,
    enabled: app.enabled && override.enabled,
  };
}

/** نسخه‌های بی‌اثر (لینک خالی و روشن) ذخیره نمی‌شوند. */
function compactOverrides(overrides: AppLocaleOverrides): AppLocaleOverrides {
  const result: AppLocaleOverrides = {};
  for (const [locale, entry] of Object.entries(overrides) as [Locale, AppLocaleOverride][]) {
    const normalized = normalizeOverride(entry);
    if (normalized.downloadUrl || !normalized.enabled) result[locale] = normalized;
  }
  return result;
}

/** برنامه با نسخه‌های زبان (برای پنل)؛ downloadUrlEn/enabledEn همان نسخه en است. */
function withLocales(app: AppDto, overrides: AppLocaleOverrides): AppDto {
  const en = overrides.en;
  return {
    ...app,
    downloadUrlEn: en?.downloadUrl ?? "",
    enabledEn: en?.enabled ?? true,
    locales: overrides,
  };
}

/** زبان صفحه (زبان ناشناخته یا غیرفعال = زبان پیش‌فرض) و زبان پیش‌فرض سایت */
async function pageLocales(
  requested: Locale | null | undefined,
): Promise<{ locale: Locale; defaultLocale: Locale; active: Locale[] }> {
  const settings = await loadSettings();
  return {
    locale: resolvePageLocale(settings, requested),
    defaultLocale: getDefaultLocale(settings),
    active: getActiveLocales(settings),
  };
}

function mapRow(r: Row): AppDto {
  return {
    id: String(r["id"]),
    slug: String(r["slug"]),
    platform: (String(r["platform"]) as AppDto["platform"]) || "ios",
    name: String(r["name"] ?? ""),
    subtitle: String(r["subtitle"] ?? ""),
    iconUrl: String(r["icon_url"] ?? ""),
    shortDesc: String(r["short_desc"] ?? ""),
    description: String(r["description"] ?? ""),
    features: parseJson<string[]>(r["features_json"] as string, []),
    screenshots: parseJson<string[]>(r["screenshots_json"] as string, []),
    version: String(r["version"] ?? ""),
    size: String(r["size"] ?? ""),
    minOs: String(r["min_os"] ?? ""),
    downloadUrl: String(r["download_url"] ?? ""),
    sortOrder: Number(r["sort_order"] ?? 0),
    enabled: toBool(r["enabled"]),
    downloadUrlEn: "",
    enabledEn: true,
  };
}

/**
 * برنامه‌های قابل نمایش در زبان یک صفحه. `locale` زبان آدرس صفحه است (خالی = زبان پیش‌فرض).
 * برنامه خاموش در جدول apps در هیچ زبانی نمایش داده نمی‌شود.
 */
export async function fetchPublicApps(locale?: Locale | null): Promise<AppDto[]> {
  const [{ data, error }, store, page] = await Promise.all([
    db.from("apps").select("*").eq("enabled", 1).order("sort_order"),
    loadLocaleStore(),
    pageLocales(locale),
  ]);
  if (error) throw error;
  return (data ?? [])
    .map((r) => {
      const app = mapRow(r as Row);
      return localizeApp(app, appLocaleOverrides(app.id, store)[page.locale]);
    })
    .filter((a) => a.enabled);
}

async function fetchEnabledApp(slug: string): Promise<AppDto | null> {
  const { data, error } = await db
    .from("apps")
    .select("*")
    .eq("slug", slug)
    .eq("enabled", 1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function fetchPublicApp(slug: string, locale?: Locale | null): Promise<AppDto | null> {
  const [app, store, page] = await Promise.all([
    fetchEnabledApp(slug),
    loadLocaleStore(),
    pageLocales(locale),
  ]);
  if (!app) return null;
  const overrides = appLocaleOverrides(app.id, store);
  const localized = localizeApp(app, overrides[page.locale]);
  if (!localized.enabled) return null;
  // زبان‌هایی که این برنامه در آن‌ها نمایش داده می‌شود (برای hreflang صفحه برنامه)
  const visibleLocales = page.active.filter(
    (locale) => localizeApp(app, overrides[locale]).enabled,
  );
  return { ...localized, visibleLocales };
}

export async function adminFetchApps(): Promise<AppDto[]> {
  const [{ data, error }, store] = await Promise.all([
    db.from("apps").select("*").order("sort_order"),
    loadLocaleStore(true),
  ]);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const app = mapRow(r as Row);
    return withLocales(app, appLocaleOverrides(app.id, store));
  });
}

export async function saveApp(input: AppInput): Promise<string> {
  const row = {
    slug: slugify(input.slug || input.name),
    platform: input.platform,
    name: input.name,
    subtitle: input.subtitle,
    icon_url: input.iconUrl,
    short_desc: input.shortDesc,
    description: input.description,
    features_json: JSON.stringify(input.features.filter(Boolean)),
    screenshots_json: JSON.stringify(input.screenshots.filter(Boolean)),
    version: input.version,
    size: input.size,
    min_os: input.minOs,
    download_url: input.downloadUrl,
    sort_order: input.sortOrder,
    enabled: fromBool(input.enabled),
    updated_at: nowIso(),
  };
  const id = input.id || newId();
  if (input.id) {
    const { error } = await db.from("apps").update(row).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await db.from("apps").insert({ id, ...row, created_at: nowIso() });
    if (error) throw error;
  }
  const store = await loadLocaleStore(true);
  // locales (پنل جدید) همه زبان‌ها را می‌فرستد؛ بدون آن فقط نسخه انگلیسی از فیلدهای قدیمی
  const overrides = input.locales ?? {
    ...appLocaleOverrides(id, store),
    en: { downloadUrl: input.downloadUrlEn.trim(), enabled: input.enabledEn },
  };
  // ثبت برنامه در apps_locales (حتی بدون نسخه) یعنی apps_en قدیمی دیگر برای آن خوانده نمی‌شود
  await saveSettingRow(LOCALES_KEY, { ...store.locales, [id]: compactOverrides(overrides) });
  return id;
}

export async function deleteApp(id: string): Promise<void> {
  await db.from("app_download_clicks").delete().eq("app_id", id);
  const { error } = await db.from("apps").delete().eq("id", id);
  if (error) throw error;
  const store = await loadLocaleStore(true);
  if (id in store.locales) {
    const { [id]: _removed, ...rest } = store.locales;
    await saveSettingRow(LOCALES_KEY, rest);
  }
  if (id in store.legacyEn) {
    const { [id]: _removed, ...rest } = store.legacyEn;
    await saveSettingRow(LEGACY_EN_KEY, rest);
  }
}

/**
 * زبان صفحه‌ای که لینک /go از آن کلیک شده: پارامتر ?l= (appDownloadHref)، وگرنه پیشوند
 * آدرس Referer همین سایت. نامعتبر یا ناموجود = null (زبان پیش‌فرض).
 */
export function goLinkLocale(request: { url: string; headers: Headers }): Locale | null {
  const url = new URL(request.url);
  const param = url.searchParams.get("l");
  if (param !== null) return isLocale(param) ? param : null;
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const from = new URL(referer);
    const hosts = [url.host, request.headers.get("host"), request.headers.get("x-forwarded-host")];
    return hosts.includes(from.host) ? splitLocalePrefix(from.pathname).locale : null;
  } catch {
    return null;
  }
}

/** لینک فروشگاه برای یک کلیک: نسخه زبان صفحه، وگرنه نسخه زبان پیش‌فرض (اگر در آن زبان خاموش باشد). */
export function appDownloadTarget(
  app: AppDto,
  overrides: AppLocaleOverrides,
  locale: Locale,
  defaultLocale: Locale,
): string | null {
  for (const candidate of [locale, defaultLocale]) {
    const localized = localizeApp(app, overrides[candidate]);
    if (localized.enabled && localized.downloadUrl) return localized.downloadUrl;
  }
  return null;
}

/** ثبت کلیک و برگرداندن لینک مقصد (یا null اگر برنامه/لینک نباشد) */
export async function recordClick(
  slug: string,
  meta: { referrer?: string | null; userAgent?: string | null; locale?: Locale | null },
): Promise<string | null> {
  const [app, store, page] = await Promise.all([
    fetchEnabledApp(slug),
    loadLocaleStore(),
    pageLocales(meta.locale),
  ]);
  if (!app) return null;
  const target = appDownloadTarget(
    app,
    appLocaleOverrides(app.id, store),
    page.locale,
    page.defaultLocale,
  );
  if (!target) return null;
  await db.from("app_download_clicks").insert({
    id: newId(),
    app_id: app.id,
    platform: app.platform,
    referrer: (meta.referrer || "").slice(0, 500) || null,
    user_agent: (meta.userAgent || "").slice(0, 400) || null,
    created_at: nowIso(),
  });
  return target;
}

export async function fetchAppStats(): Promise<AppStats> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const apps = await adminFetchApps();
  const perApp: AppStats["perApp"] = [];
  let total = 0;
  for (const a of apps) {
    const { count } = await db
      .from("app_download_clicks")
      .select("id", { count: "exact", head: true })
      .eq("app_id", a.id);
    const { count: last30 } = await db
      .from("app_download_clicks")
      .select("id", { count: "exact", head: true })
      .eq("app_id", a.id)
      .gte("created_at", since);
    total += count ?? 0;
    perApp.push({
      appId: a.id,
      name: a.name,
      platform: a.platform,
      total: count ?? 0,
      last30: last30 ?? 0,
    });
  }
  const { data } = await db
    .from("app_download_clicks")
    .select("created_at")
    .gte("created_at", since)
    .limit(10000);
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    byDay.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), 0);
  }
  for (const r of data ?? []) {
    const d = String((r as Row)["created_at"]).slice(0, 10);
    if (byDay.has(d)) byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return { total, perApp, daily: [...byDay].map(([date, count]) => ({ date, count })) };
}
