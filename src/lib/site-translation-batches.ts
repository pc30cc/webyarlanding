/** URLs and code are identifiers, not translatable prose. */
export function containsPersianProse(text: string): boolean {
  const prose = text
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, "")
    .replace(/\x60[^\x60]*\x60/g, "");
  return /[\u0600-\u06ff]/.test(prose);
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
