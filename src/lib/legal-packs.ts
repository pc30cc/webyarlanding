import type { Locale } from "./locales";
import type { LegalPack } from "./legal-pack";
import { LEGAL_AR } from "./legal-ar";
import { LEGAL_TR } from "./legal-tr";

/** متن صفحات حقوقی/پشتیبانی زبان‌هایی که نه فارسی‌اند نه انگلیسی؛ برای فارسی و انگلیسی null */
export function legalPack(locale: Locale): LegalPack | null {
  if (locale === "tr") return LEGAL_TR;
  if (locale === "ar") return LEGAL_AR;
  return null;
}
