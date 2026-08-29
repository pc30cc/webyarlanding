import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface MediaAssetDto {
  id: string;
  filename: string;
  url: string;
  path: string;
  provider: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

export const listMedia = createServerFn({ method: "GET" }).handler(async (): Promise<MediaAssetDto[]> => {
  const { requireAdmin } = await import("./auth.server");
  const { db } = await import("./db.server");
  await requireAdmin();
  const { data } = await db.from("media_assets").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.filename,
    url: row.url,
    path: row.path,
    provider: row.provider,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    createdAt: row.created_at,
  }));
});

const mediaSchema = z.object({
  filename: z.string().min(1, "نام فایل الزامی است"),
  url: z.string().min(1, "آدرس الزامی است"),
  alt: z.string().optional().default(""),
  provider: z.string().optional().default("external"),
});

export const saveMediaAsset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => mediaSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; id: string }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, newId } = await import("./db.server");
    const user = await requireAdmin();
    const id = newId();
    await db.from("media_assets").insert({
      id,
      filename: data.filename,
      path: data.url,
      url: data.url,
      provider: data.provider,
      alt: data.alt,
      uploaded_by: user.id,
    });
    return { ok: true, id };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    await db.from("media_assets").delete().eq("id", data.id);
    return { ok: true };
  });
