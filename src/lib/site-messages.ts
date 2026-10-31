// دیکشنری ترجمه رابط سایت برای هر زبان، کلیدشده با متن فارسی. فقط دیکشنری زبان همان
// صفحه بارگذاری می‌شود تا بازدیدکننده فارسی و بقیه زبان‌ها دیکشنری‌های دیگر را دانلود نکنند.
import type { Locale } from "./locales";

type Messages = Record<string, string>;

const LOADERS: Partial<Record<Locale, () => Promise<Messages>>> = {
  en: () => import("./site-translations.en.json").then((m) => m.default as Messages),
};

const EMPTY: Messages = {};
const loaded = new Map<Locale, Messages>();

export async function loadSiteMessages(locale: Locale): Promise<Messages> {
  const cached = loaded.get(locale);
  if (cached) return cached;
  const loader = LOADERS[locale];
  const messages = loader ? await loader() : EMPTY;
  loaded.set(locale, messages);
  return messages;
}
