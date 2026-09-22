import { db, newId, nowIso, parseJson } from "./db.server";
import { mergeSettings, type SiteSettings } from "./settings";

const SITE_KEY = "site_settings";
const PRIVATE_KEY = "private_settings";

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
  const { data } = await db.from("settings").select("id").eq("setting_key", SITE_KEY).maybeSingle();
  const payload = {
    setting_key: SITE_KEY,
    setting_value: JSON.stringify(next),
    is_private: 0,
    updated_at: nowIso(),
  };
  if (data) {
    await db.from("settings").update(payload).eq("id", data.id);
  } else {
    await db.from("settings").insert({ id: newId(), ...payload });
  }
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

export async function savePrivateSettings(value: object): Promise<void> {
  const { data } = await db
    .from("settings")
    .select("id")
    .eq("setting_key", PRIVATE_KEY)
    .maybeSingle();
  const payload = {
    setting_key: PRIVATE_KEY,
    setting_value: JSON.stringify(value),
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

const TELEGRAM_KEYS_DEFAULTS: TelegramApiKeys = { telegramBotToken: "", telegramWebhookSecret: "" };

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

/** اتصال به یک پروژه Supabase مقصد برای ترانسفر مستقیم بک‌آپ — بخشی از تنظیمات محرمانه */
export interface DestinationDbSettings {
  /** آدرس پروژه Supabase مقصد، مثل https://xxxx.supabase.co یا آدرس نمونه self-hosted شما */
  url: string;
  /** کلید Service Role همان پروژه مقصد — هرگز به کلاینت ارسال نمی‌شود */
  serviceRoleKey: string;
}

const DESTINATION_DB_DEFAULTS: DestinationDbSettings = {
  url: "",
  serviceRoleKey: "",
};

export async function loadDestinationDb(): Promise<DestinationDbSettings> {
  const stored = await loadPrivateSettings<Partial<DestinationDbSettings>>({});
  return { ...DESTINATION_DB_DEFAULTS, ...stored };
}

export async function saveDestinationDb(partial: Partial<DestinationDbSettings>): Promise<void> {
  const stored = await loadPrivateSettings<Partial<DestinationDbSettings>>({});
  await savePrivateSettings({ ...stored, ...partial });
}
