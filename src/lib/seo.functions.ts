import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    return (data ?? []).map((row) => ({
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
    }));
  },
);

const seoPageSchema = z.object({
  id: z.string().optional(),
  pageKey: z.string().min(1, "کلید صفحه الزامی است"),
  path: z.string().min(1, "مسیر الزامی است"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  robots: z.string().optional().default("index,follow"),
  schemaJson: z.string().optional().default(""),
});

export const saveSeoPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seoPageSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, newId, nowIso } = await import("./db.server");
    await requireAdmin();
    const id = data.id ?? newId();
    const row = {
      page_key: data.pageKey,
      path: data.path,
      title: data.title,
      description: data.description,
      og_image: data.ogImage,
      canonical_url: data.canonicalUrl,
      robots: data.robots,
      schema_json: data.schemaJson,
      updated_at: nowIso(),
    };
    if (data.id) await db.from("seo_pages").update(row).eq("id", data.id);
    else await db.from("seo_pages").insert({ id, ...row });
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

/** خواندن عمومی (بدون نیاز به ورود مدیر) تنظیمات سئوی یک صفحه، برای رندر متا/کنونیکال/JSON-LD */
export const getPublicSeoPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data }): Promise<SeoPageDto | null> => {
    try {
      const { db } = await import("./db.server");
      const { data: row } = await db
        .from("seo_pages")
        .select("*")
        .eq("path", data.path)
        .maybeSingle();
      if (!row) return null;
      return {
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
