import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AppPlatform = "ios" | "android" | "windows" | "mac";

export interface AppDto {
  id: string;
  slug: string;
  platform: AppPlatform;
  name: string;
  subtitle: string;
  iconUrl: string;
  shortDesc: string;
  description: string;
  features: string[];
  screenshots: string[];
  version: string;
  size: string;
  minOs: string;
  downloadUrl: string;
  sortOrder: number;
  enabled: boolean;
}

export interface AppStats {
  total: number;
  perApp: { appId: string; name: string; platform: AppPlatform; total: number; last30: number }[];
  daily: { date: string; count: number }[];
}

const appSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional().default(""),
  platform: z.enum(["ios", "android", "windows", "mac"]),
  name: z.string().min(1, "نام الزامی است"),
  subtitle: z.string().optional().default(""),
  iconUrl: z.string().optional().default(""),
  shortDesc: z.string().optional().default(""),
  description: z.string().optional().default(""),
  features: z.array(z.string()).optional().default([]),
  screenshots: z.array(z.string()).optional().default([]),
  version: z.string().optional().default(""),
  size: z.string().optional().default(""),
  minOs: z.string().optional().default(""),
  downloadUrl: z.string().optional().default(""),
  sortOrder: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
});
export type AppInput = z.infer<typeof appSchema>;

/** نسخه عمومی بدون لینک مستقیم (کلیک‌ها باید از /go عبور کنند) */
function publicShape(a: AppDto): AppDto {
  return { ...a, downloadUrl: a.downloadUrl ? "1" : "" };
}

export const getPublicApps = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { fetchPublicApps } = await import("./apps.server");
    return (await fetchPublicApps()).map(publicShape);
  } catch (e) {
    console.error("getPublicApps failed:", e);
    return [] as AppDto[];
  }
});

export const getPublicApp = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { fetchPublicApp } = await import("./apps.server");
      const a = await fetchPublicApp(data.slug);
      return a ? publicShape(a) : null;
    } catch (e) {
      console.error("getPublicApp failed:", e);
      return null;
    }
  });

export const adminListApps = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { adminFetchApps, fetchAppStats } = await import("./apps.server");
  const [apps, stats] = await Promise.all([adminFetchApps(), fetchAppStats()]);
  return { apps, stats };
});

export const adminSaveApp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => appSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveApp } = await import("./apps.server");
    return { ok: true, id: await saveApp(data) };
  });

export const adminDeleteApp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { deleteApp } = await import("./apps.server");
    await deleteApp(data.id);
    return { ok: true };
  });
