import { useRespok } from "../shared/context";
import { isAllowedText } from "../shared/gating";

/** The Persian brand as an author is the English brand on this site. */
export function useAuthorName() {
  const { t, brand, settings } = useRespok();
  return (author: string | null | undefined) => {
    const name = (author || "").trim();
    if (!name || name === settings.brand.name?.trim()) return brand;
    return t(name);
  };
}

const PERSIAN = /[؀-ۿ]/;

/**
 * Database text through the site translation. When a string has no English
 * translation yet, the fallback is shown instead of the Persian original.
 */
export function useEnglishText() {
  const { t } = useRespok();
  return (text: string | null | undefined, fallback = ""): string => {
    const value = text ? t(text).trim() : "";
    return value && !PERSIAN.test(value) ? value : fallback;
  };
}

/**
 * Catalog / app bullet lists: hides call or AI items when those switches are off and
 * drops strings that have no English translation yet.
 */
export function useGatedList() {
  const { t, callEnabled, aiEnabled } = useRespok();
  const en = useEnglishText();
  return (items: readonly string[], limit?: number): string[] => {
    const list = items
      .filter((item) => isAllowedText({ callEnabled, aiEnabled }, item, t(item)))
      .map((item) => en(item))
      .filter(Boolean);
    return limit === undefined ? list : list.slice(0, limit);
  };
}

/** "real-estate" → "Real estate" */
export function humanizeSlug(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
