import { getBrandNameEn, getDefaultLocale, resolvePageLocale, type SiteSettings } from "./settings";
import { cachedSiteMessages } from "./site-messages";
import { LOCALE_INFO, type Locale, type LocaleInfo } from "./locales";

/** زبان صفحه؛ همان Locale (نام قدیمی برای سازگاری) */
export type SiteLanguage = Locale;
export type Translate = <T>(value: T) => T;
export const normalizeMessage = (text: string) => text.replace(/\s+/g, " ").trim();
const own = (object: Record<string, string>, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;

/** زبان پیش‌فرض سایت. زبانِ یک صفحه را از آدرس آن بگیرید (useSiteLanguage / loader). */
export function getSiteLanguage(settings: SiteSettings): SiteLanguage {
  return getDefaultLocale(settings);
}

export function latinDigits(text: string): string {
  return text
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0x6f0 ? 0x6f0 : 0x660));
    })
    .replace(/٬/g, ",")
    .replace(/٫/g, ".")
    .replace(/٪/g, "%")
    .replace(/؟/g, "?");
}

/** ارقام و جداکننده‌های فارسی را به قالب زبان مقصد برمی‌گرداند (فارسی بدون تغییر). */
export function localizeDigits(text: string, locale: Locale): string {
  if (locale === "fa") return text;
  if (locale === "en") return latinDigits(text);
  const info = LOCALE_INFO[locale];
  return text
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0x6f0 ? 0x6f0 : 0x660));
    })
    .replace(/٬/g, info.groupSeparator)
    .replace(/٫/g, info.decimalSeparator)
    .replace(/٪/g, "%")
    .replace(/؟/g, info.dir === "rtl" ? "؟" : "?");
}

/**
 * A translator belongs to one render/request. Never store the active language globally.
 * `messages` is the dictionary of the target locale, keyed by the Persian source text
 * (see loadSiteMessages); `overrides` are the admin's translations of editor content.
 */
export function createSiteTranslator(
  language: SiteLanguage,
  messages: Record<string, string> = {},
  overrides: Record<string, string> = {},
): Translate {
  const info = LOCALE_INFO[language];
  const dictionary = { ...messages, ...overrides };
  const templates = Object.entries(dictionary)
    .filter(([key]) => /\{\d+\}/.test(key))
    .sort(([a], [b]) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length)
    .map(([key, value]) => {
      const slots: string[] = [];
      const pattern = key
        .split(/(\{\d+\})/)
        .map((part) => {
          if (/^\{\d+\}$/.test(part)) {
            slots.push(part);
            return "(.+?)";
          }
          return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("");
      return { regex: new RegExp("^" + pattern + "$"), value, slots };
    });
  const cache = new Map<string, string>();
  function text(source: string, depth = 0): string {
    if (language === "fa" || !source) return source;
    const key = normalizeMessage(source);
    const cached = cache.get(source);
    if (cached !== undefined) return cached;
    const direct = own(dictionary, key);
    let result = direct;
    if (result === undefined && depth < 5) {
      for (const template of templates) {
        const match = template.regex.exec(key);
        if (!match) continue;
        result = template.value.replace(/\{\d+\}/g, (slot) => {
          const index = template.slots.indexOf(slot);
          return index >= 0 ? text(match[index + 1] ?? "", depth + 1) : slot;
        });
        break;
      }
      // Lists assembled by joinFa keep feature visibility checks in their source language.
      if (result === undefined && /، | و /.test(key)) {
        const parts = key.split(/، | و /);
        const translated = parts.map((part) => text(part, depth + 1));
        // Arabic shares the Persian script, so there a part counts as translated when it
        // changed; for Latin-script locales no Persian letter may remain.
        const complete =
          info.dir === "rtl"
            ? translated.every(
                (part, i) =>
                  part !== localizeDigits(parts[i] ?? "", language) ||
                  !/[\u0600-\u06ff]/.test(parts[i] ?? ""),
              )
            : translated.every((part) => !/[\u0600-\u06ff]/.test(localizeDigits(part, language)));
        if (complete) {
          result =
            translated.length > 1
              ? translated.slice(0, -1).join(info.listSeparator) + info.listAnd + translated.at(-1)
              : translated[0];
        }
      }
    }
    result = localizeDigits(result ?? source, language);
    if (direct !== undefined || result !== localizeDigits(source, language)) {
      result = (source.match(/^\s+/)?.[0] ?? "") + result + (source.match(/\s+$/)?.[0] ?? "");
    }
    // ورودی‌ها می‌توانند از آدرس بیایند (مثلاً شماره صفحه در عنوان)؛ کش سقف دارد.
    if (cache.size >= 5000) cache.clear();
    cache.set(source, result);
    return result;
  }
  return function translate<T>(value: T): T {
    if (typeof value === "string") return text(value) as T;
    if (Array.isArray(value)) return value.map((item) => translate(item)) as T;
    return value;
  };
}

/** زبان، اطلاعات و مترجمِ یک صفحه */
export interface SiteI18n {
  locale: Locale;
  info: LocaleInfo;
  translate: Translate;
}

const i18nCache = new WeakMap<object, Map<string, SiteI18n>>();
const NO_MESSAGES: Record<string, string> = {};

/**
 * زبان و مترجم یک صفحه از تنظیمات و دیکشنری همان زبان. برای زبان‌های غیرفارسی نام برند
 * لاتین است. `overrides` ترجمه‌های محتوای ویرایشگر برای همین زبان است (ردیف
 * site_translations_<locale>؛ loader ریشه آن را می‌فرستد). بدون آن، فقط برای انگلیسی ترجمه‌های
 * قدیمی ذخیره‌شده در تنظیمات (localization.english) خوانده می‌شود.
 */
export function siteI18n(
  settings: SiteSettings,
  locale: Locale,
  messages: Record<string, string> = NO_MESSAGES,
  overrides?: Record<string, string>,
): SiteI18n {
  const editor =
    locale === "fa"
      ? NO_MESSAGES
      : (overrides ??
        (locale === "en" ? settings.localization?.english : undefined) ??
        NO_MESSAGES);
  const brand = settings.brand.name;
  const brandEn = getBrandNameEn(settings);
  let byOverrides = i18nCache.get(messages);
  if (!byOverrides) i18nCache.set(messages, (byOverrides = new Map()));
  const cacheKey = `${locale}\u0000${brand}\u0000${brandEn}\u0000${overridesKey(editor)}`;
  const cached = byOverrides.get(cacheKey);
  if (cached) return cached;
  const dictionary = locale === "fa" ? NO_MESSAGES : { [brand]: brandEn, ...editor };
  const i18n: SiteI18n = {
    locale,
    info: LOCALE_INFO[locale],
    translate: createSiteTranslator(locale, messages, dictionary),
  };
  // هر نسخه ذخیره‌شده از ترجمه‌ها یک کلید تازه است؛ نسخه‌های قدیمی نگه داشته نمی‌شوند.
  if (byOverrides.size >= 32) byOverrides.clear();
  byOverrides.set(cacheKey, i18n);
  return i18n;
}

/** کلید کش برای ترجمه‌های ویرایشگر؛ برای هر شیء تنظیمات فقط یک‌بار محاسبه می‌شود. */
const overridesKeys = new WeakMap<object, string>();
function overridesKey(overrides: Record<string, string>): string {
  if (overrides === NO_MESSAGES) return "";
  let key = overridesKeys.get(overrides);
  if (key === undefined) overridesKeys.set(overrides, (key = JSON.stringify(overrides)));
  return key;
}

/**
 * کش ترجمه‌های محتوای ویرایشگر هر زبان در همین فرایند (سرور یا مرورگر). loader ریشه آن را پر
 * می‌کند و head() صفحات روی سرور — که پیش از آماده شدن داده‌های route ریشه اجرا می‌شود — از
 * آن می‌خواند. ترجمه‌ها برای همه صفحات یکی است، پس کلید فقط زبان است. با هر ذخیره مدیر
 * (invalidateSiteTranslations) و پس از TTL کوتاه (برای چند نمونه سرور) کهنه حساب می‌شود.
 */
export const SITE_TRANSLATIONS_TTL_MS = 30_000;
let translationsRevision = 0;
const translationsCache = new Map<
  Locale,
  { map: Record<string, string>; at: number; revision: number }
>();

/** نسخه فعلی کش؛ پیش از خواندن ترجمه‌ها بگیرید و به primeSiteTranslations بدهید. */
export function siteTranslationsRevision(): number {
  return translationsRevision;
}

/** با ذخیره ترجمه‌ها همه ورودی‌های کش کهنه می‌شوند (ولی برای head() باقی می‌مانند). */
export function invalidateSiteTranslations(): void {
  translationsRevision++;
}

export function primeSiteTranslations(
  locale: Locale,
  map: Record<string, string>,
  revision = translationsRevision,
  now = Date.now(),
): void {
  if (locale === "fa") return;
  // همان شیء دوباره (مثلاً در هر رندر RootComponent) عمر کش را تمدید نمی‌کند.
  if (translationsCache.get(locale)?.map === map) return;
  translationsCache.set(locale, { map, at: now, revision });
}

/** ترجمه‌های تازه (کمتر از TTL و پس از آخرین ذخیره)؛ وگرنه undefined تا دوباره خوانده شود. */
export function freshSiteTranslations(
  locale: Locale,
  now = Date.now(),
): Record<string, string> | undefined {
  if (locale === "fa") return NO_MESSAGES;
  const entry = translationsCache.get(locale);
  if (!entry || entry.revision !== translationsRevision) return undefined;
  return now - entry.at < SITE_TRANSLATIONS_TTL_MS ? entry.map : undefined;
}

/** آخرین ترجمه‌های بارگذاری‌شده یک زبان، هر قدر هم کهنه (برای head() که همگام اجرا می‌شود) */
export function cachedSiteTranslations(locale: Locale): Record<string, string> | undefined {
  return locale === "fa" ? undefined : translationsCache.get(locale)?.map;
}

/** Root loader data that carries the page language (see routes/__root.tsx). */
interface RootLocaleData {
  settings: SiteSettings;
  locale: Locale;
  /** دیکشنری صریح (در تست‌ها)؛ در سایت از کش ماژول خوانده می‌شود */
  messages?: Record<string, string>;
  /** ترجمه‌های محتوای ویرایشگر برای زبان صفحه (برای فارسی وجود ندارد) */
  overrides?: Record<string, string>;
}

/**
 * زبان و مترجم صفحه داخل head() یک route. در مرورگر از داده‌های route ریشه خوانده می‌شود؛
 * روی سرور head() پیش از آماده شدن آن داده‌ها با تصویری از matchها اجرا می‌شود، پس زبان
 * از پیشوند آدرس (context.urlLocale) و تنظیمات خود صفحه، و دیکشنری از کش ساخته می‌شود.
 */
export function i18nFromMatches(
  matches: ReadonlyArray<{ routeId?: string; loaderData?: unknown }>,
  match?: { context?: unknown },
  loaderData?: unknown,
): SiteI18n | null {
  const root = matches.find((m) => m.routeId === "__root__")?.loaderData as
    RootLocaleData | undefined;
  if (root?.settings && root.locale)
    return siteI18n(
      root.settings,
      root.locale,
      root.messages ?? cachedSiteMessages(root.locale),
      root.overrides ?? cachedSiteTranslations(root.locale),
    );
  const settings = (loaderData as { settings?: SiteSettings } | undefined)?.settings;
  if (!settings) return null;
  const urlLocale = (match?.context as { urlLocale?: Locale | null } | undefined)?.urlLocale;
  const locale = resolvePageLocale(settings, urlLocale);
  return siteI18n(settings, locale, cachedSiteMessages(locale), cachedSiteTranslations(locale));
}

/** Translate schema text without changing identifiers, canonical URLs or dates. */
export function localizeStructuredData<T>(i18n: SiteI18n, data: T): T {
  const { translate, locale } = i18n;
  const textKeys = new Set(["name", "description", "headline", "text", "keywords"]);
  function visit(value: unknown, key = ""): unknown {
    if (typeof value === "string") {
      if (key === "inLanguage" && locale !== "fa") return locale === "en" ? "en-US" : locale;
      return textKeys.has(key) ? translate(value) : value;
    }
    if (Array.isArray(value)) return value.map((item) => visit(item, key));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([childKey, child]) => [childKey, visit(child, childKey)]),
      );
    return value;
  }
  return visit(data) as T;
}
