// موتور بررسی و رفع خودکار مشکلات سئو بر اساس داده‌های گوگل سرچ کنسول — فقط سمت سرور.
import { db, newId, nowIso } from "./db.server";
import { loadSettings, saveSettings } from "./settings.server";
import { looksLikeRobotsTxt } from "./seo-meta";
import type { SiteSettings } from "./settings";

export type IssueSeverity = "error" | "warning" | "info";

export interface SeoIssue {
  /** دسته مشکل */
  kind: string;
  /** صفحه یا موردی که مشکل دارد */
  target: string;
  title: string;
  detail: string;
  severity: IssueSeverity;
  /** آیا خودکار رفع شد؟ */
  fixed: boolean;
  fixNote: string;
}

export interface SeoAuditReport {
  runAt: string;
  property: string;
  connected: boolean;
  error?: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number; position: number }[];
  /** وضعیت ایندکس همه آدرس‌های نقشه سایت (مثل بخش Page indexing در سرچ کنسول) */
  coverage?: {
    checked: number;
    indexed: number;
    notIndexed: number;
    groups: { reason: string; count: number; examples: string[] }[];
  };
  issues: SeoIssue[];
  fixedCount: number;
  summary: string;
}

/** ترجمه فارسی دلیل‌های رایج ایندکس‌نشدن در سرچ کنسول */
const COVERAGE_FA: Record<string, string> = {
  "Discovered - currently not indexed": "کشف شده ولی هنوز ایندکس نشده",
  "Crawled - currently not indexed": "خزیده شده ولی ایندکس نشده",
  "Duplicate without user-selected canonical": "تکراری بدون کنونیکال مشخص",
  "Duplicate, Google chose different canonical than user":
    "تکراری؛ گوگل کنونیکال دیگری انتخاب کرده",
  "Alternate page with proper canonical tag": "صفحه جایگزین با کنونیکال درست",
  "Excluded by ‘noindex’ tag": "با دستور noindex حذف شده",
  "Blocked by robots.txt": "با robots.txt مسدود شده",
  "Page with redirect": "صفحه دارای تغییر مسیر",
  "Not found (404)": "پیدا نشد (۴۰۴)",
  "Soft 404": "۴۰۴ نرم",
  "Server error (5xx)": "خطای سرور",
  "URL is unknown to Google": "گوگل این آدرس را نمی‌شناسد",
};

function coverageFa(reason: string): string {
  return COVERAGE_FA[reason] ?? reason ?? "دلیل نامشخص";
}

/** خواندن همه آدرس‌های نقشه سایت */
async function fetchSitemapUrls(site: string): Promise<string[]> {
  try {
    const res = await fetch(`${site}/sitemap.xml`, { headers: { Accept: "application/xml" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      m[1]!.trim().replace(/&amp;/g, "&"),
    );
    return [...new Set(locs)];
  } catch (e) {
    console.error("fetchSitemapUrls failed:", e);
    return [];
  }
}

/** اجرای موازی محدود */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length) as R[];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

const STATIC_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "صفحه اصلی" },
  { path: "/products", label: "محصولات" },
  { path: "/solutions", label: "راه‌کارها" },
  { path: "/about", label: "درباره ما" },
  { path: "/pricing", label: "تعرفه‌ها" },
  { path: "/contact", label: "تماس با ما" },
  { path: "/blog", label: "وبلاگ" },
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function baseUrl(settings: SiteSettings): string {
  return (settings.brand.siteUrl || "").replace(/\/$/, "");
}

/** ساخت JSON-LD پایه برای یک صفحه ثابت */
function buildWebPageSchema(name: string, description: string, url: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
  });
}

interface MetaSuggestion {
  key: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword?: string;
}

async function suggestMeta(
  brand: string,
  items: { key: string; title: string; context: string }[],
): Promise<Record<string, MetaSuggestion>> {
  if (items.length === 0) return {};
  const { aiJson } = await import("./ai.server");
  const payload = items
    .map((i) => `- key: ${i.key}\n  عنوان: ${i.title}\n  خلاصه: ${i.context.slice(0, 400)}`)
    .join("\n");
  const result = await aiJson<{ items: MetaSuggestion[] }>(
    "شما متخصص سئوی فارسی هستید و فقط یک JSON معتبر برمی‌گردانید. درباره قیمت، تعرفه، تخفیف یا پلن چیزی ننویسید.",
    `برای هر مورد زیر یک عنوان سئو (حداکثر ۶۰ کاراکتر، شامل نام برند «${brand}» فقط در صورت جا داشتن)، ` +
      `یک توضیح متا (۱۲۰ تا ۱۵۵ کاراکتر) و یک کلمه کلیدی هدف فارسی بنویس.\n\n${payload}\n\n` +
      `خروجی دقیقاً: {"items":[{"key":"...","seoTitle":"...","seoDescription":"...","focusKeyword":"..."}]}`,
    { items: [] },
  );
  const map: Record<string, MetaSuggestion> = {};
  for (const s of result.items ?? []) if (s?.key) map[s.key] = s;
  return map;
}

/** اجرای کامل بررسی سئو؛ با autoFix مشکلات قابل‌رفع را همان‌جا روی سایت اصلاح می‌کند */
export async function runSeoAudit(options?: { autoFix?: boolean }): Promise<SeoAuditReport> {
  const settings = await loadSettings();
  const autoFix = options?.autoFix ?? settings.searchConsole.autoFix;
  const site = baseUrl(settings);
  const brand = settings.brand.name;
  const issues: SeoIssue[] = [];

  const report: SeoAuditReport = {
    runAt: nowIso(),
    property: settings.searchConsole.property,
    connected: false,
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topQueries: [],
    topPages: [],
    issues,
    fixedCount: 0,
    summary: "",
  };

  const gsc = await import("./gsc.server");

  // ۱) اتصال و انتخاب پراپرتی
  let property = "";
  try {
    const resolved = await gsc.resolveProperty(site, settings.searchConsole.property || undefined);
    property = resolved.property;
    report.property = property;
    report.connected = true;
  } catch (e) {
    report.error = e instanceof Error ? e.message : "اتصال به سرچ کنسول ناموفق بود";
    issues.push({
      kind: "connection",
      target: site,
      title: "اتصال به گوگل سرچ کنسول برقرار نشد",
      detail: report.error,
      severity: "error",
      fixed: false,
      fixNote: "",
    });
  }

  // ۲) داده‌های عملکرد ۲۸ روز اخیر
  if (property) {
    const range = { startDate: daysAgo(30), endDate: daysAgo(2) };
    try {
      const [queries, pages] = await Promise.all([
        gsc.querySearchAnalytics(property, { ...range, dimensions: ["query"], rowLimit: 10 }),
        gsc.querySearchAnalytics(property, { ...range, dimensions: ["page"], rowLimit: 20 }),
      ]);
      report.topQueries = queries.map((r) => ({
        query: r.keys[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        position: Math.round(r.position * 10) / 10,
      }));
      report.topPages = pages.map((r) => ({
        page: r.keys[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        position: Math.round(r.position * 10) / 10,
      }));
      const clicks = pages.reduce((a, r) => a + r.clicks, 0);
      const impressions = pages.reduce((a, r) => a + r.impressions, 0);
      report.totals = {
        clicks,
        impressions,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
        position:
          pages.length > 0
            ? Math.round((pages.reduce((a, r) => a + r.position, 0) / pages.length) * 10) / 10
            : 0,
      };
    } catch (e) {
      console.error("searchAnalytics failed:", e);
    }

    // ۳) نقشه سایت
    try {
      const sitemapUrl = `${site}/sitemap.xml`;
      const sitemaps = await gsc.listSitemaps(property);
      const mine = sitemaps.find((s) => s.path === sitemapUrl);
      if (!mine) {
        let fixed = false;
        if (autoFix) {
          try {
            await gsc.submitSitemap(property, sitemapUrl);
            fixed = true;
          } catch (e) {
            console.error("submitSitemap failed:", e);
          }
        }
        issues.push({
          kind: "sitemap",
          target: sitemapUrl,
          title: "نقشه سایت در سرچ کنسول ثبت نشده بود",
          detail: "گوگل هیچ sitemap.xml ثبت‌شده‌ای برای این سایت نداشت.",
          severity: "error",
          fixed,
          fixNote: fixed ? "نقشه سایت برای گوگل ارسال شد" : "",
        });
      } else if (Number(mine.errors ?? 0) > 0) {
        let fixed = false;
        if (autoFix) {
          try {
            await gsc.submitSitemap(property, sitemapUrl);
            fixed = true;
          } catch (e) {
            console.error("resubmitSitemap failed:", e);
          }
        }
        issues.push({
          kind: "sitemap",
          target: sitemapUrl,
          title: `گوگل برای نقشه سایت ${mine.errors} خطا گزارش کرده است`,
          detail: "علت دقیق را گوگل اعلام نمی‌کند؛ نقشه سایت دوباره برای پردازش ارسال شد.",
          severity: "warning",
          fixed,
          fixNote: fixed ? "نقشه سایت دوباره ارسال شد" : "",
        });
      }
    } catch (e) {
      console.error("listSitemaps failed:", e);
    }

    // ۴) وضعیت ایندکس صفحه اصلی و پربازدیدترین صفحات
    const inspectTargets = [site + "/", ...report.topPages.slice(0, 6).map((p) => p.page)].filter(
      (v, i, arr) => v && arr.indexOf(v) === i,
    );
    for (const url of inspectTargets) {
      const result = await gsc.inspectUrl(property, url);
      if (!result) continue;
      if (result.robotsTxtState === "DISALLOWED") {
        issues.push({
          kind: "robots",
          target: url,
          title: "این صفحه با robots.txt برای گوگل مسدود شده است",
          detail: "گوگل اجازه خزیدن این آدرس را ندارد.",
          severity: "error",
          fixed: false,
          fixNote: "",
        });
      } else if (result.verdict !== "PASS") {
        issues.push({
          kind: "indexing",
          target: url,
          title: "این صفحه در گوگل ایندکس نشده است",
          detail: result.coverageState || result.indexingState || "وضعیت نامشخص",
          severity: "warning",
          fixed: false,
          fixNote: "",
        });
      }
    }
  }

  // ۵) robots.txt سفارشی که کل سایت را می‌بندد
  const customRobots = settings.seo.robots ?? "";
  if (looksLikeRobotsTxt(customRobots) && /^\s*Disallow:\s*\/\s*$/im.test(customRobots)) {
    let fixed = false;
    if (autoFix) {
      settings.seo.robots = "";
      await saveSettings(settings);
      fixed = true;
    }
    issues.push({
      kind: "robots",
      target: "/robots.txt",
      title: "robots.txt کل سایت را برای موتورهای جست‌وجو بسته بود",
      detail: "دستور «Disallow: /» جلوی خزیدن همه صفحات را می‌گرفت.",
      severity: "error",
      fixed,
      fixNote: fixed ? "به حالت پیش‌فرض و باز برگردانده شد" : "",
    });
  }

  // ۶) مقالات منتشرشده با متای ناقص
  const { data: postRows } = await db
    .from("blog_posts")
    .select("id, title, slug, excerpt, seo_title, seo_description, focus_keyword, canonical_url, robots")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  const brokenPosts = (postRows ?? []).filter(
    (p) => !p.seo_title || !p.seo_description || !p.focus_keyword,
  );
  const postBatch = brokenPosts.slice(0, 12);
  const postMeta = autoFix
    ? await suggestMeta(
        brand,
        postBatch.map((p) => ({ key: p.id, title: p.title, context: p.excerpt ?? "" })),
      )
    : {};

  for (const p of brokenPosts) {
    const s = postMeta[p.id];
    let fixed = false;
    if (s) {
      await db
        .from("blog_posts")
        .update({
          seo_title: p.seo_title || s.seoTitle || p.title,
          seo_description: p.seo_description || s.seoDescription || "",
          focus_keyword: p.focus_keyword || s.focusKeyword || "",
          canonical_url: p.canonical_url || `${site}/blog/${p.slug}`,
          updated_at: nowIso(),
        })
        .eq("id", p.id);
      fixed = true;
    }
    issues.push({
      kind: "meta",
      target: `/blog/${p.slug}`,
      title: `مقاله «${p.title}» متای سئوی ناقص داشت`,
      detail: [
        !p.seo_title && "عنوان سئو",
        !p.seo_description && "توضیحات متا",
        !p.focus_keyword && "کلمه کلیدی هدف",
      ]
        .filter(Boolean)
        .join("، "),
      severity: "warning",
      fixed,
      fixNote: fixed ? "با هوش مصنوعی نوشته و ذخیره شد" : "در نوبت بررسی بعدی اصلاح می‌شود",
    });
  }

  // ۷) صفحات ثابت: عنوان/توضیح/کنونیکال/داده ساختاریافته
  const { data: seoRows } = await db.from("seo_pages").select("*");
  const byPath = new Map((seoRows ?? []).map((r) => [r.path, r]));
  const missingPages = STATIC_PAGES.filter((sp) => {
    const row = byPath.get(sp.path);
    return !row || !row.title || !row.description || !row.schema_json;
  });
  const pageMeta = autoFix
    ? await suggestMeta(
        brand,
        missingPages.map((sp) => ({
          key: sp.path,
          title: `${sp.label} — ${brand}`,
          context: `صفحه «${sp.label}» سایت ${brand}: ${settings.brand.tagline}`,
        })),
      )
    : {};

  for (const sp of missingPages) {
    const row = byPath.get(sp.path);
    const s = pageMeta[sp.path];
    let fixed = false;
    if (s) {
      const title = row?.title || s.seoTitle || `${sp.label} | ${brand}`;
      const description = row?.description || s.seoDescription || settings.seo.metaDescription;
      const payload = {
        page_key: row?.page_key || sp.path.replace(/\//g, "") || "home",
        path: sp.path,
        title,
        description,
        og_image: row?.og_image || settings.seo.ogImage,
        canonical_url: row?.canonical_url || `${site}${sp.path === "/" ? "/" : sp.path}`,
        robots: row?.robots || "index,follow",
        schema_json: row?.schema_json || buildWebPageSchema(title, description, `${site}${sp.path}`),
        updated_at: nowIso(),
      };
      if (row) await db.from("seo_pages").update(payload).eq("id", row.id);
      else await db.from("seo_pages").insert({ id: newId(), ...payload });
      fixed = true;
    }
    issues.push({
      kind: "page-meta",
      target: sp.path,
      title: `صفحه «${sp.label}» تنظیمات سئوی کامل نداشت`,
      detail: [
        !row && "هیچ رکورد سئویی نداشت",
        row && !row.title && "عنوان",
        row && !row.description && "توضیح متا",
        row && !row.schema_json && "داده ساختاریافته",
      ]
        .filter(Boolean)
        .join("، "),
      severity: "warning",
      fixed,
      fixNote: fixed ? "عنوان، توضیح، کنونیکال و داده ساختاریافته ساخته شد" : "",
    });
  }

  report.fixedCount = issues.filter((i) => i.fixed).length;
  report.summary =
    issues.length === 0
      ? "هیچ مشکلی پیدا نشد؛ وضعیت سئوی سایت سالم است."
      : `${issues.length} مورد بررسی شد و ${report.fixedCount} مورد خودکار رفع شد.`;

  // ذخیره گزارش در تنظیمات
  const fresh = await loadSettings();
  fresh.searchConsole.lastRunAt = report.runAt;
  fresh.searchConsole.property = report.property;
  fresh.searchConsole.lastReport = JSON.stringify(report).slice(0, 60_000);
  await saveSettings(fresh);

  return report;
}

/** متن خلاصه گزارش برای ارسال در تلگرام */
export function formatAuditForTelegram(report: SeoAuditReport): string {
  const lines: string[] = ["🔎 گزارش سئو (گوگل سرچ کنسول)", ""];
  if (!report.connected) {
    lines.push(`⚠️ اتصال برقرار نشد: ${report.error ?? "نامشخص"}`);
    return lines.join("\n");
  }
  lines.push(`🔗 پراپرتی: ${report.property}`);
  lines.push(
    `📈 ۲۸ روز اخیر — کلیک: ${report.totals.clicks} | نمایش: ${report.totals.impressions} | CTR: ${report.totals.ctr}% | میانگین رتبه: ${report.totals.position}`,
  );
  lines.push("");
  lines.push(`🛠 ${report.summary}`);
  const shown = report.issues.slice(0, 12);
  for (const i of shown) {
    lines.push(`${i.fixed ? "✅" : "⚠️"} ${i.title}${i.fixNote ? ` — ${i.fixNote}` : ""}`);
  }
  if (report.issues.length > shown.length) {
    lines.push(`… و ${report.issues.length - shown.length} مورد دیگر در پنل مدیریت`);
  }
  if (report.topQueries.length > 0) {
    lines.push("");
    lines.push("🔍 پرجست‌وجوترین عبارت‌ها:");
    for (const q of report.topQueries.slice(0, 5)) {
      lines.push(`• ${q.query} — نمایش ${q.impressions}، رتبه ${q.position}`);
    }
  }
  return lines.join("\n");
}
