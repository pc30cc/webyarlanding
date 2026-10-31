// دیکشنری ترجمه رابط سایت برای هر زبان، کلیدشده با متن فارسی. فقط دیکشنری زبان همان
// صفحه بارگذاری می‌شود تا بازدیدکننده فارسی و بقیه زبان‌ها دیکشنری‌های دیگر را دانلود نکنند.
import type { Locale } from "./locales";

type Messages = Record<string, string>;

const LOADERS: Partial<Record<Locale, () => Promise<Messages>>> = {
  en: () => import("./site-translations.en.json").then((m) => m.default as Messages),
};

const EMPTY: Messages = {};
const loaded = new Map<Locale, Messages>();

/** دیکشنری یک زبان اگر قبلاً بارگذاری شده باشد (برای head() که همگام اجرا می‌شود) */
export function cachedSiteMessages(locale: Locale): Messages {
  return locale === "fa" ? EMPTY : (loaded.get(locale) ?? EMPTY);
}

/** دیکشنری رسیده از داده‌های route ریشه (hydration) را در کش می‌گذارد. */
export function primeSiteMessages(locale: Locale, messages: Messages): void {
  if (locale !== "fa" && !loaded.has(locale) && Object.keys(messages).length > 0)
    loaded.set(locale, messages);
}

/** همه دیکشنری‌ها را بارگذاری می‌کند؛ فقط روی سرور، پیش از اجرای head() صفحات. */
export async function loadAllSiteMessages(): Promise<void> {
  await Promise.all((Object.keys(LOADERS) as Locale[]).map((locale) => loadSiteMessages(locale)));
}

export async function loadSiteMessages(locale: Locale): Promise<Messages> {
  const cached = loaded.get(locale);
  if (cached) return cached;
  const loader = LOADERS[locale];
  const messages = loader ? await loader() : EMPTY;
  loaded.set(locale, messages);
  return messages;
}
