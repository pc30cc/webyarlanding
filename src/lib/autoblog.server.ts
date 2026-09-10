// اجرای هسته‌ی تولید خودکار مقالات — فقط سمت سرور.
import { db, newId, nowIso, parseCsv, toBool, toCsv } from "./db.server";
import { FEATURE_LABELS_FA } from "./plans";


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
  "شما یک نویسنده‌ی ارشد سئوی فارسی‌زبان هستید. مقاله‌ای اورجینال، ساختاریافته با تیترهای H2/H3، چکیده‌ی مطلب در ابتدا، بخش پرسش‌های متداول (سوالات متداول) و یک جمع‌بندی با فراخوان به اقدام در انتها بنویس. موضوع مقاله باید همیشه به امکانات و کاربردهای پلتفرم (چت آنلاین، تماس صوتی/تصویری، مرکز تماس، هوش مصنوعی، اتوماسیون، پایگاه دانش، سئو، آنالیز و رهگیری بازدیدکننده، ارتباط چندکاناله، افزونه‌ها و یکپارچه‌سازی‌ها) مرتبط باشد؛ از موضوعات کاملاً نامرتبط پرهیز کن.";

/** قانون ثابت: مقالات نباید هیچ اشاره‌ای به قیمت، پلن یا هزینه داشته باشند */
const NO_PRICING_RULE =
  "\n\nقوانین محتوایی الزامی:\n- به هیچ وجه درباره قیمت، تعرفه، هزینه، تخفیف، پلن‌ها، اشتراک، نام پلن‌ها (رایگان/حرفه‌ای/سازمانی)، سقف‌ها و محدودیت‌های پلن‌ها یا مقایسه‌ی پلن‌ها چیزی ننویس و هیچ عددی به‌عنوان قیمت نیاور.\n- تمرکز مقاله فقط روی خودِ قابلیت، کاربرد عملی، مزایا، نحوه‌ی استفاده و بهترین‌روش‌ها باشد.\n- محتوا آموزشی و کاربردی باشد، نه تبلیغ فروش.";

/** زاویه‌های نگارش برای تنوع مقالات هم‌موضوع */
const TOPIC_ANGLES = [
  "راهنمای عملی و گام‌به‌گام",
  "کاربردها و سناریوهای واقعی کسب‌وکار",
  "بهترین روش‌ها و اشتباهات رایج",
  "تأثیر بر تجربه مشتری و نرخ تبدیل",
  "نحوه راه‌اندازی و تنظیمات حرفه‌ای",
  "چک‌لیست بهینه‌سازی و اندازه‌گیری نتیجه",
];

/** موضوعات ساخته‌شده از فهرست امکانات واقعی پلتفرم (همان کلیدهای صفحه قیمت‌گذاری، بدون اشاره به قیمت) */
function featureTopics(): string[] {
  const labels = Object.values(FEATURE_LABELS_FA);
  const extras = [
    "سئوی فنی و بهینه‌سازی سرعت وب‌سایت",
    "آنالیز رفتار کاربران و تحلیل مسیر بازدیدکننده",
    "افزونه‌ها و یکپارچه‌سازی ابزارک‌ها در وب‌سایت",
    "ابزارک چت و افزونه مرکز تماس روی سایت",
    "اتصال API و خودکارسازی جریان کاری پشتیبانی",
    "پایگاه دانش و مرکز راهنمای خودیار",
    "امنیت داده و اعتماد کاربر در ارتباط آنلاین",
    "گزارش‌های تحلیلی و شاخص‌های کلیدی پشتیبانی",
  ];
  return [...labels, ...extras];
}

function pickTopic(pool: string[], seed: number): string {
  const list = pool.length ? pool : featureTopics();
  const base = list[seed % list.length]!;
  const angle = TOPIC_ANGLES[Math.floor(seed / Math.max(1, list.length)) % TOPIC_ANGLES.length]!;
  return `${base} — ${angle}`;
}


/** عنوان مقالات قبلی — برای اینکه از تکرار موضوع/عنوان مشابه در تولید خودکار جلوگیری شود */
async function recentPostTitles(limit = 80): Promise<string[]> {
  const { data } = await db
    .from("blog_posts")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => row.title).filter(Boolean);
}

/** یکسان‌سازی متن فارسی برای مقایسه عنوان‌ها */
function normalizeTitle(title: string): string {
  return title
    .replace(/[\u064B-\u0652\u200c]/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const STOP_WORDS = new Set([
  "و","در","به","از","با","برای","که","این","آن","را","یک","تا","بر","هم","چه","چگونه","چرا","راهنمای","کامل","بهترین","معرفی","نکات","روش","روشهای","های","ها",
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** آیا عنوان تازه با یکی از عنوان‌های قبلی تکراری یا خیلی نزدیک است؟ */
function isDuplicateTitle(candidate: string, existing: string[]): boolean {
  const norm = normalizeTitle(candidate);
  if (!norm) return true;
  const tokens = titleTokens(candidate);
  for (const old of existing) {
    const oldNorm = normalizeTitle(old);
    if (!oldNorm) continue;
    if (oldNorm === norm || oldNorm.includes(norm) || norm.includes(oldNorm)) return true;
    const oldTokens = titleTokens(old);
    if (!tokens.size || !oldTokens.size) continue;
    let shared = 0;
    for (const t of tokens) if (oldTokens.has(t)) shared++;
    const similarity = shared / Math.min(tokens.size, oldTokens.size);
    if (similarity >= 0.7) return true;
  }
  return false;
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

    const recentTitles = await recentPostTitles();
    const avoidRepeatHint = recentTitles.length
      ? `\n\nعناوین همه مقالات قبلی سایت (به هیچ وجه عنوانی تکراری یا هم‌معنی با این‌ها نساز و موضوع/زاویه‌ی کاملاً تازه‌ای انتخاب کن):\n- ${recentTitles.join("\n- ")}`
      : "";

    // تا سه بار تلاش می‌کنیم؛ اگر عنوان تولیدشده با مقالات قبلی تکراری یا خیلی نزدیک بود،
    // با تأکید بیشتر دوباره تولید می‌شود.
    let generated: Awaited<ReturnType<typeof generatePostContent>> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const topic = pickTopic(settings.topicPool, settings.totalGenerated + attempt);
      const retryHint =
        attempt === 0
          ? ""
          : `\n\nتلاش قبلی عنوانی تکراری تولید کرد. این بار حتماً موضوع و عنوانی کاملاً متفاوت، تازه و بدون هم‌پوشانی با فهرست بالا بنویس.`;
      const candidate = await generatePostContent({
        topic: `${settings.masterPrompt || DEFAULT_MASTER_PROMPT}${NO_PRICING_RULE}\n\nموضوع این مقاله: ${topic}${avoidRepeatHint}${retryHint}`,
        length: "medium",
      });
      generated = candidate;
      if (!isDuplicateTitle(candidate.title, recentTitles)) break;
    }
    if (!generated) throw new Error("تولید مقاله ناموفق بود");
    if (isDuplicateTitle(generated.title, recentTitles)) {
      throw new Error("مقاله‌ای با عنوان مشابه قبلاً منتشر شده است؛ تولید این نوبت لغو شد.");
    }

    let coverImage = "";
    let imageError: string | undefined;
    if (settings.withImage) {
      try {
        const { generateImage, buildCoverImagePrompt } = await import("./ai.server");
        const image = await generateImage({
          prompt: buildCoverImagePrompt(
            generated.title,
            settings.totalGenerated + Math.floor(Math.random() * 3),
          ),
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
