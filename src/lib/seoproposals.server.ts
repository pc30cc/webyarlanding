// موتور پیشنهادهای سئو و محتوا — هوش مصنوعی مشکلات را پیدا می‌کند و برای هر مورد یک «پیشنهاد»
// می‌سازد؛ هیچ تغییری روی سایت اعمال نمی‌شود مگر اینکه مدیر آن را تأیید کند.
import { db, newId, nowIso } from "./db.server";

export type ProposalStatus = "pending" | "approved" | "rejected" | "applied" | "failed";

export type ProposalAction =
  | "sitemap_submit"
  | "robots_clear"
  | "post_meta"
  | "page_meta"
  | "post_content";

export interface SeoProposal {
  id: string;
  kind: string;
  action: ProposalAction;
  target: string;
  title: string;
  detail: string;
  severity: "error" | "warning" | "info";
  before: string;
  after: string;
  status: ProposalStatus;
  error: string;
  source: string;
  createdAt: string;
  decidedAt: string;
  appliedAt: string;
}

interface ProposalRow {
  id: string;
  kind: string;
  action: string;
  target: string;
  title: string;
  detail: string;
  severity: string;
  before_json: string | null;
  after_json: string | null;
  status: string;
  error: string | null;
  source: string;
  created_at: string;
  decided_at: string | null;
  applied_at: string | null;
}

function toDto(row: ProposalRow): SeoProposal {
  return {
    id: row.id,
    kind: row.kind,
    action: row.action as ProposalAction,
    target: row.target,
    title: row.title,
    detail: row.detail,
    severity: (row.severity as SeoProposal["severity"]) ?? "warning",
    before: row.before_json ?? "",
    after: row.after_json ?? "",
    status: (row.status as ProposalStatus) ?? "pending",
    error: row.error ?? "",
    source: row.source,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? "",
    appliedAt: row.applied_at ?? "",
  };
}

/** حداکثر تعداد پیشنهاد جدید در هر بررسی، تا هزینه و حجم کار کنترل شود */
const MAX_NEW_PROPOSALS = 12;
/** حداکثر تعداد مقاله‌ای که در هر بررسی برای بهبود متن انتخاب می‌شود */
const MAX_CONTENT_REWRITES = 3;

export async function listProposals(status?: ProposalStatus): Promise<SeoProposal[]> {
  let query = db
    .from("seo_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return ((data ?? []) as ProposalRow[]).map(toDto);
}

async function hasOpenProposal(action: string, target: string): Promise<boolean> {
  const { data } = await db
    .from("seo_proposals")
    .select("id")
    .eq("action", action)
    .eq("target", target)
    .in("status", ["pending", "approved"])
    .limit(1);
  return (data ?? []).length > 0;
}

interface NewProposal {
  kind: string;
  action: ProposalAction;
  target: string;
  title: string;
  detail: string;
  severity: SeoProposal["severity"];
  before?: unknown;
  after: unknown;
}

async function insertProposal(p: NewProposal, source: string): Promise<SeoProposal | null> {
  if (await hasOpenProposal(p.action, p.target)) return null;
  const row = {
    id: newId(),
    kind: p.kind,
    action: p.action,
    target: p.target.slice(0, 500),
    title: p.title.slice(0, 500),
    detail: p.detail.slice(0, 4000),
    severity: p.severity,
    before_json: JSON.stringify(p.before ?? null).slice(0, 200_000),
    after_json: JSON.stringify(p.after).slice(0, 200_000),
    status: "pending",
    error: "",
    source,
    created_at: nowIso(),
  };
  const { error } = await db.from("seo_proposals").insert(row);
  if (error) {
    console.error("insertProposal failed:", error);
    return null;
  }
  return toDto({ ...row, decided_at: null, applied_at: null } as ProposalRow);
}

export interface ReviewResult {
  runAt: string;
  connected: boolean;
  error?: string;
  auditSummary: string;
  created: SeoProposal[];
  pendingCount: number;
}

/** بررسی کامل سئو + ساخت پیشنهادها (بدون اعمال هیچ تغییری روی سایت) */
export async function runSeoReview(source: "cron" | "manual" | "telegram"): Promise<ReviewResult> {
  const { runSeoAudit } = await import("./seoaudit.server");
  const { loadSettings } = await import("./settings.server");
  const { aiJson } = await import("./ai.server");

  const settings = await loadSettings();
  const brand = settings.brand.name;
  const site = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const report = await runSeoAudit({ autoFix: false });

  const created: SeoProposal[] = [];
  const push = async (p: NewProposal) => {
    if (created.length >= MAX_NEW_PROPOSALS) return;
    const saved = await insertProposal(p, source);
    if (saved) created.push(saved);
  };

  // ۱) نقشه سایت و robots.txt — کارهای فنی ساده
  for (const issue of report.issues) {
    if (created.length >= MAX_NEW_PROPOSALS) break;
    if (issue.kind === "sitemap") {
      await push({
        kind: "فنی",
        action: "sitemap_submit",
        target: issue.target,
        title: "ارسال دوباره نقشه سایت به گوگل",
        detail: `${issue.title}\n${issue.detail}`,
        severity: "error",
        after: { property: report.property, sitemapUrl: issue.target },
      });
    } else if (issue.kind === "robots") {
      await push({
        kind: "فنی",
        action: "robots_clear",
        target: "/robots.txt",
        title: "باز کردن robots.txt برای موتورهای جست‌وجو",
        detail: `${issue.title}\n${issue.detail}`,
        severity: "error",
        before: { robots: settings.seo.robots },
        after: { robots: "" },
      });
    }
  }

  // ۲) متای ناقص مقالات منتشرشده
  const { data: postRows } = await db
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, seo_title, seo_description, focus_keyword, canonical_url")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);
  const posts = postRows ?? [];

  const brokenPosts = posts
    .filter((p) => !p.seo_title || !p.seo_description || !p.focus_keyword)
    .slice(0, 8);

  if (brokenPosts.length > 0 && created.length < MAX_NEW_PROPOSALS) {
    const payload = brokenPosts
      .map((p) => `- key: ${p.id}\n  عنوان: ${p.title}\n  خلاصه: ${(p.excerpt ?? "").slice(0, 300)}`)
      .join("\n");
    const suggestion = await aiJson<{
      items: { key: string; seoTitle: string; seoDescription: string; focusKeyword: string }[];
    }>(
      "شما متخصص سئوی فارسی هستید و فقط یک JSON معتبر برمی‌گردانید. درباره قیمت، تعرفه، تخفیف یا پلن چیزی ننویسید.",
      `برای هر مورد یک عنوان سئو (حداکثر ۶۰ کاراکتر، نام برند «${brand}» فقط در صورت جا داشتن)، ` +
        `یک توضیح متا (۱۲۰ تا ۱۵۵ کاراکتر) و یک کلمه کلیدی هدف فارسی بنویس.\n\n${payload}\n\n` +
        `خروجی دقیقاً: {"items":[{"key":"...","seoTitle":"...","seoDescription":"...","focusKeyword":"..."}]}`,
      { items: [] },
    );
    for (const s of suggestion.items ?? []) {
      const post = brokenPosts.find((p) => p.id === s.key);
      if (!post) continue;
      await push({
        kind: "متای مقاله",
        action: "post_meta",
        target: `/blog/${post.slug}`,
        title: `تکمیل متای سئوی مقاله «${post.title}»`,
        detail: "عنوان سئو، توضیح متا و کلمه کلیدی هدف پیشنهاد شده است.",
        severity: "warning",
        before: {
          seo_title: post.seo_title ?? "",
          seo_description: post.seo_description ?? "",
          focus_keyword: post.focus_keyword ?? "",
        },
        after: {
          postId: post.id,
          seo_title: post.seo_title || s.seoTitle || post.title,
          seo_description: post.seo_description || s.seoDescription || "",
          focus_keyword: post.focus_keyword || s.focusKeyword || "",
          canonical_url: post.canonical_url || `${site}/blog/${post.slug}`,
        },
      });
    }
  }

  // ۳) صفحات ثابت با سئوی ناقص
  const STATIC_PAGES: { path: string; label: string }[] = [
    { path: "/", label: "صفحه اصلی" },
    { path: "/products", label: "محصولات" },
    { path: "/solutions", label: "راه‌کارها" },
    { path: "/about", label: "درباره ما" },
    { path: "/pricing", label: "تعرفه‌ها" },
    { path: "/contact", label: "تماس با ما" },
    { path: "/blog", label: "وبلاگ" },
  ];
  const { data: seoRows } = await db.from("seo_pages").select("*");
  const byPath = new Map((seoRows ?? []).map((r) => [r.path, r]));
  const missingPages = STATIC_PAGES.filter((sp) => {
    const row = byPath.get(sp.path);
    return !row || !row.title || !row.description || !row.schema_json;
  });

  if (missingPages.length > 0 && created.length < MAX_NEW_PROPOSALS) {
    const payload = missingPages
      .map((sp) => `- key: ${sp.path}\n  عنوان: ${sp.label} — ${brand}\n  خلاصه: ${settings.brand.tagline}`)
      .join("\n");
    const suggestion = await aiJson<{
      items: { key: string; seoTitle: string; seoDescription: string }[];
    }>(
      "شما متخصص سئوی فارسی هستید و فقط یک JSON معتبر برمی‌گردانید. درباره قیمت، تعرفه، تخفیف یا پلن چیزی ننویسید.",
      `برای هر صفحه یک عنوان سئو (حداکثر ۶۰ کاراکتر) و یک توضیح متا (۱۲۰ تا ۱۵۵ کاراکتر) فارسی بنویس.\n\n${payload}\n\n` +
        `خروجی دقیقاً: {"items":[{"key":"...","seoTitle":"...","seoDescription":"..."}]}`,
      { items: [] },
    );
    for (const sp of missingPages) {
      const s = (suggestion.items ?? []).find((i) => i.key === sp.path);
      if (!s) continue;
      const row = byPath.get(sp.path);
      const title = row?.title || s.seoTitle || `${sp.label} | ${brand}`;
      const description = row?.description || s.seoDescription || settings.seo.metaDescription;
      await push({
        kind: "متای صفحه",
        action: "page_meta",
        target: sp.path,
        title: `تکمیل سئوی صفحه «${sp.label}»`,
        detail: "عنوان، توضیح متا، آدرس کنونیکال و داده ساختاریافته پیشنهاد شده است.",
        severity: "warning",
        before: { title: row?.title ?? "", description: row?.description ?? "" },
        after: {
          id: row?.id ?? "",
          page_key: row?.page_key || sp.path.replace(/\//g, "") || "home",
          path: sp.path,
          title,
          description,
          og_image: row?.og_image || settings.seo.ogImage,
          canonical_url: row?.canonical_url || `${site}${sp.path}`,
          robots: row?.robots || "index,follow",
          schema_json:
            row?.schema_json ||
            JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: title,
              description,
              url: `${site}${sp.path}`,
            }),
        },
      });
    }
  }

  // ۴) بهبود متن مقالات ضعیف (کوتاه یا پربازدید با کلیک کم)
  if (created.length < MAX_NEW_PROPOSALS) {
    const weakBySlug = new Map<string, { impressions: number; clicks: number; position: number }>();
    for (const p of report.topPages) {
      const slug = p.page.split("/blog/")[1]?.replace(/\/$/, "");
      if (slug) weakBySlug.set(slug, p);
    }
    const candidates = posts
      .map((p) => {
        const stat = weakBySlug.get(p.slug);
        const len = (p.content ?? "").length;
        const lowCtr = !!stat && stat.impressions >= 50 && stat.clicks / Math.max(stat.impressions, 1) < 0.01;
        const thin = len < 1800;
        return { post: p, stat, thin, lowCtr, len };
      })
      .filter((c) => c.thin || c.lowCtr)
      .sort((a, b) => (b.stat?.impressions ?? 0) - (a.stat?.impressions ?? 0))
      .slice(0, MAX_CONTENT_REWRITES);

    for (const c of candidates) {
      if (created.length >= MAX_NEW_PROPOSALS) break;
      const reason = c.lowCtr
        ? `این مقاله در گوگل ${c.stat?.impressions} بار نمایش داده شده ولی کلیک بسیار کمی گرفته است.`
        : `متن این مقاله کوتاه است (${c.len} کاراکتر) و برای گوگل کم‌عمق حساب می‌شود.`;
      const improved = await aiJson<{ excerpt: string; content: string }>(
        `شما نویسنده و متخصص سئوی فارسی برند «${brand}» هستید و فقط یک JSON معتبر برمی‌گردانید. ` +
          "هرگز درباره قیمت، تعرفه، تخفیف یا پلن‌ها چیزی ننویسید.",
        `متن مقاله زیر را کامل‌تر، کاربردی‌تر و سئوشده بازنویسی کن: تیترهای H2/H3 منظم، مقدمه کوتاه، ` +
          `بخش پرسش‌های متداول و جمع‌بندی داشته باشد و حداقل ۷۰۰ کلمه باشد. لحن فارسی روان و حرفه‌ای.\n\n` +
          `عنوان: ${c.post.title}\nکلمه کلیدی: ${c.post.focus_keyword ?? ""}\n\nمتن فعلی:\n${(c.post.content ?? "").slice(0, 6000)}\n\n` +
          `خروجی دقیقاً: {"excerpt":"خلاصه یک تا دو جمله‌ای","content":"متن کامل با فرمت markdown"}`,
        { excerpt: "", content: "" },
      );
      if (!improved.content || improved.content.length < 800) continue;
      await push({
        kind: "بهبود محتوا",
        action: "post_content",
        target: `/blog/${c.post.slug}`,
        title: `بازنویسی و تکمیل متن مقاله «${c.post.title}»`,
        detail: reason,
        severity: "info",
        before: { excerpt: c.post.excerpt ?? "", content: (c.post.content ?? "").slice(0, 20_000) },
        after: {
          postId: c.post.id,
          excerpt: improved.excerpt || c.post.excerpt || "",
          content: improved.content,
        },
      });
    }
  }

  const pending = await listProposals("pending");
  return {
    runAt: report.runAt,
    connected: report.connected,
    error: report.error,
    auditSummary: report.summary,
    created,
    pendingCount: pending.length,
  };
}

/** اعمال یک پیشنهاد تأییدشده روی سایت */
export async function applyProposal(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data } = await db.from("seo_proposals").select("*").eq("id", id).maybeSingle();
  if (!data) return { ok: false, error: "پیشنهاد پیدا نشد" };
  const row = data as ProposalRow;
  if (row.status === "applied") return { ok: true };

  let after: Record<string, unknown> = {};
  try {
    after = JSON.parse(row.after_json ?? "{}") as Record<string, unknown>;
  } catch {
    after = {};
  }

  try {
    switch (row.action) {
      case "sitemap_submit": {
        const { submitSitemap } = await import("./gsc.server");
        await submitSitemap(String(after["property"] ?? ""), String(after["sitemapUrl"] ?? ""));
        break;
      }
      case "robots_clear": {
        const { loadSettings, saveSettings } = await import("./settings.server");
        const settings = await loadSettings();
        settings.seo.robots = String(after["robots"] ?? "");
        await saveSettings(settings);
        break;
      }
      case "post_meta": {
        await db
          .from("blog_posts")
          .update({
            seo_title: String(after["seo_title"] ?? ""),
            seo_description: String(after["seo_description"] ?? ""),
            focus_keyword: String(after["focus_keyword"] ?? ""),
            canonical_url: String(after["canonical_url"] ?? ""),
            updated_at: nowIso(),
          })
          .eq("id", String(after["postId"] ?? ""));
        break;
      }
      case "post_content": {
        await db
          .from("blog_posts")
          .update({
            excerpt: String(after["excerpt"] ?? ""),
            content: String(after["content"] ?? ""),
            updated_at: nowIso(),
          })
          .eq("id", String(after["postId"] ?? ""));
        break;
      }
      case "page_meta": {
        const payload = {
          page_key: String(after["page_key"] ?? ""),
          path: String(after["path"] ?? ""),
          title: String(after["title"] ?? ""),
          description: String(after["description"] ?? ""),
          og_image: String(after["og_image"] ?? ""),
          canonical_url: String(after["canonical_url"] ?? ""),
          robots: String(after["robots"] ?? "index,follow"),
          schema_json: String(after["schema_json"] ?? ""),
          updated_at: nowIso(),
        };
        const existingId = String(after["id"] ?? "");
        if (existingId) await db.from("seo_pages").update(payload).eq("id", existingId);
        else await db.from("seo_pages").insert({ id: newId(), ...payload });
        break;
      }
      default:
        return { ok: false, error: "نوع پیشنهاد پشتیبانی نمی‌شود" };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db
      .from("seo_proposals")
      .update({ status: "failed", error: message.slice(0, 1000), decided_at: nowIso() })
      .eq("id", id);
    return { ok: false, error: message };
  }

  await db
    .from("seo_proposals")
    .update({ status: "applied", error: "", decided_at: nowIso(), applied_at: nowIso() })
    .eq("id", id);
  return { ok: true };
}

/** تصمیم مدیر: تأیید (و اعمال فوری) یا رد */
export async function decideProposal(
  id: string,
  approve: boolean,
): Promise<{ ok: boolean; error?: string; status: ProposalStatus }> {
  if (!approve) {
    await db
      .from("seo_proposals")
      .update({ status: "rejected", decided_at: nowIso() })
      .eq("id", id);
    return { ok: true, status: "rejected" };
  }
  const result = await applyProposal(id);
  return { ok: result.ok, error: result.error, status: result.ok ? "applied" : "failed" };
}

/** حذف پیشنهادهای قدیمیِ تصمیم‌گرفته‌شده (بیش از ۶۰ روز) */
export async function pruneProposals(): Promise<void> {
  const cutoff = new Date(Date.now() - 60 * 86_400_000).toISOString();
  await db
    .from("seo_proposals")
    .delete()
    .in("status", ["applied", "rejected", "failed"])
    .lt("created_at", cutoff);
}

/** متن گزارش پیشنهادها برای تلگرام */
export function formatReviewForTelegram(result: ReviewResult): string {
  const lines = ["🧠 بررسی روزانه سئو و محتوا", ""];
  if (!result.connected) lines.push(`⚠️ سرچ کنسول وصل نشد: ${result.error ?? "نامشخص"}`);
  lines.push(`🛠 ${result.auditSummary}`);
  if (result.created.length === 0) {
    lines.push("✅ پیشنهاد جدیدی برای امروز نیست.");
  } else {
    lines.push(`📝 ${result.created.length} پیشنهاد جدید (نیازمند تأیید شما):`);
    for (const p of result.created) lines.push(`• [${p.kind}] ${p.title}`);
  }
  lines.push("");
  lines.push(`⏳ در انتظار تأیید: ${result.pendingCount} مورد`);
  return lines.join("\n");
}
