// اجرای هسته‌ی تولید خودکار مقالات — فقط سمت سرور.
import { db, newId, nowIso, parseCsv, toBool, toCsv } from "./db.server";

export interface AutoblogSettingsDto {
  id: string;
  enabled: boolean;
  postsPerDay: number;
  runHours: number[];
  withImage: boolean;
  masterPrompt: string;
  topicPool: string[];
  categoryId: string | null;
  author: string;
  publishStatus: "published" | "draft";
  lastRunAt: string | null;
  totalGenerated: number;
}

type AutoblogSettingsRow = {
  id: string;
  enabled: number;
  posts_per_day: number;
  run_hours: string;
  with_image: number;
  master_prompt: string | null;
  topic_pool: string | null;
  category_id: string | null;
  author: string | null;
  publish_status: string;
  last_run_at?: string | null;
  total_generated?: number;
};

type AutoblogRunRow = {
  id: string;
  trigger_source: string;
  status: string;
  posts_requested: number;
  posts_created: number;
  post_ids: string;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

function mapSettings(row: AutoblogSettingsRow): AutoblogSettingsDto {
  const hours = parseCsv(row.run_hours)
    .map((h: string) => Number(h))
    .filter((h: number) => Number.isFinite(h) && h >= 0 && h <= 23);
  return {
    id: row.id,
    enabled: toBool(row.enabled),
    postsPerDay: row.posts_per_day ?? hours.length ?? 1,
    runHours: hours.length ? hours : [3],
    withImage: toBool(row.with_image),
    masterPrompt: row.master_prompt ?? "",
    topicPool: parseCsv(row.topic_pool),
    categoryId: row.category_id ?? null,
    author: row.author ?? "",
    publishStatus: row.publish_status === "draft" ? "draft" : "published",
    lastRunAt: row.last_run_at ?? null,
    totalGenerated: row.total_generated ?? 0,
  };
}

export async function getSettings(): Promise<AutoblogSettingsDto> {
  const { data } = await db.from("autoblog_settings").select("*").limit(1).maybeSingle();
  if (data) return mapSettings(data);
  const id = newId();
  const row = {
    id,
    enabled: 0,
    posts_per_day: 1,
    run_hours: "3",
    with_image: 1,
    master_prompt: "",
    topic_pool: "",
    category_id: null,
    author: "",
    publish_status: "published",
    updated_at: nowIso(),
  };
  await db.from("autoblog_settings").insert(row);
  return mapSettings(row);
}

export interface SaveAutoblogSettingsInput {
  enabled: boolean;
  runHours: number[];
  withImage: boolean;
  masterPrompt: string;
  topicPool: string[];
  categoryId: string | null;
  author: string;
  publishStatus: "published" | "draft";
}

export async function saveSettings(input: SaveAutoblogSettingsInput): Promise<AutoblogSettingsDto> {
  const current = await getSettings();
  const hours = Array.from(
    new Set(input.runHours.filter((h) => Number.isFinite(h) && h >= 0 && h <= 23)),
  ).sort((a, b) => a - b);
  const payload = {
    enabled: input.enabled ? 1 : 0,
    posts_per_day: hours.length || 1,
    run_hours: hours.length ? hours.join(",") : "3",
    with_image: input.withImage ? 1 : 0,
    master_prompt: input.masterPrompt ?? "",
    topic_pool: toCsv(input.topicPool),
    category_id: input.categoryId || null,
    author: input.author ?? "",
    publish_status: input.publishStatus,
    updated_at: nowIso(),
  };
  await db.from("autoblog_settings").update(payload).eq("id", current.id);
  return await getSettings();
}

export interface AutoblogRunDto {
  id: string;
  triggerSource: string;
  status: string;
  postsRequested: number;
  postsCreated: number;
  postIds: string[];
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export async function listRuns(limit = 30): Promise<AutoblogRunDto[]> {
  const { data } = await db
    .from("autoblog_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row: AutoblogRunRow) => ({
    id: row.id,
    triggerSource: row.trigger_source,
    status: row.status,
    postsRequested: row.posts_requested,
    postsCreated: row.posts_created,
    postIds: parseCsv(row.post_ids),
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  }));
}

const DEFAULT_MASTER_PROMPT =
  "شما یک نویسنده‌ی ارشد سئوی فارسی‌زبان هستید. مقاله‌ای اورجینال، ساختاریافته با تیترهای H2/H3، خلاصه TL;DR در ابتدا، بخش پرسش‌های متداول (FAQ) و یک جمع‌بندی با فراخوان به اقدام (CTA) در انتها بنویس.";

function pickTopic(pool: string[], seed: number): string {
  const defaults = [
    "سئو و بهینه‌سازی موتور جستجو",
    "تکنولوژی و فناوری‌های روز",
    "هوش مصنوعی و یادگیری ماشین",
    "کسب‌وکارهای اینترنتی و دیجیتال مارکتینگ",
  ];
  const list = pool.length ? pool : defaults;
  return list[seed % list.length]!;
}

export async function runAutoblog(
  triggerSource: "manual" | "cron",
  options?: { ignoreHourCheck?: boolean },
) {
  const settings = await getSettings();

  if (!settings.enabled && triggerSource === "cron") {
    return { ok: true, skipped: true, reason: "disabled" as const };
  }

  if (triggerSource === "cron" && !options?.ignoreHourCheck) {
    const currentUtcHour = new Date().getUTCHours();
    if (!settings.runHours.includes(currentUtcHour)) {
      return { ok: true, skipped: true, reason: "not_scheduled_hour" as const };
    }
  }

  const runId = newId();
  await db.from("autoblog_runs").insert({
    id: runId,
    trigger_source: triggerSource,
    status: "running",
    posts_requested: 1,
    posts_created: 0,
    post_ids: "",
  });

  try {
    const { generatePostContent } = await import("./ai.server");
    const { savePost } = await import("./blog.server");

    const topic = pickTopic(settings.topicPool, settings.totalGenerated);
    const generated = await generatePostContent({
      topic: `${settings.masterPrompt || DEFAULT_MASTER_PROMPT}\n\nموضوع این مقاله: ${topic}`,
      length: "medium",
    });

    let coverImage = "";
    let imageError: string | undefined;
    if (settings.withImage) {
      try {
        const { generateImage } = await import("./ai.server");
        const image = await generateImage({
          prompt: `عکس کاور حرفه‌ای و مرتبط با موضوع: ${generated.title}`,
          alt: generated.title,
        });
        coverImage = image.url;
      } catch (e) {
        // اگر تولید عکس شکست خورد، مقاله بدون عکس ذخیره می‌شود — اما دلیل شکست را هم لاگ و هم روی
        // خود اجرا ثبت می‌کنیم تا در تاریخچه اجراهای پنل ادمین قابل دیدن باشد، نه فقط در لاگ سرور.
        imageError = e instanceof Error ? e.message : "خطای ناشناخته در تولید تصویر";
        console.error("autoblog: cover image generation failed:", e);
      }
    }

    const postId = await savePost({
      title: generated.title,
      excerpt: generated.excerpt,
      content: generated.content,
      coverImage,
      tags: generated.tags,
      status: settings.publishStatus,
      categoryId: settings.categoryId,
      author: settings.author || "تیم تحریریه",
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
      focusKeyword: generated.focusKeyword,
    });

    await db
      .from("autoblog_runs")
      .update({
        status: "success",
        posts_created: 1,
        post_ids: postId,
        error: imageError ? `مقاله ذخیره شد اما تصویر کاور ساخته نشد: ${imageError}` : null,
        finished_at: nowIso(),
      })
      .eq("id", runId);

    await db
      .from("autoblog_settings")
      .update({
        last_run_at: nowIso(),
        total_generated: settings.totalGenerated + 1,
        updated_at: nowIso(),
      })
      .eq("id", settings.id);

    return { ok: true, skipped: false, postId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db
      .from("autoblog_runs")
      .update({
        status: "failed",
        error: message.slice(0, 2000),
        finished_at: nowIso(),
      })
      .eq("id", runId);
    return { ok: false, error: message };
  }
}
