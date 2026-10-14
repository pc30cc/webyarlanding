/**
 * The English site (respok.app) is built from this same codebase. In that build nothing
 * sent to the browser may name the Persian brand: the client bundle is rewritten at build
 * time (vite.config.ts), and HTML and public settings are rewritten at request time, all
 * with scrubBrandText so the two always agree (hydration, translation keys).
 *
 * The legacy names are assembled from character codes so the build-time rewrite never
 * touches these rules themselves.
 */

declare const __RESPOK_BUILD__: boolean | undefined;

/** True only in the respok.app build (see vite.config.ts). */
export const RESPOK_BUILD: boolean =
  typeof __RESPOK_BUILD__ !== "undefined" && __RESPOK_BUILD__ === true;

const chars = (...codes: number[]) => String.fromCharCode(...codes);

const LATIN = chars(119, 101, 98, 121, 97, 114);
const PERSIAN = [chars(0x648, 0x628), chars(0x6cc, 0x627, 0x631)] as const;
const PERSIAN_REPLACEMENT = chars(0x631, 0x633, 0x67e, 0x627, 0x6a9);

/** The Persian site's English name, for comparisons that must read the same in every build. */
export const LEGACY_BRAND_EN = LATIN[0]!.toUpperCase() + LATIN.slice(1);

/** Slug prefix the English site used for its apps before they were renamed. */
export const LEGACY_SLUG_PREFIX = `${LATIN}-`;

const RULES: [RegExp, string][] = [
  // Domains first, so addresses point at the English site rather than a made-up one.
  [new RegExp(`\\b${LATIN}\\.(?:ai|app)\\b`, "gi"), "respok.app"],
  [new RegExp(`/${LATIN}-logo\\.png`, "g"), "/respok/open/apple-touch-icon.png"],
  [new RegExp(LATIN.toUpperCase(), "g"), "RESPOK"],
  [new RegExp(LATIN[0]!.toUpperCase() + LATIN.slice(1), "g"), "Respok"],
  [new RegExp(LATIN, "gi"), "respok"],
  // Persian name, written with a zero-width non-joiner (raw or escaped), a space or nothing.
  [new RegExp(`${PERSIAN[0]}(?:\\u200c|\\\\u200[cC]| )?${PERSIAN[1]}`, "g"), PERSIAN_REPLACEMENT],
];

/** Replaces every form of the Persian brand's name. Deterministic and idempotent. */
export function scrubBrandText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of RULES) result = result.replace(pattern, replacement);
  return result;
}

/** scrubBrandText applied to every string (and object key) inside a JSON-like value. */
export function scrubBrandDeep<T>(value: T): T {
  if (typeof value === "string") return scrubBrandText(value) as T;
  if (Array.isArray(value)) return value.map((item) => scrubBrandDeep(item)) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [scrubBrandText(key), scrubBrandDeep(child)]),
    ) as T;
  return value;
}

/** In the respok.app build only: brand-free text for the browser. Elsewhere unchanged. */
export function brandSafe<T>(value: T): T {
  return RESPOK_BUILD ? scrubBrandDeep(value) : value;
}
