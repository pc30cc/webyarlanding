import { useRespok } from "../shared/context";

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
