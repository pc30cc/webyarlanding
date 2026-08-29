import { db, newId, nowIso, parseCsv, slugify, toBool, toCsv } from "./db.server";
import type { CategoryDto, PostDto, TagDto } from "./blog.functions";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  status: string;
  author: string | null;
  tags_csv: string;
  category_id: string | null;
  indexable: number;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  robots: string;
  focus_keyword: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapPost(row: PostRow, category?: { name: string; slug: string } | null): PostDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    coverImage: row.cover_image ?? "",
    status: row.status,
    author: row.author ?? "",
    tags: parseCsv(row.tags_csv),
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    indexable: toBool(row.indexable),
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    canonicalUrl: row.canonical_url ?? "",
    robots: row.robots,
    focusKeyword: row.focus_keyword ?? "",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function categoryMap(): Promise<Map<string, { name: string; slug: string }>> {
  const { data } = await db.from("blog_categories").select("id, name, slug");
  const map = new Map<string, { name: string; slug: string }>();
  for (const row of data ?? []) map.set(row.id, { name: row.name, slug: row.slug });
  return map;
}

export async function listPosts(options: {
  status?: string | undefined;
  limit?: number | undefined;
  categorySlug?: string | undefined;
  tagSlug?: string | undefined;
  search?: string | undefined;
}): Promise<PostDto[]> {
  let categoryId: string | null | undefined;
  if (options.categorySlug) {
    const { data } = await db
      .from("blog_categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();
    categoryId = data?.id ?? "__none__";
  }

  let postIdFilter: string[] | undefined;
  if (options.tagSlug) {
    const { data: tag } = await db.from("blog_tags").select("id").eq("slug", options.tagSlug).maybeSingle();
    if (!tag) return [];
    const { data: links } = await db.from("blog_post_tags").select("post_id").eq("tag_id", tag.id);
    postIdFilter = (links ?? []).map((row) => row.post_id);
    if (postIdFilter.length === 0) return [];
  }

  let query = db.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (options.status) query = query.eq("status", options.status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (postIdFilter) query = query.in("id", postIdFilter);
  if (options.search) query = query.ilike("title", `%${options.search}%`);
  query = query.limit(options.limit ?? 100);

  const { data } = await query;
  const cats = await categoryMap();
  return (data ?? []).map((row) => mapPost(row as PostRow, row.category_id ? cats.get(row.category_id) : null));
}

export async function getPostBySlug(slug: string): Promise<PostDto | null> {
  const { data } = await db.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const cats = await categoryMap();
  return mapPost(data as PostRow, data.category_id ? cats.get(data.category_id) : null);
}

export async function getPostById(id: string): Promise<PostDto | null> {
  const { data } = await db.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const cats = await categoryMap();
  return mapPost(data as PostRow, data.category_id ? cats.get(data.category_id) : null);
}

async function uniqueSlug(table: "blog_posts" | "blog_categories" | "blog_tags", desired: string, ignoreId?: string | undefined) {
  let slug = desired;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === ignoreId) return slug;
    attempt += 1;
    slug = `${desired}-${attempt}`;
  }
}

export interface SavePostInput {
  id?: string | undefined;
  slug?: string | undefined;
  title: string;
  excerpt?: string | undefined;
  content?: string | undefined;
  coverImage?: string | undefined;
  status?: string | undefined;
  author?: string | undefined;
  tags?: string[] | undefined;
  categoryId?: string | null | undefined;
  indexable?: boolean | undefined;
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
  canonicalUrl?: string | undefined;
  robots?: string | undefined;
  focusKeyword?: string | undefined;
}

export async function savePost(input: SavePostInput): Promise<string> {
  const id = input.id ?? newId();
  const slug = await uniqueSlug("blog_posts", slugify(input.slug || input.title), input.id);
  const status = input.status ?? "draft";

  const row = {
    slug,
    title: input.title,
    excerpt: input.excerpt ?? "",
    content: input.content ?? "",
    cover_image: input.coverImage ?? "",
    status,
    author: input.author ?? "",
    tags_csv: toCsv(input.tags),
    category_id: input.categoryId || null,
    indexable: input.indexable === false ? 0 : 1,
    seo_title: input.seoTitle ?? "",
    seo_description: input.seoDescription ?? "",
    canonical_url: input.canonicalUrl ?? "",
    robots: input.robots || "index,follow",
    focus_keyword: input.focusKeyword ?? "",
    updated_at: nowIso(),
  };

  if (input.id) {
    await db.from("blog_posts").update(row).eq("id", input.id);
  } else {
    await db.from("blog_posts").insert({
      id,
      ...row,
      published_at: status === "published" ? nowIso() : null,
    });
  }

  if (input.id && status === "published") {
    const { data } = await db.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    if (!data?.published_at) await db.from("blog_posts").update({ published_at: nowIso() }).eq("id", id);
  }

  await syncPostTags(id, input.tags ?? []);
  return id;
}

export async function deletePost(id: string): Promise<void> {
  await db.from("blog_post_tags").delete().eq("post_id", id);
  await db.from("blog_posts").delete().eq("id", id);
}

export async function syncPostTags(postId: string, tags: string[]): Promise<void> {
  await db.from("blog_post_tags").delete().eq("post_id", postId);
  for (const name of tags) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    const { data: existing } = await db.from("blog_tags").select("id").eq("slug", slug).maybeSingle();
    let tagId = existing?.id;
    if (!tagId) {
      tagId = newId();
      await db.from("blog_tags").insert({ id: tagId, slug, name: trimmed });
    }
    await db.from("blog_post_tags").insert({ post_id: postId, tag_id: tagId });
  }
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  const { data } = await db.from("blog_categories").select("*").order("sort_order", { ascending: true });
  const { data: posts } = await db.from("blog_posts").select("category_id").eq("status", "published");
  const counts = new Map<string, number>();
  for (const post of posts ?? []) {
    if (!post.category_id) continue;
    counts.set(post.category_id, (counts.get(post.category_id) ?? 0) + 1);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    postCount: counts.get(row.id) ?? 0,
  }));
}

export interface SaveCategoryInput {
  id?: string | undefined;
  slug?: string | undefined;
  name: string;
  description?: string | undefined;
  parentId?: string | null | undefined;
  sortOrder?: number | undefined;
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
}

export async function saveCategory(input: SaveCategoryInput): Promise<string> {
  const id = input.id ?? newId();
  const slug = await uniqueSlug("blog_categories", slugify(input.slug || input.name), input.id);
  const row = {
    slug,
    name: input.name,
    description: input.description ?? "",
    parent_id: input.parentId || null,
    sort_order: input.sortOrder ?? 0,
    seo_title: input.seoTitle ?? "",
    seo_description: input.seoDescription ?? "",
    updated_at: nowIso(),
  };
  if (input.id) await db.from("blog_categories").update(row).eq("id", input.id);
  else await db.from("blog_categories").insert({ id, ...row });
  return id;
}

export async function deleteCategory(id: string): Promise<void> {
  await db.from("blog_posts").update({ category_id: null }).eq("category_id", id);
  await db.from("blog_categories").delete().eq("id", id);
}

export async function fetchTags(): Promise<TagDto[]> {
  const { data } = await db.from("blog_tags").select("*").order("sort_order", { ascending: true });
  const { data: links } = await db.from("blog_post_tags").select("tag_id");
  const counts = new Map<string, number>();
  for (const link of links ?? []) counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    postCount: counts.get(row.id) ?? 0,
  }));
}

export interface SaveTagInput {
  id?: string | undefined;
  slug?: string | undefined;
  name: string;
  description?: string | undefined;
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
}

export async function saveTag(input: SaveTagInput): Promise<string> {
  const id = input.id ?? newId();
  const slug = await uniqueSlug("blog_tags", slugify(input.slug || input.name), input.id);
  const row = {
    slug,
    name: input.name,
    description: input.description ?? "",
    seo_title: input.seoTitle ?? "",
    seo_description: input.seoDescription ?? "",
    updated_at: nowIso(),
  };
  if (input.id) await db.from("blog_tags").update(row).eq("id", input.id);
  else await db.from("blog_tags").insert({ id, ...row });
  return id;
}

export async function deleteTag(id: string): Promise<void> {
  await db.from("blog_post_tags").delete().eq("tag_id", id);
  await db.from("blog_tags").delete().eq("id", id);
}
