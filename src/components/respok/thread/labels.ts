import { useRespok } from "../shared/context";

const PERSIAN = /[\u0600-\u06FF]/;

function humanize(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Category names come from the database. When a name has no English translation
 * yet, its (Latin) slug is a better English label than the Persian original.
 */
export function useCategoryLabel() {
  const { t } = useRespok();
  return (name: string | null | undefined, slug: string | null | undefined, fallback: string) => {
    if (!name) return fallback;
    const translated = t(name);
    if (!PERSIAN.test(translated)) return translated;
    if (slug && !PERSIAN.test(slug) && /[a-z]/i.test(slug)) return humanize(slug);
    return translated;
  };
}

/** The Persian brand as an author is the English brand on this site. */
export function useAuthorName() {
  const { t, brand, settings } = useRespok();
  return (author: string | null | undefined) => {
    const name = (author || "").trim();
    if (!name || name === settings.brand.name?.trim()) return brand;
    return t(name);
  };
}
