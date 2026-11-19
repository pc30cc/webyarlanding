// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  edgeIp,
  isCloudflareIp,
  normalizeIp,
  resolveClientIp,
  resolveCloudflareCountry,
  type ForwardingFacts,
} from "./client-ip.server";

const facts = (
  peer: string | undefined,
  xForwardedFor?: string,
  cfConnectingIp?: string,
  cfIpCountry?: string,
): ForwardingFacts => ({ peer, xForwardedFor, cfConnectingIp, cfIpCountry });

afterEach(() => {
  delete process.env["CLOUDFLARE_IPS"];
});

describe("client IP behind Traefik and Cloudflare", () => {
  it("takes the entry our proxy appended, not the one the visitor wrote", () => {
    expect(resolveClientIp(facts("10.0.1.5", "1.2.3.4, 93.184.216.34"))).toBe("93.184.216.34");
    expect(resolveClientIp(facts("172.18.0.3", "93.184.216.34, 10.0.0.2"))).toBe("93.184.216.34");
  });

  it("believes cf-connecting-ip only when the edge is Cloudflare", () => {
    expect(resolveClientIp(facts("10.0.1.5", "162.158.1.1", "81.12.3.4"))).toBe("81.12.3.4");
    expect(resolveClientIp(facts("::ffff:10.0.1.5", "1.1.1.1, 2606:4700::1", "81.12.3.4"))).toBe(
      "81.12.3.4",
    );
    expect(resolveClientIp(facts("10.0.1.5", "93.184.216.34", "81.12.3.4"))).toBe("93.184.216.34");
  });

  it("treats a public peer as the visitor and ignores its headers", () => {
    expect(resolveClientIp(facts("93.184.216.34", "8.8.8.8", "81.12.3.4"))).toBe("93.184.216.34");
  });

  it("falls back to the socket (local runs) and stops at an unreadable entry", () => {
    expect(resolveClientIp(facts("127.0.0.1"))).toBe("127.0.0.1");
    expect(resolveClientIp(facts(undefined))).toBe("");
    expect(resolveClientIp(facts(undefined, "6.6.6.6, 93.184.216.34"))).toBe("93.184.216.34");
    expect(edgeIp(facts("10.0.0.1", "93.184.216.34, garbage"))).toBeNull();
  });

  it("normalizes ports, brackets and IPv4-mapped addresses", () => {
    expect(normalizeIp("[2606:4700::1]:443")).toBe("2606:4700::1");
    expect(normalizeIp("1.2.3.4:5678")).toBe("1.2.3.4");
    expect(normalizeIp("::ffff:5db8:d822")).toBe("93.184.216.34");
    expect(normalizeIp("unknown")).toBeNull();
  });
});

describe("visitor country", () => {
  it("is read from cf-ipcountry only behind Cloudflare", () => {
    expect(resolveCloudflareCountry(facts("10.0.1.5", "162.158.1.1", "81.12.3.4", "de"))).toBe(
      "DE",
    );
    expect(
      resolveCloudflareCountry(facts("10.0.1.5", "93.184.216.34", undefined, "DE")),
    ).toBeNull();
    expect(resolveCloudflareCountry(facts("93.184.216.34", undefined, undefined, "DE"))).toBeNull();
  });

  it("drops Cloudflare's unknown and Tor codes", () => {
    expect(resolveCloudflareCountry(facts("10.0.1.5", "162.158.1.1", undefined, "XX"))).toBeNull();
    expect(resolveCloudflareCountry(facts("10.0.1.5", "162.158.1.1", undefined, "T1"))).toBeNull();
  });

  it("follows CLOUDFLARE_IPS", () => {
    process.env["CLOUDFLARE_IPS"] = "off";
    expect(resolveCloudflareCountry(facts("10.0.1.5", "162.158.1.1", undefined, "DE"))).toBeNull();
    process.env["CLOUDFLARE_IPS"] = "default,93.184.216.0/24";
    expect(isCloudflareIp("93.184.216.34")).toBe(true);
    expect(isCloudflareIp("162.158.1.1")).toBe(true);
  });
});
