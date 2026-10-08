/**
 * Feature gating for editor-managed content. Video/voice calls and AI are shown only
 * when the admin enables them (settings.videoCall / settings.aiMarketing). Template
 * copy declares its own requirements; database text (catalog, apps, plans) is matched
 * by keyword in both the Persian source and its English translation.
 */
import { AI_KEYWORDS, CALL_KEYWORDS } from "@/lib/settings";

const CALL_EN =
  /\b(video|voice|audio)[ -]?calls?\b|\bcall (center|centre|queue|recording|callbacks?)\b|\bcallback requests?\b|\bscreen[ -]?shar/i;
const AI_EN =
  /\bAI\b|\bartificial intelligence\b|\bAI[ -]agents?\b|\bsmart assistant\b|\bchatbots?\b/i;

export type FeatureNeed = "call" | "ai";

export function mentionsCall(...texts: (string | undefined | null)[]): boolean {
  return texts.some(
    (text) =>
      !!text &&
      (CALL_KEYWORDS.some((keyword) => text.includes(keyword)) ||
        CALL_EN.test(text)),
  );
}

export function mentionsAi(...texts: (string | undefined | null)[]): boolean {
  return texts.some(
    (text) =>
      !!text &&
      (AI_KEYWORDS.some((keyword) => text.includes(keyword)) ||
        AI_EN.test(text)),
  );
}

/** True when the text is allowed under the current call/AI switches. */
export function isAllowedText(
  flags: { callEnabled: boolean; aiEnabled: boolean },
  ...texts: (string | undefined | null)[]
): boolean {
  if (!flags.callEnabled && mentionsCall(...texts)) return false;
  if (!flags.aiEnabled && mentionsAi(...texts)) return false;
  return true;
}

/** Keeps template copy items whose `needs` are all enabled. */
export function allowed<T extends { needs?: FeatureNeed | undefined }>(
  items: readonly T[],
  flags: { callEnabled: boolean; aiEnabled: boolean },
): T[] {
  return items.filter(
    (item) =>
      !item.needs ||
      (item.needs === "call" ? flags.callEnabled : flags.aiEnabled),
  );
}
