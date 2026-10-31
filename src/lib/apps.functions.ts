import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isLocale, type Locale } from "./locales";

export type AppPlatform = "ios" | "android" | "windows" | "mac";

/**
 * لینک دانلود و نمایش یک برنامه در یک زبان (جز زبان پایه جدول apps). لینک خالی یعنی همان لینک
 * زبان پیش‌فرض؛ خاموش یعنی برنامه در آن زبان نمایش داده نمی‌شود.
 */
export interface AppLocaleOverride {
  downloadUrl: string;
  enabled: boolean;
}

export type AppLocaleOverrides = Partial<Record<Locale, AppLocaleOverride>>;

export interface AppDto {
  /** زبان‌هایی که برنامه در آن‌ها نمایش داده می‌شود (فقط در getPublicApp) */
  visibleLocales?: Locale[] | undefined;
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
  /** لینک دانلود نسخه انگلیسی (همان locales.en؛ برای سازگاری با نسخه‌های قبلی) */
  downloadUrlEn: string;
  /** نمایش در نسخه انگلیسی (همان locales.en) */
  enabledEn: boolean;
  /** لینک و نمایش هر زبان — فقط در پنل مدیریت؛ هرگز به صفحات عمومی فرستاده نمی‌شود */
  locales?: AppLocaleOverrides;
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
  downloadUrlEn: z.string().optional().default(""),
  enabledEn: z.boolean().optional().default(true),
  /**
   * لینک و نمایش هر زبان. اگر فرستاده شود جای همه زبان‌های این برنامه می‌نشیند (en هم)؛
   * کلید زبان ناشناخته نادیده گرفته می‌شود.
   */
  locales: z
    .record(
      z.string(),
      z.object({
        downloadUrl: z.string().trim().max(2000, "لینک طولانی است").optional().default(""),
        enabled: z.boolean().optional().default(true),
      }),
    )
    .optional()
    .transform((value): AppLocaleOverrides | undefined => {
      if (!value) return undefined;
      const result: AppLocaleOverrides = {};
      for (const [locale, entry] of Object.entries(value))
        if (isLocale(locale)) result[locale] = entry;
      return result;
    }),
});
export type AppInput = z.infer<typeof appSchema>;

/** زبان صفحه برای توابع عمومی برنامه‌ها؛ خالی، ناشناخته یا نامعتبر = زبان پیش‌فرض سایت */
const publicLocaleSchema = z
  .unknown()
  .optional()
  .transform((value): Locale | null => (isLocale(value) ? value : null));

/** نسخه عمومی بدون لینک مستقیم (کلیک‌ها باید از /go عبور کنند) */
function publicShape(a: AppDto): AppDto {
  const { locales: _locales, ...app } = a;
  return { ...app, downloadUrl: app.downloadUrl ? "1" : "", downloadUrlEn: "" };
}

/**
 * آدرس /go یک برنامه. /go پیشوند زبان نمی‌گیرد، پس صفحات زبان غیرپیش‌فرض زبانشان را با
 * ?l= می‌فرستند تا لینک فروشگاه همان زبان انتخاب شود. `prefix` همان پیشوند آدرس صفحه است
 * (null برای زبان پیش‌فرض، که آدرسش مثل قبل بدون پارامتر می‌ماند).
 */
export function appDownloadHref(slug: string, prefix: Locale | null | undefined): string {
  const href = `/go/${slug}`;
  return prefix ? `${href}?l=${prefix}` : href;
}

/**
 * برنامه‌های قابل نمایش در یک زبان. `locale` زبان آدرس صفحه است (context.urlLocale؛
 * خالی = زبان پیش‌فرض سایت).
 */
export const getPublicApps = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ locale: publicLocaleSchema }).optional().parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { fetchPublicApps } = await import("./apps.server");
      return (await fetchPublicApps(data?.locale ?? null)).map(publicShape);
    } catch (e) {
      console.error("getPublicApps failed:", e);
      return [] as AppDto[];
    }
  });

export const getPublicApp = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string(), locale: publicLocaleSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { fetchPublicApp } = await import("./apps.server");
      const a = await fetchPublicApp(data.slug, data.locale);
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
