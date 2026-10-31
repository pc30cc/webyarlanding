import { db, newId, nowIso, parseJson } from "./db.server";
import type { Locale } from "./locales";
import { mergeSettings, type SiteSettings } from "./settings";

const SITE_KEY = "site_settings";
const PRIVATE_KEY = "private_settings";

/**
 * با هر ذخیره تنظیمات عمومی یکی زیاد می‌شود تا کش‌های همین فرایند (ریدایرکت‌های زبان در
 * server.ts) بلافاصله تازه شوند.
 */
export let settingsRevision = 0;

/** مثل loadSettings، ولی اگر دیتابیس در دسترس نباشد خطا می‌دهد (برای تصمیم‌های ریدایرکت). */
export async function loadSettingsStrict(): Promise<SiteSettings> {
  const { data, error } = await db
    .from("settings")
    .select("setting_value")
    .eq("setting_key", SITE_KEY)
    .maybeSingle();
  if (error) throw error;
  return mergeSettings(parseJson<Partial<SiteSettings>>(data?.setting_value, {}));
}

/** تنظیمات عمومی سایت (قابل نمایش به بازدیدکننده) */
export async function loadSettings(): Promise<SiteSettings> {
  try {
    const { data } = await db
      .from("settings")
      .select("setting_value")
      .eq("setting_key", SITE_KEY)
      .maybeSingle();
    return mergeSettings(parseJson<Partial<SiteSettings>>(data?.setting_value, {}));
  } catch (error) {
    // دیتابیس در دسترس نیست — صفحه عمومی با تنظیمات پیش‌فرض رندر می‌شود
    console.error("loadSettings failed, using defaults:", error);
    return mergeSettings({});
  }
}

export async function saveSettings(next: SiteSettings): Promise<void> {
  // ترجمه‌های انگلیسی قدیمی (localization.english) پس از انتقال به ردیف site_translations_en
  // دوباره در تنظیمات عمومی نوشته نمی‌شوند؛ مثلاً از فرمی که پیش از انتقال باز شده بود.
  if (hasEntries(next.localization?.english) && (await siteTranslationsRowExists("en"))) {
    next = { ...next, localization: { ...next.localization, english: {} } };
  }
  const { data, error: readError } = await db
    .from("settings")
    .select("id, updated_at")
    .eq("setting_key", SITE_KEY)
    .maybeSingle();
  if (readError) throw readError;
  const payload = {
    setting_key: SITE_KEY,
    setting_value: JSON.stringify(next),
    is_private: 0,
    // همیشه با مقدار قبلی فرق دارد تا نوشتن شرطی clearLegacyEnglishTranslations این ذخیره را ببیند
    updated_at: nextUpdatedAt(data?.updated_at),
  };
  if (data) {
    const { error } = await db.from("settings").update(payload).eq("id", data.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("settings").insert({ id: newId(), ...payload });
    if (error) throw error;
  }
  settingsRevision++;
}

/**
 * زمان ذخیره تازه برای ردیف site_settings که حتماً با updated_at خوانده‌شده فرق دارد (حتی اگر
 * دو ذخیره در یک میلی‌ثانیه، یا با ساعت عقب‌تر یک نمونه دیگر سرور، انجام شوند).
 */
function nextUpdatedAt(previous: unknown): string {
  const now = nowIso();
  if (typeof previous !== "string" || !previous) return now;
  // ستون timestamp بدون منطقه زمانی است و زمان‌ها به UTC ذخیره می‌شوند
  const zoned = /T.*(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(previous);
  const before = Date.parse(zoned ? previous : previous + "Z");
  if (Number.isNaN(before) || Date.parse(now) > before) return now;
  return new Date(before + 1).toISOString();
}

function hasEntries(value: unknown): boolean {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

/**
 * ترجمه‌های محتوای ویرایشگر (کلیدشده با متن فارسی) برای هر زبان در یک ردیف جدا از
 * site_settings ذخیره می‌شوند، تا بازدیدکننده فقط ترجمه‌های زبان همان صفحه را دریافت کند.
 */
export function siteTranslationsKey(locale: Locale): string {
  return `site_translations_${locale}`;
}

async function siteTranslationsRowExists(locale: Locale): Promise<boolean> {
  const { data, error } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", siteTranslationsKey(locale))
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** فقط جفت‌های متنی غیرخالی (داده ذخیره‌شده ممکن است دستی ویرایش شده باشد) */
function stringEntries(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, text] of Object.entries(value))
    if (key && typeof text === "string" && text.trim()) result[key] = text;
  return result;
}

/**
 * ترجمه‌های ذخیره‌شده یک زبان؛ null یعنی هنوز ردیفی برای آن زبان ذخیره نشده است.
 * خطای دیتابیس پرتاب می‌شود تا با «ترجمه‌ای نیست» اشتباه گرفته نشود.
 */
export async function loadSiteTranslationsRow(
  locale: Locale,
): Promise<Record<string, string> | null> {
  const { data, error } = await db
    .from("settings")
    .select("setting_value")
    .eq("setting_key", siteTranslationsKey(locale))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return stringEntries(parseJson<unknown>(data.setting_value, {}));
}

export async function saveSiteTranslationsRow(
  locale: Locale,
  translations: Record<string, string>,
): Promise<void> {
  const key = siteTranslationsKey(locale);
  const { data, error: readError } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", key)
    .maybeSingle();
  if (readError) throw readError;
  const payload = {
    setting_key: key,
    setting_value: JSON.stringify(stringEntries(translations)),
    is_private: 0,
    updated_at: nowIso(),
  };
  const { error } = data
    ? await db.from("settings").update(payload).eq("id", data.id)
    : await db.from("settings").insert({ id: newId(), ...payload });
  if (error) throw error;
}

/** چند بار تلاش دوباره وقتی ذخیره هم‌زمان تنظیمات، نوشتن شرطی را رد کند */
const CLEAR_LEGACY_ATTEMPTS = 5;

/**
 * ترجمه‌های انگلیسی قدیمی (localization.english) را از تنظیمات عمومی پاک می‌کند تا JSON
 * تنظیمات که هر بازدیدکننده دریافت می‌کند کوچک شود. خواندن-تغییر-نوشتن روی خود ردیف ذخیره‌شده
 * است (نه نسخه ادغام‌شده با پیش‌فرض‌ها) تا هیچ فیلد دیگری تغییر نکند. نوشتن شرطی است (فقط اگر
 * updated_at از زمان خواندن عوض نشده باشد)، پس ذخیره هم‌زمان تنظیمات بازنویسی نمی‌شود و با
 * خواندن دوباره تکرار می‌شود. اگر چیزی برای پاک کردن نبود (یا با ذخیره‌های پشت‌سرهم هم موفق
 * نشد؛ ترجمه‌ها در ردیف خودشان ذخیره شده‌اند و ذخیره انگلیسی بعدی دوباره تلاش می‌کند) false
 * برمی‌گرداند.
 */
export async function clearLegacyEnglishTranslations(): Promise<boolean> {
  for (let attempt = 0; attempt < CLEAR_LEGACY_ATTEMPTS; attempt++) {
    const { data, error } = await db
      .from("settings")
      .select("id, setting_value, updated_at")
      .eq("setting_key", SITE_KEY)
      .maybeSingle();
    if (error) throw error;
    if (!data) return false;
    const stored = parseJson<unknown>(data.setting_value, null);
    if (!stored || typeof stored !== "object") return false;
    const localization = (stored as { localization?: unknown }).localization;
    if (!localization || typeof localization !== "object") return false;
    if (!hasEntries((localization as { english?: unknown }).english)) return false;
    const next = { ...stored, localization: { ...localization, english: {} } };
    const { data: written, error: writeError } = await db
      .from("settings")
      .update({
        setting_value: JSON.stringify(next),
        updated_at: nextUpdatedAt(data.updated_at),
      })
      .eq("id", data.id)
      .eq("updated_at", data.updated_at)
      .select("id");
    if (writeError) throw writeError;
    if (Array.isArray(written) && written.length > 0) {
      settingsRevision++;
      return true;
    }
    // ردیف در همین فاصله ذخیره شد؛ نسخه تازه خوانده و دوباره بررسی می‌شود
  }
  console.warn("clearLegacyEnglishTranslations: settings kept changing; will retry on next save");
  return false;
}

/** تنظیمات محرمانه (اتصال FTP/رسانه و مانند آن) — هرگز به کلاینت ارسال نمی‌شود */
export async function loadPrivateSettings<T extends object>(fallback: T): Promise<T> {
  const { data } = await db
    .from("settings")
    .select("setting_value")
    .eq("setting_key", PRIVATE_KEY)
    .maybeSingle();
  return parseJson<T>(data?.setting_value, fallback);
}

/**
 * کلیدهای قدیمی تنظیمات محرمانه که دیگر هیچ بخشی آن‌ها را نمی‌خواند (اتصال حذف‌شده «ترانسفر
 * مستقیم به دیتابیس مقصد»: آدرس و کلید Service Role). هنگام خواندن نادیده گرفته می‌شوند و در
 * اولین ذخیره بعدی از ردیف حذف می‌شوند تا کلید بی‌استفاده در دیتابیس نماند.
 */
const LEGACY_PRIVATE_KEYS = ["url", "serviceRoleKey"];

export async function savePrivateSettings(value: object): Promise<void> {
  const { data } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", PRIVATE_KEY)
    .maybeSingle();
  const cleaned: Record<string, unknown> = { ...value };
  for (const key of LEGACY_PRIVATE_KEYS) delete cleaned[key];
  const payload = {
    setting_key: PRIVATE_KEY,
    setting_value: JSON.stringify(cleaned),
    is_private: 1,
    updated_at: nowIso(),
  };
  if (data) {
    await db.from("settings").update(payload).eq("id", data.id);
  } else {
    await db.from("settings").insert({ id: newId(), ...payload });
  }
}

/** کلیدهای API سرویس‌های هوش مصنوعی — بخشی از تنظیمات محرمانه، فقط سمت سرور خوانده می‌شود */
export interface AiApiKeys {
  aiOpenaiApiKey: string;
  aiGeminiApiKey: string;
}

const AI_KEYS_DEFAULTS: AiApiKeys = { aiOpenaiApiKey: "", aiGeminiApiKey: "" };

export async function loadAiKeys(): Promise<AiApiKeys> {
  const stored = await loadPrivateSettings<Partial<AiApiKeys>>({});
  return { ...AI_KEYS_DEFAULTS, ...stored };
}

export async function saveAiKeys(partial: Partial<AiApiKeys>): Promise<void> {
  const stored = await loadPrivateSettings<Partial<AiApiKeys>>({});
  await savePrivateSettings({ ...stored, ...partial });
}

/** کلیدهای اتصال به محل ذخیره‌سازی تصاویر — بخشی از تنظیمات محرمانه، فقط سمت سرور خوانده می‌شود */
export interface MediaApiKeys {
  mediaBunnyAccessKey: string;
  mediaArvanAccessKey: string;
  mediaArvanSecretKey: string;
}

const MEDIA_KEYS_DEFAULTS: MediaApiKeys = {
  mediaBunnyAccessKey: "",
  mediaArvanAccessKey: "",
  mediaArvanSecretKey: "",
};

export async function loadMediaKeys(): Promise<MediaApiKeys> {
  const stored = await loadPrivateSettings<Partial<MediaApiKeys>>({});
  return { ...MEDIA_KEYS_DEFAULTS, ...stored };
}

export async function saveMediaKeys(partial: Partial<MediaApiKeys>): Promise<void> {
  const stored = await loadPrivateSettings<Partial<MediaApiKeys>>({});
  await savePrivateSettings({ ...stored, ...partial });
}

/** توکن ربات تلگرام و رمز وبهوک — بخشی از تنظیمات محرمانه، فقط سمت سرور خوانده می‌شود */
export interface TelegramApiKeys {
  telegramBotToken: string;
  /** رمزی که تلگرام در هدر هر درخواست وبهوک برمی‌گرداند تا از جعل درخواست جلوگیری شود */
  telegramWebhookSecret: string;
}

const TELEGRAM_KEYS_DEFAULTS: TelegramApiKeys = {
  telegramBotToken: "",
  telegramWebhookSecret: "",
};

export async function loadTelegramKeys(): Promise<TelegramApiKeys> {
  const stored = await loadPrivateSettings<Partial<TelegramApiKeys>>({});
  return { ...TELEGRAM_KEYS_DEFAULTS, ...stored };
}

export async function saveTelegramKeys(partial: Partial<TelegramApiKeys>): Promise<void> {
  const stored = await loadPrivateSettings<Partial<TelegramApiKeys>>({});
  await savePrivateSettings({ ...stored, ...partial });
}

/** کلید سرویس‌اکانت گوگل برای اتصال به سرچ کنسول — بخشی از تنظیمات محرمانه */
export interface GscApiKeys {
  /** محتوای کامل فایل JSON کلید سرویس‌اکانت گوگل */
  gscServiceAccountJson: string;
}

const GSC_KEYS_DEFAULTS: GscApiKeys = { gscServiceAccountJson: "" };

export async function loadGscKeys(): Promise<GscApiKeys> {
  const stored = await loadPrivateSettings<Partial<GscApiKeys>>({});
  return { ...GSC_KEYS_DEFAULTS, ...stored };
}

export async function saveGscKeys(partial: Partial<GscApiKeys>): Promise<void> {
  const stored = await loadPrivateSettings<Partial<GscApiKeys>>({});
  await savePrivateSettings({ ...stored, ...partial });
}
