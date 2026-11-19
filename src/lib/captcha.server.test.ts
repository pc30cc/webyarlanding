// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let store: Record<string, unknown> = {};
vi.mock("./settings.server", () => ({
  loadPrivateSettings: async (fallback: object) => ({ ...fallback, ...store }),
  savePrivateSettings: async (value: Record<string, unknown>) => {
    store = { ...value };
  },
}));

import {
  __resetCaptchaForTests,
  generateCaptcha,
  normalizeDigits,
  verifyCaptcha,
} from "./captcha.server";

function answerOf(question: string): number {
  const [a, op, b] = normalizeDigits(question).split(" ");
  return op === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
}

function decode(token: string): string[] {
  return Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString().split(".");
}

beforeEach(() => {
  store = {};
  __resetCaptchaForTests();
});
afterEach(() => vi.useRealTimers());

describe("math captcha", () => {
  it("never puts the answer in the token", async () => {
    for (let i = 0; i < 20; i += 1) {
      const { token, question } = await generateCaptcha();
      const parts = decode(token);
      expect(parts).toHaveLength(5);
      expect(parts).not.toContain(String(answerOf(question)));
    }
  });

  it("accepts the right answer once", async () => {
    const { token, question } = await generateCaptcha();
    const answer = String(answerOf(question));
    expect(await verifyCaptcha(token, answer)).toBe(true);
    expect(await verifyCaptcha(token, answer)).toBe(false);
  });

  it("spends the token on a wrong answer", async () => {
    const { token, question } = await generateCaptcha();
    const answer = answerOf(question);
    expect(await verifyCaptcha(token, String(answer + 1))).toBe(false);
    expect(await verifyCaptcha(token, String(answer))).toBe(false);
  });

  it("reads Persian digits", async () => {
    const { token, question } = await generateCaptcha();
    const persian = String(answerOf(question)).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
    expect(await verifyCaptcha(token, ` ${persian} `)).toBe(true);
  });

  it("refuses an edited token without spending the real one", async () => {
    const { token, question } = await generateCaptcha();
    const answer = String(answerOf(question));
    const parts = decode(token);
    parts[2] = String(Number(parts[2]) - 1000);
    expect(await verifyCaptcha(Buffer.from(parts.join(".")).toString("base64"), answer)).toBe(
      false,
    );
    expect(await verifyCaptcha(token, answer)).toBe(true);
  });

  it("refuses expired and old-format tokens", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { token, question } = await generateCaptcha();
    vi.setSystemTime(Date.now() + 6 * 60_000);
    expect(await verifyCaptcha(token, String(answerOf(question)))).toBe(false);
    const old = Buffer.from(`7.${Date.now() + 60_000}.abc`).toString("base64");
    expect(await verifyCaptcha(old, "7")).toBe(false);
    expect(await verifyCaptcha("%%%", "1")).toBe(false);
  });
});
