import { createServerFn } from "@tanstack/react-start";
import type { PlansComparison, PublicPlan } from "./plans";

/**
 * پلن‌های همگام‌شده با اپلیکیشن — null یعنی از پلن‌های پیش‌فرض سایت استفاده شود. قیمت تومانی
 * برای سایت فارسی و قیمت دلاری (usdMonthly/usdYearly) برای زبان‌های دیگر است.
 */
export const fetchPublicPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ plans: PublicPlan[]; comparison: PlansComparison } | null> => {
    const { loadRemotePlans } = await import("./plans.server");
    return await loadRemotePlans();
  },
);
