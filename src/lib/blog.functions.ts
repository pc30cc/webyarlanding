import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface PostDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: string;
  author: string;
  tags: string[];
  categoryId: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  indexable: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  robots: string;
  focusKeyword: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  postCount?: number;
}

export interface TagDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  postCount?: number;
}

const postInputSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1, "عنوان الزامی است"),
  excerpt: z.string().optional().default(""),
  content: z.string().optional().default(""),
  coverImage: z.string().optional().default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  author: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  categoryId: z.string().nullable().optional(),
  indexable: z.boolean().optional().default(true),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  robots: z.string().optional().default("index,follow"),
  focusKeyword: z.string().optional().default(""),
});

export type PostInput = z.infer<typeof postInputSchema>;

/** فهرست مقالات منتشرشده (عمومی) */
export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number; categorySlug?: string; tagSlug?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<PostDto[]> => {
    const { listPosts } = await import("./blog.server");
    return await listPosts({ ...data, status: "published" });
  });

/** یک مقاله منتشرشده با اسلاگ */
export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }): Promise<PostDto | null> => {
    const { getPostBySlug } = await import("./blog.server");
    const post = await getPostBySlug(data.slug);
    if (!post || post.status !== "published") return null;
    return post;
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async (): Promise<CategoryDto[]> => {
  const { fetchCategories } = await import("./blog.server");
  return await fetchCategories();
});

export const listTags = createServerFn({ method: "GET" }).handler(async (): Promise<TagDto[]> => {
  const { fetchTags } = await import("./blog.server");
  return await fetchTags();
});

/* ───────────── مدیریت (نیازمند ورود مدیر) ───────────── */

export const adminListPosts = createServerFn({ method: "GET" })
  .inputValidator((input: { status?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<PostDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { listPosts } = await import("./blog.server");
    await requireAdmin();
    return await listPosts({ ...data, limit: 500 });
  });

export const adminGetPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<PostDto | null> => {
    const { requireAdmin } = await import("./auth.server");
    const { getPostById } = await import("./blog.server");
    await requireAdmin();
    return await getPostById(data.id);
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { savePost } = await import("./blog.server");
    await requireAdmin();
    const id = await savePost(data);
    return { ok: true, id };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { deletePost } = await import("./blog.server");
    await requireAdmin();
    await deletePost(data.id);
    return { ok: true };
  });

const categorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().min(1, "نام دسته الزامی است"),
  description: z.string().optional().default(""),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional().default(0),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
});

export const adminSaveCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categorySchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { saveCategory } = await import("./blog.server");
    await requireAdmin();
    const id = await saveCategory(data);
    return { ok: true, id };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { deleteCategory } = await import("./blog.server");
    await requireAdmin();
    await deleteCategory(data.id);
    return { ok: true };
  });

const tagSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().min(1, "نام برچسب الزامی است"),
  description: z.string().optional().default(""),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
});

export const adminSaveTag = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tagSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { saveTag } = await import("./blog.server");
    await requireAdmin();
    const id = await saveTag(data);
    return { ok: true, id };
  });

export const adminDeleteTag = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { deleteTag } = await import("./blog.server");
    await requireAdmin();
    await deleteTag(data.id);
    return { ok: true };
  });
