// ترجمه‌های محتوای ویرایشگر برای هر زبان (کلیدشده با متن فارسی) — فقط سمت سرور.
// هر زبان یک ردیف جدا در جدول settings دارد (site_translations_<locale>)، بیرون از JSON
// تنظیمات عمومی که هر بازدیدکننده دریافت می‌کند.
import type { Locale } from "./locales";
import {
  clearLegacyEnglishTranslations,
  loadSettings,
  loadSettingsStrict,
  loadSiteTranslationsRow,
  saveSiteTranslationsRow,
} from "./settings.server";
import {
  freshSiteTranslations,
  invalidateSiteTranslations,
  primeSiteTranslations,
  siteTranslationsRevision,
} from "./site-i18n";

export type TranslatedLocale = Exclude<Locale, "fa">;

/**
 * ترجمه‌های ذخیره‌شده یک زبان، بدون کش. انگلیسیِ بدون ردیف: ترجمه‌های قدیمی که پیش‌تر در
 * تنظیمات عمومی (localization.english) ذخیره می‌شد. با `strict` خطای خواندن تنظیمات هم پرتاب
 * می‌شود (پنل مدیریت نباید نقشه خالی را به جای داده قدیمی ببیند و ذخیره کند).
 */
export async function readSiteTranslations(
  locale: Locale,
  strict = false,
): Promise<{ translations: Record<string, string>; legacy: boolean }> {
  if (locale === "fa") return { translations: {}, legacy: false };
  const row = await loadSiteTranslationsRow(locale);
  if (row) return { translations: row, legacy: false };
  if (locale !== "en") return { translations: {}, legacy: false };
  const settings = strict ? await loadSettingsStrict() : await loadSettings();
  const english = { ...settings.localization.english };
  return { translations: english, legacy: Object.keys(english).length > 0 };
}

/**
 * ترجمه‌های یک زبان برای سایت عمومی، با کش کوتاه همین فرایند (site-i18n). null یعنی انگلیسی
 * هنوز ردیف خودش را ندارد: ترجمه‌های قدیمی داخل تنظیمات عمومی (localization.english) است که
 * هر صفحه همین حالا دارد و siteI18n از همان می‌خواند، پس دوباره فرستاده نمی‌شود.
 */
export async function loadSiteTranslations(locale: Locale): Promise<Record<string, string> | null> {
  const fresh = freshSiteTranslations(locale);
  if (fresh !== undefined) return fresh;
  // نسخه پیش از خواندن: اگر مدیر در همین فاصله ذخیره کند، این نتیجه کهنه حساب می‌شود.
  const revision = siteTranslationsRevision();
  const row = await loadSiteTranslationsRow(locale);
  const translations = row ?? (locale === "en" ? null : {});
  primeSiteTranslations(locale, translations, revision);
  return translations;
}

/**
 * ذخیره ترجمه‌های یک زبان. با اولین ذخیره انگلیسی، ترجمه‌های قدیمی از تنظیمات عمومی پاک
 * می‌شوند (پس از نوشتن ردیف جدید، تا هیچ‌وقت داده‌ای از دست نرود).
 */
export async function saveSiteTranslations(
  locale: TranslatedLocale,
  translations: Record<string, string>,
): Promise<{ clearedLegacy: boolean }> {
  await saveSiteTranslationsRow(locale, translations);
  invalidateSiteTranslations();
  const clearedLegacy = locale === "en" ? await clearLegacyEnglishTranslations() : false;
  return { clearedLegacy };
}
