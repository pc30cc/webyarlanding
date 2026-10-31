import type { Locale } from "./locales";

/** URLs and code are identifiers, not translatable prose. */
function proseOf(text: string): string {
  return text
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, "")
    .replace(/\x60[^\x60]*\x60/g, "");
}

const ARABIC_SCRIPT = /[\u0600-\u06ff]/;
/** حروفی که فقط در فارسی هستند و در عربی نیستند: پ چ ژ گ ک ی */
const PERSIAN_ONLY_LETTERS = /[\u067e\u0686\u0698\u06af\u06a9\u06cc]/;

export function containsPersianProse(text: string): boolean {
  return ARABIC_SCRIPT.test(proseOf(text));
}

/** برای مقایسه متن ترجمه با متن مبدأ: ارقام فارسی/عربی لاتین و فاصله‌ها یکسان می‌شوند. */
function comparable(text: string): string {
  return proseOf(text)
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0x6f0 ? 0x6f0 : 0x660));
    })
    .replace(/[\s\u200c]+/g, " ")
    .trim();
}

/**
 * آیا ترجمه یک متن به زبان مقصد هنوز فارسی (ترجمه‌نشده) است؟ در زبان‌های لاتین (انگلیسی،
 * ترکی) هیچ حرف فارسی/عربی نباید بماند. عربی با فارسی هم‌خط است، پس آنجا متنی ترجمه‌نشده
 * است که حروف مخصوص فارسی داشته باشد یا با متن فارسی مبدأ یکی باشد.
 */
export function isUntranslated(text: string, locale: Locale, source?: string): boolean {
  if (locale === "fa") return false;
  if (locale !== "ar") return containsPersianProse(text);
  const prose = proseOf(text);
  if (PERSIAN_ONLY_LETTERS.test(prose)) return true;
  return (
    source !== undefined && ARABIC_SCRIPT.test(prose) && comparable(text) === comparable(source)
  );
}

export interface TranslationChunk {
  source: string;
  index: number;
  total: number;
  text: string;
}

/** Paragraph boundaries keep Markdown intact and bound model output size. */
export function buildTranslationBatches(
  sources: string[],
): TranslationChunk[][] {
  const chunks: TranslationChunk[] = [];
  for (const source of sources) {
    const parts: string[] = [];
    let current = "";
    for (const paragraph of source.split(/\n\s*\n/)) {
      if (paragraph.length > 12_000)
        throw new Error(
          "یک بند از متن بیش از حد طولانی است؛ آن را به بندهای کوتاه‌تر تقسیم کنید.",
        );
      const next = current ? current + "\n\n" + paragraph : paragraph;
      if (next.length > 6_000 && current) {
        parts.push(current);
        current = paragraph;
      } else current = next;
    }
    if (current) parts.push(current);
    parts.forEach((text, index) =>
      chunks.push({ source, index, total: parts.length, text }),
    );
  }
  const batches: TranslationChunk[][] = [];
  let batch: TranslationChunk[] = [];
  let length = 0;
  for (const chunk of chunks) {
    if (
      batch.length &&
      (length + chunk.text.length > 6_000 || batch.length >= 6)
    ) {
      batches.push(batch);
      batch = [];
      length = 0;
    }
    batch.push(chunk);
    length += chunk.text.length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}
