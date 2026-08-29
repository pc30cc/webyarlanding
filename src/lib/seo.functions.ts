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

export const listSeoPages = createServerFn({ method: "GET" }).handler(async (): Promise<SeoPageDto[]> => {
  const { requireAdmin } = await import("./auth.server");
  const { db } = await import("./db.server");
  await requireAdmin();
  const { data } = await db.from("seo_pages").select("*").order("updated_at", { ascending: false });
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
});

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
      const { data: row } = await db.from("seo_pages").select("*").eq("path", data.path).maybeSingle();
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

export const checkSeoHealth = createServerFn({ method: "GET" }).handler(async (): Promise<SeoHealthIssueDto[]> => {
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
    if (missing.length > 0) issues.push({ postId: row.id, title: row.title, slug: row.slug, missing });
  }
  return issues;
});
