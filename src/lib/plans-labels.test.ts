import { describe, expect, it } from "vitest";
import { createSiteTranslator } from "./site-i18n";
import { FEATURE_LABELS_FA, LIMIT_LABELS_FA } from "./plans";

// The pricing table on the English site shows these labels through the translator; a label
// renamed in plans.ts without a matching entry in site-translations.en.json shows in Persian.
describe("pricing labels", () => {
  const translate = createSiteTranslator("en");
  const labels = { ...FEATURE_LABELS_FA, ...LIMIT_LABELS_FA };

  for (const [key, label] of Object.entries(labels)) {
    it(`${key} has an English translation`, () => {
      expect(translate(label)).not.toMatch(/[؀-ۿ]/);
    });
  }
});
