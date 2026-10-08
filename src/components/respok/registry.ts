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

const importers: Record<
  EnglishTemplate,
  () => Promise<{ default: RespokTemplateModule }>
> = {
  open: () => import("./open"),
  thread: () => import("./thread"),
};

const loaded: Partial<Record<EnglishTemplate, RespokTemplateModule>> = {};
const pending: Partial<Record<EnglishTemplate, Promise<RespokTemplateModule>>> =
  {};

export function loadRespokTemplate(
  template: EnglishTemplate,
): Promise<RespokTemplateModule> {
  const ready = loaded[template];
  if (ready) return Promise.resolve(ready);
  let promise = pending[template];
  if (!promise) {
    promise = importers[template]().then((module) => {
      loaded[template] = module.default;
      return module.default;
    });
    // A failed chunk download must be retryable on the next navigation.
    promise.catch(() => {
      delete pending[template];
    });
    pending[template] = promise;
  }
  return promise;
}

/** Renders synchronously once loaded; otherwise suspends until the chunk arrives. */
export function useRespokTemplate(
  template: EnglishTemplate,
): RespokTemplateModule {
  return loaded[template] ?? use(loadRespokTemplate(template));
}
