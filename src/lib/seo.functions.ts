import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LOCALES, isLocale, type Locale } from "./locales";
import { seoPageCanonicals, selectSeoPageRow, type SeoCanonicals } from "./seo-meta";
import { getDefaultLocale, resolvePageLocale } from "./settings";

export interface SeoPageDto {
  id: string;
  pageKey: string;
  path: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  robots: string;
  schemaJson: string | null;
  createdAt: string;
  updatedAt: string;
  /** زبان ردیف؛ نبودنش یعنی زبان پیش‌فرض سایت (همه ردیف‌های قدیمی) */
  locale?: Locale;
  /**
   * فقط در getPublicSeoPage و وقتی این مسیر ردیف زبان‌دار هم دارد: canonical سفارشی هر نسخه
   * زبان برای hreflang (حتی وقتی ردیف برگشتی متعلق به زبان دیگری است و اعمال نمی‌شود)
   */
  alternateCanonicals?: SeoCanonicals;
}

interface SeoPageRow {
  id: string;
  page_key: string;
  path: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  robots: string;
  schema_json: string | null;
  created_at: string;
  updated_at: string;
  /** ستون locale؛ پیش از اجرای مایگریشن وجود ندارد */
  locale?: string | null;
}

/** پسوند کلید صفحه برای ردیف یک زبان؛ page_key یکتاست و هر زبان ردیف خودش را دارد. */
const LOCALE_KEY_SUFFIX = new RegExp(`@(?:${LOCALES.join("|")})$`);

/** کلید صفحه بدون پسوند زبان (برای نمایش و ویرایش در پنل) */
export function seoBasePageKey(pageKey: string): string {
  return pageKey.replace(LOCALE_KEY_SUFFIX, "");
}

/** کلید ذخیره‌شده: زبان پیش‌فرض بدون پسوند، بقیه «<کلید>@<زبان>» */
export function seoStoredPageKey(pageKey: string, locale: Locale | null): string {
  const base = seoBasePageKey(pageKey.trim());
  return locale ? `${base}@${locale}` : base;
}

/** ردیف با مقدار نامعتبر در ستون locale به هیچ زبانی تعلق ندارد و نادیده گرفته می‌شود. */
function hasKnownLocale(row: SeoPageRow): boolean {
  return row.locale == null || row.locale === "" || isLocale(row.locale);
}

function toDto(row: SeoPageRow): SeoPageDto {
  const dto: SeoPageDto = {
    id: row.id,
    pageKey: row.page_key,
    path: row.path,
    title: row.title,
    description: row.description,
    ogImage: row.og_image,
    canonicalUrl: row.canonical_url,
    robots: row.robots,
    schemaJson: row.schema_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  // ردیف زبان پیش‌فرض بدون فیلد locale می‌ماند تا خروجی صفحات زبان پیش‌فرض مثل قبل باشد
  if (isLocale(row.locale)) dto.locale = row.locale;
  return dto;
}

export const listSeoPages = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeoPageDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data } = await db
      .from("seo_pages")
      .select("*")
      .order("updated_at", { ascending: false });
    return ((data ?? []) as SeoPageRow[]).filter(hasKnownLocale).map(toDto);
  },
);

const seoPageSchema = z.object({
  id: z.string().optional(),
  pageKey: z.string().trim().min(1, "کلید صفحه الزامی است").max(110, "کلید صفحه طولانی است"),
  path: z.string().trim().min(1, "مسیر الزامی است").max(255, "مسیر طولانی است"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  robots: z.string().optional().default("index,follow"),
  schemaJson: z.string().optional().default(""),
  /** زبان ردیف؛ خالی یعنی زبان پیش‌فرض سایت (ردیف بدون زبان، مثل ردیف‌های قدیمی) */
  locale: z.enum(LOCALES as [Locale, ...Locale[]]).nullish(),
});

export const saveSeoPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = seoPageSchema.parse(input);
    // کلید ردیف زبان‌های دیگر با پسوند زبان ذخیره می‌شود (پنل کلید بدون پسوند را می‌فرستد)
    return { ...data, pageKey: seoBasePageKey(data.pageKey) };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, newId, nowIso } = await import("./db.server");
    await requireAdmin();
    const id = data.id ?? newId();
    let locale: Locale | null;
    if (data.id) {
      // ویرایش، زبان ردیف را تغییر نمی‌دهد
      const { data: current, error } = await db
        .from("seo_pages")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (error || !current) throw new Error("صفحه سئو پیدا نشد");
      locale = isLocale(current.locale) ? current.locale : null;
    } else {
      // زبان پیش‌فرض همیشه ردیف بدون زبان (NULL) دارد، مثل ردیف‌های قدیمی
      const { loadSettings } = await import("./settings.server");
      const requested = data.locale ?? null;
      locale = requested === getDefaultLocale(await loadSettings()) ? null : requested;
    }

    // برای هر مسیر و زبان فقط یک ردیف؛ چند ردیف مبهم است و در سایت اعمال نمی‌شود
    const { data: samePath, error: readError } = await db
      .from("seo_pages")
      .select("*")
      .eq("path", data.path);
    if (readError) throw new Error("خواندن صفحات سئو ممکن نشد");
    const duplicate = ((samePath ?? []) as SeoPageRow[])
      .filter(hasKnownLocale)
      .some((row) => row.id !== data.id && (isLocale(row.locale) ? row.locale : null) === locale);
    if (duplicate) throw new Error("برای این مسیر در این زبان قبلاً صفحه سئو ثبت شده است");

    const row = {
      page_key: seoStoredPageKey(data.pageKey, locale),
      path: data.path,
      title: data.title,
      description: data.description,
      og_image: data.ogImage,
      canonical_url: data.canonicalUrl,
      robots: data.robots,
      schema_json: data.schemaJson,
      updated_at: nowIso(),
    };
    // ستون locale فقط در ردیف جدید زبان‌های دیگر نوشته می‌شود؛ ردیف زبان پیش‌فرض NULL می‌ماند
    const { error } = data.id
      ? await db.from("seo_pages").update(row).eq("id", data.id)
      : await db.from("seo_pages").insert({ id, ...row, ...(locale ? { locale } : {}) });
    if (error) {
      console.error("saveSeoPage failed:", error);
      throw new Error(
        /duplicate|unique/i.test(error.message ?? "")
          ? "این کلید صفحه قبلاً استفاده شده است"
          : "ذخیره صفحه سئو ممکن نشد",
      );
    }
    return { ok: true, id };
  });

export const deleteSeoPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    await db.from("seo_pages").delete().eq("id", data.id);
    return { ok: true };
  });

/**
 * خواندن عمومی (بدون نیاز به ورود مدیر) تنظیمات سئوی یک صفحه، برای رندر متا/کنونیکال/JSON-LD.
 * `locale` زبان آدرس صفحه است (پیشوند /en و…؛ خالی = زبان پیش‌فرض). ردیف همان زبان برمی‌گردد،
 * وگرنه ردیف زبان پیش‌فرض (selectSeoPageRow)، وگرنه ردیف زبانی که canonical سفارشی دارد (برای
 * hreflang)؛ buildPageMeta هر ردیف را فقط روی زبان خودش اعمال می‌کند.
 * تنظیمات سایت فقط وقتی خوانده می‌شود که این مسیر ردیف زبان‌دار داشته باشد؛ سایت تک‌زبانه
 * مثل قبل با یک کوئری جواب می‌گیرد.
 */
export const getPublicSeoPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        path: z.string(),
        // زبان ناشناخته یا نامعتبر = زبان پیش‌فرض
        locale: z
          .unknown()
          .optional()
          .transform((value): Locale | null => (isLocale(value) ? value : null)),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SeoPageDto | null> => {
    try {
      const { db } = await import("./db.server");
      const { data: found } = await db.from("seo_pages").select("*").eq("path", data.path);
      const rows = ((found ?? []) as SeoPageRow[]).filter(hasKnownLocale).map(toDto);
      if (rows.length === 0) return null;
      if (!rows.some((row) => row.locale)) return selectSeoPageRow(rows, null, null);

      const { loadSettings } = await import("./settings.server");
      const settings = await loadSettings();
      const defaultLocale = getDefaultLocale(settings);
      const alternateCanonicals = seoPageCanonicals(rows, defaultLocale);
      const withLocale = Object.keys(alternateCanonicals) as Locale[];
      // نه این زبان ردیف دارد نه زبان پیش‌فرض، ولی زبان دیگری canonical سفارشی دارد: ردیف همان
      // زبان فقط برای hreflang برمی‌گردد تا این صفحه هم به canonical آن نسخه لینک دهد. چون زبانش
      // با زبان این صفحه فرق دارد، buildPageMeta و seoOverrideFor اعمالش نمی‌کنند.
      const row =
        selectSeoPageRow(rows, resolvePageLocale(settings, data.locale), defaultLocale) ??
        (withLocale[0] ? selectSeoPageRow(rows, withLocale[0], defaultLocale) : null);
      if (!row) return null;
      return withLocale.length > 0 ? { ...row, alternateCanonicals } : row;
    } catch (error) {
      // دیتابیس در دسترس نیست — صفحه عمومی باید با متای پیش‌فرض رندر شود، نه با خطا
      console.error("getPublicSeoPage failed:", error);
      return null;
    }
  });

export interface SeoHealthIssueDto {
  postId: string;
  title: string;
  slug: string;
  missing: string[];
}

export const checkSeoHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeoHealthIssueDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data } = await db
      .from("blog_posts")
      .select("id, title, slug, seo_title, seo_description, cover_image, focus_keyword")
      .eq("status", "published");

    const issues: SeoHealthIssueDto[] = [];
    for (const row of data ?? []) {
      const missing: string[] = [];
      if (!row.seo_title) missing.push("عنوان سئو");
      if (!row.seo_description) missing.push("توضیحات سئو");
      if (!row.cover_image) missing.push("تصویر شاخص");
      if (!row.focus_keyword) missing.push("کلمه کلیدی هدف");
      if (missing.length > 0)
        issues.push({ postId: row.id, title: row.title, slug: row.slug, missing });
    }
    return issues;
  },
);

export interface CatalogSeoHealthIssueDto {
  itemId: string;
  type: "product" | "solution";
  title: string;
  slug: string;
  missing: string[];
}

/** بررسی سلامت سئوی محصولات و راه‌کارهای منتشرشده (همان فیلدهایی که در متا و JSON-LD صفحه‌شان استفاده می‌شوند) */
export const checkCatalogSeoHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogSeoHealthIssueDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data } = await db
      .from("catalog_items")
      .select("id, type, title, slug, icon, short_desc, description")
      .eq("published", 1);

    const issues: CatalogSeoHealthIssueDto[] = [];
    for (const row of data ?? []) {
      const missing: string[] = [];
      if (!row.short_desc?.trim()) missing.push("توضیح کوتاه (متا)");
      if (!row.description || row.description.trim().length < 200) missing.push("محتوای کامل صفحه");
      if (!row.icon?.trim()) missing.push("آیکون");
      if (missing.length > 0) {
        issues.push({
          itemId: row.id,
          type: row.type === "solution" ? "solution" : "product",
          title: row.title,
          slug: row.slug,
          missing,
        });
      }
    }
    return issues;
  },
);

/** رفع خودکار یک مشکل سئوی گزارش‌شده با هوش مصنوعی — فیلدهای ناقص را می‌سازد و مقاله را ذخیره می‌کند */
export const adminFixSeoIssue = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ postId: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; fixed: string[] }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { getPostById, savePost } = await import("./blog.server");

    const post = await getPostById(data.postId);
    if (!post) throw new Error("مقاله پیدا نشد");

    const fixed: string[] = [];
    let seoTitle = post.seoTitle;
    let seoDescription = post.seoDescription;
    let focusKeyword = post.focusKeyword;
    let coverImage = post.coverImage;

    if (!seoTitle || !seoDescription || !focusKeyword) {
      const { generateSeoMeta } = await import("./ai.server");
      const meta = await generateSeoMeta({ title: post.title, content: post.content });
      if (!seoTitle) {
        seoTitle = meta.seoTitle;
        fixed.push("عنوان سئو");
      }
      if (!seoDescription) {
        seoDescription = meta.seoDescription;
        fixed.push("توضیحات سئو");
      }
      if (!focusKeyword) {
        focusKeyword = meta.focusKeyword;
        fixed.push("کلمه کلیدی هدف");
      }
    }

    if (!coverImage) {
      try {
        const { generateImage, buildCoverImagePrompt } = await import("./ai.server");
        const image = await generateImage({
          prompt: buildCoverImagePrompt(post.title),
          alt: post.title,
        });
        coverImage = image.url;
        fixed.push("تصویر شاخص");
      } catch (e) {
        // اگر ساخت تصویر شکست بخورد (مثلاً محل ذخیره‌سازی وصل نیست)، بقیه اصلاحات سئو
        // همچنان ذخیره می‌شود؛ خطای تصویر را جداگانه گزارش می‌کنیم.
        console.error("adminFixSeoIssue: cover image generation failed:", e);
      }
    }

    await savePost({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage,
      status: post.status,
      author: post.author,
      tags: post.tags,
      categoryId: post.categoryId,
      seoTitle,
      seoDescription,
      canonicalUrl: post.canonicalUrl,
      robots: post.robots,
      focusKeyword,
    });

    return { ok: true, fixed };
  });
