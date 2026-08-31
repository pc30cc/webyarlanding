import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const visitSchema = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().min(1).max(500),
});

/** ثبت یک بازدید صفحه — بدون نیاز به ورود، توسط مرورگر بازدیدکننده فراخوانی می‌شود */
export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => visitSchema.parse(input))
  .handler(async ({ data }) => {
    const { recordVisit } = await import("./analytics.server");
    try {
      await recordVisit(data.sessionId, data.path);
    } catch {
      // ثبت آمار بازدید هرگز نباید تجربه‌ی بازدیدکننده را مختل کند
    }
    return { ok: true };
  });

/** ضربان حضور برای شمارش «آنلاین الان» — هر چند ده ثانیه از مرورگر بازدیدکننده فراخوانی می‌شود */
export const pingVisitor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => visitSchema.parse(input))
  .handler(async ({ data }) => {
    const { pingPresence } = await import("./analytics.server");
    try {
      await pingPresence(data.sessionId, data.path);
    } catch {
      // نادیده گرفتن خطا — این فقط یک ضربان حضور است
    }
    return { ok: true };
  });

/** آمار بازدید سایت برای داشبورد ادمین */
export const adminGetVisitStats = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { getVisitStats } = await import("./analytics.server");
  return await getVisitStats();
});
