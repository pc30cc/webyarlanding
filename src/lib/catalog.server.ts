import { db, newId, nowIso, parseJson, slugify, toBool } from "./db.server";
import type { CatalogCategoryDto, CatalogItemDto, CatalogType } from "./catalog.functions";

type CategoryRow = {
  id: string;
  type: string;
  name: string;
  sort_order: number;
};

type ItemRow = {
  id: string;
  type: string;
  category_id: string | null;
  slug: string;
  icon: string;
  title: string;
  short_desc: string;
  description: string;
  bullets_json: string;
  sort_order: number;
  published: number;
  updated_at: string;
};

function mapItem(row: ItemRow): CatalogItemDto {
  return {
    id: row.id,
    type: row.type as CatalogType,
    categoryId: row.category_id,
    slug: row.slug,
    icon: row.icon,
    title: row.title,
    shortDesc: row.short_desc,
    description: row.description,
    bullets: parseJson<string[]>(row.bullets_json, []),
    sortOrder: row.sort_order,
    published: toBool(row.published),
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: CategoryRow): Omit<CatalogCategoryDto, "items"> {
  return { id: row.id, type: row.type as CatalogType, title: row.name, sortOrder: row.sort_order };
}

/** دسته‌بندی‌ها به‌همراه آیتم‌های منتشرشده — برای رندر عمومی (مگامنو، صفحه لیست) */
export async function fetchPublicCatalog(type: CatalogType): Promise<CatalogCategoryDto[]> {
  const [{ data: catRows }, { data: itemRows }] = await Promise.all([
    db
      .from("catalog_categories")
      .select("*")
      .eq("type", type)
      .order("sort_order", { ascending: true }),
    db
      .from("catalog_items")
      .select("*")
      .eq("type", type)
      .eq("published", 1)
      .order("sort_order", { ascending: true }),
  ]);

  const items = (itemRows ?? []).map((row) => mapItem(row as ItemRow));
  const categories = (catRows ?? []).map((row) => mapCategory(row as CategoryRow));

  return categories
    .map((cat) => ({ ...cat, items: items.filter((item) => item.categoryId === cat.id) }))
    .filter((cat) => cat.items.length > 0);
}

/** یک آیتم منتشرشده با اسلاگ، به‌همراه عنوان دسته و آیتم‌های مشابه همان دسته */
export async function fetchPublicCatalogItem(
  type: CatalogType,
  slug: string,
): Promise<{
  item: CatalogItemDto;
  categoryTitle: string | null;
  related: CatalogItemDto[];
} | null> {
  const { data: row } = await db
    .from("catalog_items")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("published", 1)
    .maybeSingle();
  if (!row) return null;
  const item = mapItem(row as ItemRow);

  let categoryTitle: string | null = null;
  let related: CatalogItemDto[] = [];
  if (item.categoryId) {
    const [{ data: catRow }, { data: siblingRows }] = await Promise.all([
      db.from("catalog_categories").select("name").eq("id", item.categoryId).maybeSingle(),
      db
        .from("catalog_items")
        .select("*")
        .eq("category_id", item.categoryId)
        .eq("published", 1)
        .neq("id", item.id)
        .order("sort_order", { ascending: true })
        .limit(3),
    ]);
    categoryTitle = catRow?.name ?? null;
    related = (siblingRows ?? []).map((r) => mapItem(r as ItemRow));
  }

  return { item, categoryTitle, related };
}

/* ───────────── مدیریت (نیازمند ورود مدیر) ───────────── */

export async function adminFetchCategories(
  type: CatalogType,
): Promise<(Omit<CatalogCategoryDto, "items"> & { itemCount: number })[]> {
  const [{ data: catRows }, { data: itemRows }] = await Promise.all([
    db
      .from("catalog_categories")
      .select("*")
      .eq("type", type)
      .order("sort_order", { ascending: true }),
    db.from("catalog_items").select("category_id").eq("type", type),
  ]);
  const counts = new Map<string, number>();
  for (const row of itemRows ?? []) {
    if (!row.category_id) continue;
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  return (catRows ?? []).map((row) => ({
    ...mapCategory(row as CategoryRow),
    itemCount: counts.get(row.id) ?? 0,
  }));
}

export interface SaveCatalogCategoryInput {
  id?: string | undefined;
  type: CatalogType;
  name: string;
  sortOrder?: number | undefined;
}

export async function saveCatalogCategory(input: SaveCatalogCategoryInput): Promise<string> {
  const id = input.id ?? newId();
  const row = {
    type: input.type,
    name: input.name,
    sort_order: input.sortOrder ?? 0,
    updated_at: nowIso(),
  };
  if (input.id) await db.from("catalog_categories").update(row).eq("id", input.id);
  else await db.from("catalog_categories").insert({ id, ...row });
  return id;
}

export async function deleteCatalogCategory(id: string): Promise<void> {
  await db.from("catalog_items").update({ category_id: null }).eq("category_id", id);
  await db.from("catalog_categories").delete().eq("id", id);
}

export async function adminFetchItems(
  type: CatalogType,
): Promise<(CatalogItemDto & { categoryTitle: string | null })[]> {
  const [{ data: itemRows }, { data: catRows }] = await Promise.all([
    db.from("catalog_items").select("*").eq("type", type).order("sort_order", { ascending: true }),
    db.from("catalog_categories").select("id, name").eq("type", type),
  ]);
  const catMap = new Map<string, string>();
  for (const row of catRows ?? []) catMap.set(row.id, row.name);
  return (itemRows ?? []).map((row) => {
    const item = mapItem(row as ItemRow);
    return {
      ...item,
      categoryTitle: item.categoryId ? (catMap.get(item.categoryId) ?? null) : null,
    };
  });
}

export async function adminGetItem(id: string): Promise<CatalogItemDto | null> {
  const { data } = await db.from("catalog_items").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return mapItem(data as ItemRow);
}

async function uniqueItemSlug(type: CatalogType, desired: string, ignoreId?: string | undefined) {
  let slug = desired;
  let attempt = 1;

  while (true) {
    const { data } = await db
      .from("catalog_items")
      .select("id")
      .eq("type", type)
      .eq("slug", slug)
      .maybeSingle();
    if (!data || data.id === ignoreId) return slug;
    attempt += 1;
    slug = `${desired}-${attempt}`;
  }
}

export interface SaveCatalogItemInput {
  id?: string | undefined;
  type: CatalogType;
  categoryId?: string | null | undefined;
  slug?: string | undefined;
  icon: string;
  title: string;
  shortDesc?: string | undefined;
  description?: string | undefined;
  bullets?: string[] | undefined;
  sortOrder?: number | undefined;
  published?: boolean | undefined;
}

export async function saveCatalogItem(input: SaveCatalogItemInput): Promise<string> {
  const id = input.id ?? newId();
  const slug = await uniqueItemSlug(input.type, slugify(input.slug || input.title), input.id);
  const row = {
    type: input.type,
    category_id: input.categoryId || null,
    slug,
    icon: input.icon,
    title: input.title,
    short_desc: input.shortDesc ?? "",
    description: input.description ?? "",
    bullets_json: JSON.stringify((input.bullets ?? []).map((b) => b.trim()).filter(Boolean)),
    sort_order: input.sortOrder ?? 0,
    published: input.published === false ? 0 : 1,
    updated_at: nowIso(),
  };
  if (input.id) await db.from("catalog_items").update(row).eq("id", input.id);
  else await db.from("catalog_items").insert({ id, ...row });
  return id;
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await db.from("catalog_items").delete().eq("id", id);
}
