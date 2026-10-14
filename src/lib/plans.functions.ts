import { createServerFn } from "@tanstack/react-start";
import { brandSafe } from "./brand-scrub";
import type { PlansComparison, PublicPlan } from "./plans";

/** پلن‌های همگام‌شده با اپلیکیشن — null یعنی از پلن‌های پیش‌فرض سایت استفاده شود */
export const fetchPublicPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ plans: PublicPlan[]; comparison: PlansComparison } | null> => {
    const { loadRemotePlans } = await import("./plans.server");
    return brandSafe(await loadRemotePlans());
  },
);
