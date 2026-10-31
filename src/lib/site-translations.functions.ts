import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LOCALES, type Locale } from "./locales";
import { normalizeMessage } from "./site-i18n";

type TranslatedLocale = Exclude<Locale, "fa">;
const translatedLocaleSchema = z.enum(["en", "tr", "ar"]);
const localeSchema = z.enum(LOCALES as [Locale, ...Locale[]]);

/** سقف‌ها: متن‌های محصول می‌توانند بلند باشند، ولی کل نقشه هر زبان محدود است. */
const MAX_ENTRIES = 20_000;
const MAX_TOTAL_LENGTH = 5_000_000;

const saveSchema = z
  .object({
    locale: translatedLocaleSchema,
    translations: z.record(z.string().min(1).max(50_000), z.string().max(100_000)),
  })
  .refine((input) => Object.keys(input.translations).length <= MAX_ENTRIES, "Too many translations")
  .refine(
    (input) => JSON.stringify(input.translations).length <= MAX_TOTAL_LENGTH,
    "Translations are too large",
  )
  .transform(({ locale, translations }) => {
    // کلیدها مثل مترجم سایت یکسان‌سازی می‌شوند؛ ترجمه خالی یعنی «بدون ترجمه».
    const normalized: Record<string, string> = {};
    for (const [source, text] of Object.entries(translations)) {
      const key = normalizeMessage(source);
      if (key && text.trim()) normalized[key] = text;
    }
    return { locale, translations: normalized };
  });

/** ترجمه‌های محتوای ویرایشگر برای یک زبان (عمومی؛ برای فارسی خالی). */
export const fetchSiteTranslations = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ locale: localeSchema }).parse(input))
  .handler(async ({ data }): Promise<Record<string, string>> => {
    if (data.locale === "fa") return {};
    const { loadSiteTranslations } = await import("./site-translations.server");
    return await loadSiteTranslations(data.locale);
  });

export interface AdminSiteTranslations {
  translations: Record<TranslatedLocale, Record<string, string>>;
  /** ترجمه‌های انگلیسی هنوز از تنظیمات قدیمی (localization.english) خوانده می‌شوند */
  legacyEnglish: boolean;
}

/** ترجمه‌های همه زبان‌ها برای ویرایشگر پنل — فقط مدیر */
export const adminGetSiteTranslations = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSiteTranslations> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { readSiteTranslations } = await import("./site-translations.server");
    const [en, tr, ar] = await Promise.all([
      readSiteTranslations("en", true),
      readSiteTranslations("tr", true),
      readSiteTranslations("ar", true),
    ]);
    return {
      translations: { en: en.translations, tr: tr.translations, ar: ar.translations },
      legacyEnglish: en.legacy,
    };
  },
);

/** ذخیره ترجمه‌های یک زبان — فقط مدیر */
export const adminSaveSiteTranslations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; clearedLegacy: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveSiteTranslations } = await import("./site-translations.server");
    const { clearedLegacy } = await saveSiteTranslations(data.locale, data.translations);
    return { ok: true, clearedLegacy };
  });
