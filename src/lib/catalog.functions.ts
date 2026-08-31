import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CatalogType = "product" | "solution";

export interface CatalogItemDto {
  id: string;
  type: CatalogType;
  categoryId: string | null;
  slug: string;
  icon: string;
  title: string;
  shortDesc: string;
  description: string;
  bullets: string[];
  sortOrder: number;
  published: boolean;
}

export interface CatalogCategoryDto {
  id: string;
  type: CatalogType;
  title: string;
  sortOrder: number;
  items: CatalogItemDto[];
}

const typeSchema = z.enum(["product", "solution"]);

/** دسته‌بندی‌ها و آیتم‌های منتشرشدهٔ محصولات/راه‌کارها — برای مگامنو و صفحات عمومی */
export const getPublicCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ type: typeSchema }).parse(input))
  .handler(async ({ data }): Promise<CatalogCategoryDto[]> => {
    try {
      const { fetchPublicCatalog } = await import("./catalog.server");
      return await fetchPublicCatalog(data.type);
    } catch (error) {
      console.error("getPublicCatalog failed:", error);
      return [];
    }
  });

/** یک آیتم منتشرشده با اسلاگ — برای صفحه توضیحات اختصاصی محصول/راه‌کار */
export const getPublicCatalogItem = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ type: typeSchema, slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { fetchPublicCatalogItem } = await import("./catalog.server");
      return await fetchPublicCatalogItem(data.type, data.slug);
    } catch (error) {
      console.error("getPublicCatalogItem failed:", error);
      return null;
    }
  });

/* ───────────── مدیریت (نیازمند ورود مدیر) ───────────── */

export const adminListCatalogCategories = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ type: typeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { adminFetchCategories } = await import("./catalog.server");
    await requireAdmin();
    return await adminFetchCategories(data.type);
  });

const categorySchema = z.object({
  id: z.string().optional(),
  type: typeSchema,
  name: z.string().min(1, "نام دسته الزامی است"),
  sortOrder: z.number().optional().default(0),
});

export const adminSaveCatalogCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categorySchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { saveCatalogCategory } = await import("./catalog.server");
    await requireAdmin();
    const id = await saveCatalogCategory(data);
    return { ok: true, id };
  });

export const adminDeleteCatalogCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { deleteCatalogCategory } = await import("./catalog.server");
    await requireAdmin();
    await deleteCatalogCategory(data.id);
    return { ok: true };
  });

export const adminListCatalogItems = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ type: typeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { adminFetchItems } = await import("./catalog.server");
    await requireAdmin();
    return await adminFetchItems(data.type);
  });

export const adminGetCatalogItem = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<CatalogItemDto | null> => {
    const { requireAdmin } = await import("./auth.server");
    const { adminGetItem } = await import("./catalog.server");
    await requireAdmin();
    return await adminGetItem(data.id);
  });

const itemSchema = z.object({
  id: z.string().optional(),
  type: typeSchema,
  categoryId: z.string().nullable().optional(),
  slug: z.string().optional(),
  icon: z.string().min(1),
  title: z.string().min(1, "عنوان الزامی است"),
  shortDesc: z.string().optional().default(""),
  description: z.string().optional().default(""),
  bullets: z.array(z.string()).optional().default([]),
  sortOrder: z.number().optional().default(0),
  published: z.boolean().optional().default(true),
});

export const adminSaveCatalogItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => itemSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { saveCatalogItem } = await import("./catalog.server");
    await requireAdmin();
    const id = await saveCatalogItem(data);
    return { ok: true, id };
  });

export const adminDeleteCatalogItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { deleteCatalogItem } = await import("./catalog.server");
    await requireAdmin();
    await deleteCatalogItem(data.id);
    return { ok: true };
  });
