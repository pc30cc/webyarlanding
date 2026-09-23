// برنامه‌های قابل دانلود (iOS / Android / Windows) و آمار کلیک دانلود — فقط سمت سرور.
import { db, newId, nowIso, toBool, fromBool, parseJson, slugify } from "./db.server";
import type { AppDto, AppInput, AppStats } from "./apps.functions";

type Row = Record<string, unknown>;

function mapRow(r: Row): AppDto {
  return {
    id: String(r.id),
    slug: String(r.slug),
    platform: (String(r.platform) as AppDto["platform"]) || "ios",
    name: String(r.name ?? ""),
    subtitle: String(r.subtitle ?? ""),
    iconUrl: String(r.icon_url ?? ""),
    shortDesc: String(r.short_desc ?? ""),
    description: String(r.description ?? ""),
    features: parseJson<string[]>(r.features_json as string, []),
    screenshots: parseJson<string[]>(r.screenshots_json as string, []),
    version: String(r.version ?? ""),
    size: String(r.size ?? ""),
    minOs: String(r.min_os ?? ""),
    downloadUrl: String(r.download_url ?? ""),
    sortOrder: Number(r.sort_order ?? 0),
    enabled: toBool(r.enabled),
  };
}

export async function fetchPublicApps(): Promise<AppDto[]> {
  const { data, error } = await db.from("apps").select("*").eq("enabled", 1).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
}

export async function fetchPublicApp(slug: string): Promise<AppDto | null> {
  const { data, error } = await db
    .from("apps")
    .select("*")
    .eq("slug", slug)
    .eq("enabled", 1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function adminFetchApps(): Promise<AppDto[]> {
  const { data, error } = await db.from("apps").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
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
  if (input.id) {
    const { error } = await db.from("apps").update(row).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const id = newId();
  const { error } = await db.from("apps").insert({ id, ...row, created_at: nowIso() });
  if (error) throw error;
  return id;
}

export async function deleteApp(id: string): Promise<void> {
  await db.from("app_download_clicks").delete().eq("app_id", id);
  const { error } = await db.from("apps").delete().eq("id", id);
  if (error) throw error;
}

/** ثبت کلیک و برگرداندن لینک مقصد (یا null اگر برنامه/لینک نباشد) */
export async function recordClick(
  slug: string,
  meta: { referrer?: string | null; userAgent?: string | null },
): Promise<string | null> {
  const app = await fetchPublicApp(slug);
  if (!app || !app.downloadUrl) return null;
  await db.from("app_download_clicks").insert({
    id: newId(),
    app_id: app.id,
    platform: app.platform,
    referrer: (meta.referrer || "").slice(0, 500) || null,
    user_agent: (meta.userAgent || "").slice(0, 400) || null,
    created_at: nowIso(),
  });
  return app.downloadUrl;
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
    perApp.push({ appId: a.id, name: a.name, platform: a.platform, total: count ?? 0, last30: last30 ?? 0 });
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
    const d = String((r as Row).created_at).slice(0, 10);
    if (byDay.has(d)) byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return { total, perApp, daily: [...byDay].map(([date, count]) => ({ date, count })) };
}
