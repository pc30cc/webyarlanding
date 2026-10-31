import { describe, expect, it } from "vitest";
import schemaSql from "../../db/schema.sql?raw";

// db/schema.sql در هر بالا آمدن سرور یک‌جا اجرا می‌شود (ensureSchema)؛ هر دستور آن باید
// وقتی کارش قبلاً انجام شده، قفلی که خواندن‌ها را نگه دارد نگیرد.
const DO_BLOCK = /DO \$\$[\s\S]*?\$\$;/g;

/** متن اسکیما بدون توضیح‌ها و بدون بلوک‌های DO (که شرطی اجرا می‌شوند) */
function unconditionalSql(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(DO_BLOCK, "");
}

describe("db/schema.sql", () => {
  it("has no unconditional ALTER TABLE (ACCESS EXCLUSIVE lock on every boot)", () => {
    expect(unconditionalSql(schemaSql)).not.toMatch(/\bALTER\s+TABLE\b/i);
  });

  it("adds seo_pages.locale only when the column is missing, with a bounded lock wait", () => {
    const block = schemaSql.match(DO_BLOCK)?.find((sql) => /seo_pages ADD COLUMN/i.test(sql));
    expect(block).toBeDefined();
    expect(block).toMatch(
      /IF NOT EXISTS \(\s*SELECT 1 FROM information_schema\.columns\s+WHERE table_schema = 'public' AND table_name = 'seo_pages' AND column_name = 'locale'\s*\) THEN/,
    );
    expect(block).toMatch(/set_config\('lock_timeout', '3s', true\)/);
    // اگر جدول مشغول باشد خطا در همین بلوک گرفته می‌شود و بقیه اسکیما اجرا می‌شود
    expect(block).toMatch(/EXCEPTION WHEN lock_not_available THEN/);
    // lock_timeout برای دستورهای بعدی همان تراکنش برمی‌گردد
    expect(block).toMatch(/set_config\('lock_timeout', previous_lock_timeout, true\)/);
  });
});
