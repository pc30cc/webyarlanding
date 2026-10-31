import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { isNoindexRobots, sameSiteCanonical } from "@/lib/seo-meta";

function site(siteUrl: string): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.brand.siteUrl = siteUrl;
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en"];
  return settings;
}

describe("sameSiteCanonical", () => {
  it("accepts only absolute URLs with the site's scheme, host and port", () => {
    const s = site("https://webyar.ai");
    expect(sameSiteCanonical(s, "https://webyar.ai/en/about-us")).toBe(
      "https://webyar.ai/en/about-us",
    );
    expect(sameSiteCanonical(s, "http://webyar.ai/en/about-us")).toBeUndefined();
    expect(sameSiteCanonical(s, "https://www.webyar.ai/en/about-us")).toBeUndefined();
    expect(sameSiteCanonical(s, "https://webyar.ai:8443/en")).toBeUndefined();
    expect(sameSiteCanonical(s, "/en/about-us")).toBeUndefined();
    expect(sameSiteCanonical(site(""), "https://webyar.ai/en/about-us")).toBeUndefined();
  });
});

describe("isNoindexRobots", () => {
  it("treats noindex and none as noindex", () => {
    for (const robots of [
      "noindex, follow",
      "NOINDEX",
      "noindex,nofollow",
      "none",
      "googlebot: noindex",
    ])
      expect(isNoindexRobots(robots)).toBe(true);
    for (const robots of ["index, follow", "", null, "nofollow"])
      expect(isNoindexRobots(robots)).toBe(false);
  });
});
