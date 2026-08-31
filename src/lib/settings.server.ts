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
