import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

vi.mock("./settings.server", () => ({
  loadSettings: async () => DEFAULT_SETTINGS,
}));

import { loadRemotePlans } from "./plans.server";

afterEach(() => vi.unstubAllGlobals());

describe("plans synced from the app", () => {
  it("lists only real features, converts USD cents and keeps the billing currency", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          plans: [
            {
              slug: "pro",
              name: "Pro",
              sort_order: 1,
              default_currency: "irr",
              prices: {
                IRR: { monthly: 15_000_000, yearly: 150_000_000 },
                USD: { monthly: 2900, yearly: 29000 },
              },
              // Keys the app registry treats as no-ops must never be advertised.
              entitlements: {
                sso: true,
                api_access: true,
                email_campaigns: true,
                ai_assistant: true,
                voice_video: true,
                knowledge_base: false,
              },
              limits: { max_agents: 10, data_retention_days: 90, ai_credits_per_month: 5000 },
            },
          ],
        }),
      })),
    );
    const result = await loadRemotePlans();
    const plan = result?.plans[0];
    expect(plan?.monthly).toBe(1_500_000);
    expect(plan?.usdMonthly).toBe(29);
    expect(plan?.usdYearly).toBe(290);
    expect(plan?.defaultCurrency).toBe("IRR");
    expect(plan?.features).toContain("دستیار هوش مصنوعی");
    expect(plan?.features).toContain("تماس صوتی و تصویری");
    // Absent keys use the app's defaults: the chat widget and contacts are on.
    expect(plan?.features).toContain("ابزارک چت سایت");
    expect(plan?.features).toContain("مدیریت مخاطبین");
    // Explicitly off stays off.
    expect(plan?.features).not.toContain("پایگاه دانش");
    for (const label of ["ورود یکپارچه (SSO)", "دسترسی API", "کمپین ایمیلی"])
      expect(plan?.features).not.toContain(label);
    expect(plan?.limits.map((l) => l.label)).toEqual(["تعداد اپراتور"]);
    expect(result?.comparison.rows.some((row) => row.label === "دسترسی API")).toBe(false);
  });
});
