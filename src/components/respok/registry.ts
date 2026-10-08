/**
 * Lazy loading of the English templates. Each template is its own chunk, so Persian
 * visitors never download English template code, and English visitors download only
 * the active template. The root loader preloads the active template before the first
 * render (server and client navigation), so pages render synchronously; if a chunk is
 * not loaded yet (e.g. during hydration) the page suspends and keeps the server HTML.
 */
import { use } from "react";
import type { EnglishTemplate } from "@/lib/settings";
import type { RespokTemplateModule } from "./types";

const importers: Record<EnglishTemplate, () => Promise<{ default: RespokTemplateModule }>> = {
  open: () => import("./open"),
  thread: () => import("./thread"),
};

/** A promise React's use() can read synchronously once it has settled. */
type TrackedPromise = Promise<RespokTemplateModule> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: RespokTemplateModule;
  reason?: unknown;
};

const promises: Partial<Record<EnglishTemplate, TrackedPromise>> = {};

export function loadRespokTemplate(template: EnglishTemplate): Promise<RespokTemplateModule> {
  let promise = promises[template];
  if (!promise) {
    const tracked: TrackedPromise = importers[template]().then(
      (module) => {
        tracked.status = "fulfilled";
        tracked.value = module.default;
        return module.default;
      },
      (error: unknown) => {
        tracked.status = "rejected";
        tracked.reason = error;
        // A failed chunk download must be retryable on the next navigation.
        delete promises[template];
        throw error;
      },
    );
    tracked.status = "pending";
    promise = tracked;
    promises[template] = promise;
  }
  return promise;
}

/**
 * Always reads the same promise with use(): synchronous once the chunk has loaded
 * (React sees status "fulfilled"), suspends until then.
 */
export function useRespokTemplate(template: EnglishTemplate): RespokTemplateModule {
  return use(loadRespokTemplate(template));
}
