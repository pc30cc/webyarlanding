// آمار بازدید سایت — فقط سمت سرور.
import { getRequest } from "@tanstack/react-start/server";
import { db, newId, nowIso } from "./db.server";

const ONLINE_WINDOW_MINUTES = 3;

interface CloudflareRequestCf {
  country?: string;
  city?: string;
  region?: string;
}

/**
 * موقعیت جغرافیایی بازدیدکننده — از شیء cf که کلادفلر روی هر درخواست ورودی
 * می‌گذارد (سایت روی کلادفلر ورکرز دیپلوی می‌شود)، با بازگشت به هدر استاندارد
 * CF-IPCountry اگر شیء cf در دسترس نبود.
 */
function getVisitorGeo(): { country: string; city: string } {
  try {
    const request = getRequest() as Request & { cf?: CloudflareRequestCf };
    const country = request.cf?.country || request.headers.get("cf-ipcountry") || "";
    const city = request.cf?.city || request.cf?.region || "";
    return { country, city };
  } catch {
    return { country: "", city: "" };
  }
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function recordVisit(sessionId: string, path: string): Promise<void> {
  const geo = getVisitorGeo();
  const { data: existingPresence } = await db
    .from("site_presence")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  const isNewVisitor = !existingPresence;

  await Promise.all([
    db.from("site_visits").insert({ id: newId(), session_id: sessionId, path: path.slice(0, 500) }),
    db
      .from("site_presence")
      .upsert(
        { session_id: sessionId, path: path.slice(0, 500), last_seen: nowIso() },
        { onConflict: "session_id" },
      ),
  ]);

  if (isNewVisitor) {
    try {
      const { notifyNewVisit } = await import("./telegram.server");
      await notifyNewVisit(path, geo);
    } catch (e) {
      console.error("recordVisit: notifyNewVisit failed:", e);
    }
  }
}

export async function pingPresence(sessionId: string, path: string): Promise<void> {
  await db
    .from("site_presence")
    .upsert(
      { session_id: sessionId, path: path.slice(0, 500), last_seen: nowIso() },
      { onConflict: "session_id" },
    );
}

export interface DailyVisitPoint {
  date: string;
  count: number;
}

export interface VisitStatsDto {
  onlineNow: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  daily: DailyVisitPoint[];
}

export async function getVisitStats(): Promise<VisitStatsDto> {
  const [onlineRes, todayRes, weekRes, monthRes, dailyRes] = await Promise.all([
    db
      .from("site_presence")
      .select("session_id", { count: "exact", head: true })
      .gte("last_seen", minutesAgoIso(ONLINE_WINDOW_MINUTES)),
    db
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfTodayIso()),
    db
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", daysAgoIso(6)),
    db
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", daysAgoIso(29)),
    db.from("site_visits").select("created_at").gte("created_at", daysAgoIso(13)),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of dailyRes.data ?? []) {
    const key = String(row.created_at).slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    onlineNow: onlineRes.count ?? 0,
    today: todayRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    thisMonth: monthRes.count ?? 0,
    daily: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  };
}
