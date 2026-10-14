import { describe, expect, it } from "vitest";
import { LEGACY_SLUG_PREFIX, scrubBrandDeep, scrubBrandText } from "./brand-scrub";

// The legacy names are built here the same way as in the module, so this file itself
// stays free of them too.
const latin = String.fromCharCode(119, 101, 98, 121, 97, 114);
const cap = latin[0]!.toUpperCase() + latin.slice(1);
const persian = String.fromCharCode(0x648, 0x628, 0x200c, 0x6cc, 0x627, 0x631);

describe("scrubBrandText", () => {
  it("maps domains to the English site", () => {
    expect(scrubBrandText(`support@${latin}.ai and https://app.${latin}.app/x`)).toBe(
      "support@respok.app and https://app.respok.app/x",
    );
  });

  it("replaces every casing and the Persian name", () => {
    expect(scrubBrandText(`${cap} ${latin.toUpperCase()} ${latin}_vid`)).toBe(
      "Respok RESPOK respok_vid",
    );
    expect(scrubBrandText(`درباره ${persian}`)).not.toContain(persian);
    expect(scrubBrandText(`a ${persian.replace("‌", " ")} b`)).not.toMatch(/یار/);
  });

  it("is idempotent and leaves other text alone", () => {
    const once = scrubBrandText(`${cap}'s app, ${persian}`);
    expect(scrubBrandText(once)).toBe(once);
    expect(scrubBrandText("Live chat for websites")).toBe("Live chat for websites");
  });

  it("rewrites keys and values of nested data", () => {
    expect(scrubBrandDeep({ [`${persian} x`]: [`${cap} y`], n: 1 })).toEqual({
      [scrubBrandText(`${persian} x`)]: ["Respok y"],
      n: 1,
    });
  });

  it("keeps the legacy slug prefix as data", () => {
    expect(LEGACY_SLUG_PREFIX).toBe(`${latin}-`);
  });
});
