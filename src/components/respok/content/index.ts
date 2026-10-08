/**
 * English copy for the Respok templates. Both templates render the same words, so every
 * claim lives here once. Items marked `needs: "call"` / `needs: "ai"` are shown only when
 * the admin enables video calls / AI marketing (settings.videoCall / settings.aiMarketing).
 */
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { useRespok } from "../shared/context";
import type { FeatureNeed } from "../shared/gating";

export type { FeatureNeed };

export interface ContentFlags {
  callEnabled: boolean;
  aiEnabled: boolean;
  brand: string;
}

export interface FeatureCopy {
  title: string;
  body: string;
  icon?: LucideIcon;
  needs?: FeatureNeed;
}

export interface FaqCopy {
  q: string;
  a: string;
  needs?: FeatureNeed;
}

/** Joins a list as "a, b and c". */
export function joinEn(items: (string | false | null | undefined)[]): string {
  const list = items.filter((item): item is string => !!item);
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
}

/** Keeps items whose feature switch is on. */
export function gate<T extends { needs?: FeatureNeed | undefined }>(
  items: readonly T[],
  flags: Pick<ContentFlags, "callEnabled" | "aiEnabled">,
): T[] {
  return items.filter(
    (item) =>
      !item.needs ||
      (item.needs === "call" ? flags.callEnabled : flags.aiEnabled),
  );
}

/** Resolves a content builder for the current switches and brand. */
export function useContent<T>(build: (flags: ContentFlags) => T): T {
  const { callEnabled, aiEnabled, brand } = useRespok();
  return useMemo(
    () => build({ callEnabled, aiEnabled, brand }),
    [build, callEnabled, aiEnabled, brand],
  );
}
