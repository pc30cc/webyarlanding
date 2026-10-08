import englishMessages from "./site-translations.en.json";
import { getEnglishBrandName, type SiteSettings } from "./settings";

export type SiteLanguage = "fa" | "en";
export const normalizeMessage = (text: string) =>
  text.replace(/\s+/g, " ").trim();
const messages: Record<string, string> = englishMessages;
const own = (object: Record<string, string>, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;

export function getSiteLanguage(settings: SiteSettings): SiteLanguage {
  return settings.localization?.language === "en" ? "en" : "fa";
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

/** A translator belongs to one render/request. Never store the active language globally. */
export function createSiteTranslator(
  language: SiteLanguage,
  overrides: Record<string, string> = {},
  /** English brand that replaces the legacy "Webyar" name in translated text. */
  brand?: string,
) {
  const rebrand =
    brand && brand !== "Webyar"
      ? (text: string) => text.replace(/\bWebyar\b/g, brand)
      : (text: string) => text;
  const dictionary = { ...messages, ...overrides };
  const templates = Object.entries(dictionary)
    .filter(([key]) => /\{\d+\}/.test(key))
    .sort(
      ([a], [b]) =>
        b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length,
    )
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
    if (language !== "en" || !source) return source;
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
        if (
          translated.every((part) => !/[\u0600-\u06ff]/.test(latinDigits(part)))
        ) {
          result =
            translated.length > 1
              ? translated.slice(0, -1).join(", ") + " and " + translated.at(-1)
              : translated[0];
        }
      }
    }
    result = rebrand(latinDigits(result ?? source));
    if (direct !== undefined || result !== latinDigits(source)) {
      result =
        (source.match(/^\s+/)?.[0] ?? "") +
        result +
        (source.match(/\s+$/)?.[0] ?? "");
    }
    cache.set(source, result);
    return result;
  }
  return function translate<T>(value: T): T {
    if (typeof value === "string") return text(value) as T;
    if (Array.isArray(value)) return value.map((item) => translate(item)) as T;
    return value;
  };
}

export function translatorForSettings(settings: SiteSettings) {
  const brand = getEnglishBrandName(settings);
  return createSiteTranslator(
    getSiteLanguage(settings),
    {
      [settings.brand.name]: brand,
      ...settings.localization?.english,
    },
    brand,
  );
}

/** Translate schema text without changing identifiers, canonical URLs or dates. */
export function localizeStructuredData<T>(settings: SiteSettings, data: T): T {
  const translate = translatorForSettings(settings);
  const textKeys = new Set([
    "name",
    "description",
    "headline",
    "text",
    "keywords",
  ]);
  function visit(value: unknown, key = ""): unknown {
    if (typeof value === "string") {
      if (key === "inLanguage" && getSiteLanguage(settings) === "en")
        return "en-US";
      return textKeys.has(key) ? translate(value) : value;
    }
    if (Array.isArray(value)) return value.map((item) => visit(item, key));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([childKey, child]) => [
          childKey,
          visit(child, childKey),
        ]),
      );
    return value;
  }
  return visit(data) as T;
}
