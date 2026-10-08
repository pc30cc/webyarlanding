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
