// سرور-فانکشن‌های «انتقال دیتابیس به دیتابیس» — فقط مدیر
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const connectionSchema = z.object({
  connectionString: z.string().min(10, "رشته اتصال نامعتبر است"),
});

const runSchema = connectionSchema.extend({
  includeSchema: z.boolean().default(true),
  truncateTarget: z.boolean().default(false),
});

/** تست اتصال به دیتابیس مقصد */
export const testTargetDatabase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => connectionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { isLikelyPostgresUrl, inspectTarget, describeTargetError } = await import(
      "./dbtransfer.server"
    );
    if (!isLikelyPostgresUrl(data.connectionString)) {
      throw new Error("رشته اتصال باید با postgresql:// شروع شود");
    }
    try {
      return { ok: true as const, ...(await inspectTarget(data.connectionString)) };
    } catch (err) {
      const { code, message } = describeTargetError(err);
      throw new Error(`${code} — ${message}`);
    }
  });

/** مقایسه ساختار و تعداد رکوردها بین سایت و مقصد */
export const compareTargetDatabase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => connectionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { isLikelyPostgresUrl, compareWithTarget, describeTargetError } = await import(
      "./dbtransfer.server"
    );
    if (!isLikelyPostgresUrl(data.connectionString)) {
      throw new Error("رشته اتصال باید با postgresql:// شروع شود");
    }
    try {
      return await compareWithTarget(data.connectionString);
    } catch (err) {
      const { code, message } = describeTargetError(err);
      throw new Error(`${code} — ${message}`);
    }
  });

/** اجرای انتقال کامل ساختار و داده‌ها به مقصد */
export const runDatabaseTransfer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => runSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { isLikelyPostgresUrl, runTransfer, describeTargetError } = await import(
      "./dbtransfer.server"
    );
    if (!isLikelyPostgresUrl(data.connectionString)) {
      throw new Error("رشته اتصال باید با postgresql:// شروع شود");
    }
    try {
      return await runTransfer(data);
    } catch (err) {
      const { code, message } = describeTargetError(err);
      throw new Error(`${code} — ${message}`);
    }
  });
