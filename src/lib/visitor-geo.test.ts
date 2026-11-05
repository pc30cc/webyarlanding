import { describe, expect, it } from "vitest";
import { isForeignVisitor } from "./visitor-geo.functions";

const browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36";

describe("isForeignVisitor", () => {
  it("is true only for a known non-Iranian country", () => {
    expect(isForeignVisitor("DE", browser)).toBe(true);
    expect(isForeignVisitor("us", browser)).toBe(true);
    expect(isForeignVisitor("IR", browser)).toBe(false);
    expect(isForeignVisitor("ir", browser)).toBe(false);
    for (const unknown of [null, undefined, "", "XX", "T1", "EU1"])
      expect(isForeignVisitor(unknown, browser)).toBe(false);
  });

  it("keeps crawlers on the page currency", () => {
    expect(isForeignVisitor("US", "Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(false);
    expect(isForeignVisitor("US", "facebookexternalhit/1.1")).toBe(false);
  });
});
