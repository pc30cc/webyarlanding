// نسخه‌پشتیبان‌گیری کامل پایگاه‌داده — فقط برای مدیران. خروجی JSON و SQL قابل‌حمل (سازگار با PostgreSQL و MySQL/phpMyAdmin).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ColumnDef {
  name: string;
  type: "TEXT" | "VARCHAR" | "INT" | "SMALLINT" | "BIGINT" | "TIMESTAMP";
  length?: number;
}

export interface TableDef {
  name: string;
  pk: string;
  /** کلید اصلی مرکب (در صورت وجود) — اولویت با این فهرست است */
  pkColumns?: string[];
  columns: ColumnDef[];
}

// ترتیب جدول‌ها بر اساس وابستگی کلید خارجی (والد قبل از فرزند) — برای درج امن.
export const TABLES: TableDef[] = [
  {
    name: "users",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "email", type: "VARCHAR", length: 191 },
      { name: "password_hash", type: "VARCHAR", length: 255 },
      { name: "display_name", type: "VARCHAR", length: 191 },
      { name: "role", type: "VARCHAR", length: 20 },
      { name: "is_active", type: "SMALLINT" },
      { name: "last_login_at", type: "TIMESTAMP" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "settings",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "setting_key", type: "VARCHAR", length: 120 },
      { name: "setting_value", type: "TEXT" },
      { name: "is_private", type: "SMALLINT" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "catalog_categories",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "type", type: "VARCHAR", length: 16 },
      { name: "name", type: "VARCHAR", length: 160 },
      { name: "sort_order", type: "INT" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "catalog_items",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "type", type: "VARCHAR", length: 16 },
      { name: "category_id", type: "VARCHAR", length: 36 },
      { name: "slug", type: "VARCHAR", length: 120 },
      { name: "icon", type: "VARCHAR", length: 60 },
      { name: "title", type: "VARCHAR", length: 200 },
      { name: "short_desc", type: "TEXT" },
      { name: "description", type: "TEXT" },
      { name: "bullets_json", type: "TEXT" },
      { name: "sort_order", type: "INT" },
      { name: "published", type: "SMALLINT" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "blog_categories",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "slug", type: "VARCHAR", length: 191 },
      { name: "name", type: "VARCHAR", length: 191 },
      { name: "description", type: "TEXT" },
      { name: "parent_id", type: "VARCHAR", length: 36 },
      { name: "sort_order", type: "INT" },
      { name: "seo_title", type: "VARCHAR", length: 255 },
      { name: "seo_description", type: "VARCHAR", length: 500 },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "blog_tags",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "slug", type: "VARCHAR", length: 191 },
      { name: "name", type: "VARCHAR", length: 191 },
      { name: "description", type: "TEXT" },
      { name: "seo_title", type: "VARCHAR", length: 255 },
      { name: "seo_description", type: "VARCHAR", length: 500 },
      { name: "sort_order", type: "INT" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "blog_posts",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "slug", type: "VARCHAR", length: 191 },
      { name: "title", type: "VARCHAR", length: 255 },
      { name: "excerpt", type: "TEXT" },
      { name: "content", type: "TEXT" },
      { name: "cover_image", type: "VARCHAR", length: 500 },
      { name: "status", type: "VARCHAR", length: 20 },
      { name: "author", type: "VARCHAR", length: 191 },
      { name: "tags_csv", type: "TEXT" },
      { name: "category_id", type: "VARCHAR", length: 36 },
      { name: "indexable", type: "SMALLINT" },
      { name: "seo_title", type: "VARCHAR", length: 255 },
      { name: "seo_description", type: "VARCHAR", length: 500 },
      { name: "canonical_url", type: "VARCHAR", length: 500 },
      { name: "robots", type: "VARCHAR", length: 60 },
      { name: "focus_keyword", type: "VARCHAR", length: 191 },
      { name: "published_at", type: "TIMESTAMP" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "blog_post_tags",
    pk: "post_id",
    pkColumns: ["post_id", "tag_id"],
    columns: [
      { name: "post_id", type: "VARCHAR", length: 36 },
      { name: "tag_id", type: "VARCHAR", length: 36 },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "media_assets",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "provider", type: "VARCHAR", length: 40 },
      { name: "path", type: "VARCHAR", length: 500 },
      { name: "url", type: "VARCHAR", length: 1000 },
      { name: "filename", type: "VARCHAR", length: 255 },
      { name: "mime_type", type: "VARCHAR", length: 120 },
      { name: "size_bytes", type: "BIGINT" },
      { name: "width", type: "INT" },
      { name: "height", type: "INT" },
      { name: "alt", type: "VARCHAR", length: 500 },
      { name: "uploaded_by", type: "VARCHAR", length: 36 },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "seo_pages",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "page_key", type: "VARCHAR", length: 120 },
      { name: "path", type: "VARCHAR", length: 255 },
      { name: "title", type: "VARCHAR", length: 255 },
      { name: "description", type: "VARCHAR", length: 500 },
      { name: "og_image", type: "VARCHAR", length: 1000 },
      { name: "robots", type: "VARCHAR", length: 60 },
      { name: "canonical_url", type: "VARCHAR", length: 500 },
      { name: "schema_json", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "autoblog_settings",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "enabled", type: "SMALLINT" },
      { name: "posts_per_day", type: "INT" },
      { name: "run_hours", type: "VARCHAR", length: 120 },
      { name: "with_image", type: "SMALLINT" },
      { name: "master_prompt", type: "TEXT" },
      { name: "topic_pool", type: "TEXT" },
      { name: "category_id", type: "VARCHAR", length: 36 },
      { name: "author", type: "VARCHAR", length: 191 },
      { name: "publish_status", type: "VARCHAR", length: 20 },
      { name: "last_run_at", type: "TIMESTAMP" },
      { name: "next_topic_seed", type: "INT" },
      { name: "total_generated", type: "INT" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "autoblog_runs",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "trigger_source", type: "VARCHAR", length: 40 },
      { name: "status", type: "VARCHAR", length: 20 },
      { name: "posts_requested", type: "INT" },
      { name: "posts_created", type: "INT" },
      { name: "post_ids", type: "TEXT" },
      { name: "error", type: "TEXT" },
      { name: "details", type: "TEXT" },
      { name: "started_at", type: "TIMESTAMP" },
      { name: "finished_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "contact_messages",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "name", type: "VARCHAR", length: 191 },
      { name: "email", type: "VARCHAR", length: 191 },
      { name: "phone", type: "VARCHAR", length: 60 },
      { name: "subject", type: "VARCHAR", length: 255 },
      { name: "message", type: "TEXT" },
      { name: "status", type: "VARCHAR", length: 20 },
      { name: "ip_address", type: "VARCHAR", length: 64 },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "user_sessions",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "user_id", type: "VARCHAR", length: 36 },
      { name: "token_hash", type: "VARCHAR", length: 128 },
      { name: "expires_at", type: "TIMESTAMP" },
      { name: "ip_address", type: "VARCHAR", length: 64 },
      { name: "user_agent", type: "VARCHAR", length: 500 },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    name: "login_attempts",
    pk: "id",
    columns: [
      { name: "id", type: "VARCHAR", length: 36 },
      { name: "email", type: "VARCHAR", length: 191 },
      { name: "success", type: "SMALLINT" },
      { name: "reason", type: "VARCHAR", length: 191 },
      { name: "ip_address", type: "VARCHAR", length: 64 },
      { name: "user_agent", type: "VARCHAR", length: 500 },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
];

function columnSql(col: ColumnDef): string {
  switch (col.type) {
    case "VARCHAR":
      return `VARCHAR(${col.length ?? 191})`;
    case "TEXT":
      return "TEXT";
    case "INT":
      return "INT";
    case "SMALLINT":
      return "SMALLINT";
    case "BIGINT":
      return "BIGINT";
    case "TIMESTAMP":
      return "TIMESTAMP";
  }
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const str = String(value).replace(/\\/g, "\\\\").replace(/'/g, "''");
  return `'${str}'`;
}

/** کلاینت Supabase عمومی — هم دیتابیس خودِ سایت (db) و هم دیتابیس مقصد از همین شکل هستند */
type SupabaseLike = { from: (table: string) => any };

async function buildTableExport(
  table: TableDef,
  client?: SupabaseLike,
): Promise<Record<string, unknown>[]> {
  const source = client ?? (await import("./db.server")).db;
  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await source
      .from(table.name as any)
      .select("*")
      .range(from, from + pageSize - 1);
    // کلاینت Supabase روی خطاهای API (RLS، جدول ناموجود، کلید نامعتبر و...) throw نمی‌کند —
    // فقط error برمی‌گرداند؛ اگر این‌جا نادیده گرفته شود، خواندن ساکت با آرایه خالی جایگزین می‌شود.
    if (error) throw new Error(`${table.name}: ${error.message}`);
    const chunk = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function buildSqlDump(
  tables: { name: string; columns: ColumnDef[]; rows: Record<string, unknown>[] }[],
): string {
  const lines: string[] = [];
  lines.push("-- نسخه‌پشتیبان دیتابیس WEBYAR — سازگار با PostgreSQL و MySQL/phpMyAdmin");
  lines.push(`-- تاریخ تولید: ${new Date().toISOString()}`);
  lines.push("");

  for (const table of tables) {
    lines.push(`DROP TABLE IF EXISTS \`${table.name}\`;`);
    lines.push(`CREATE TABLE \`${table.name}\` (`);
    const colLines = table.columns.map((c) => `  \`${c.name}\` ${columnSql(c)}`);
    lines.push(colLines.join(",\n"));
    lines.push(");");
    lines.push("");

    for (const row of table.rows) {
      const colNames = table.columns.map((c) => `\`${c.name}\``).join(", ");
      const values = table.columns.map((c) => sqlLiteral(row[c.name])).join(", ");
      lines.push(`INSERT INTO \`${table.name}\` (${colNames}) VALUES (${values});`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export const getDatabaseInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  const { db } = await import("./db.server");
  await requireAdmin();

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { count } = await db
        .from(table.name as any)
        .select("*", { count: "exact", head: true });
      return { name: table.name, rowCount: count ?? 0 };
    }),
  );
  return { tables: results };
});

export const exportBackup = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    generatedAt: string;
    tables: string[];
    data: Record<string, any[]>;
    sql: string;
  }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();

    const tablesWithRows = await Promise.all(
      TABLES.map(async (table) => ({ ...table, rows: await buildTableExport(table) })),
    );

    const json: Record<string, Record<string, unknown>[]> = {};
    for (const table of tablesWithRows) json[table.name] = table.rows;

    const sql = buildSqlDump(tablesWithRows);

    return {
      generatedAt: new Date().toISOString(),
      tables: TABLES.map((t) => t.name),
      data: json,
      sql,
    };
  },
);

const importSchema = z.object({
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

/** منطق مشترک بازیابی — چه از فایل آپلودشده بیاید چه از یک دیتابیس مقصد */
async function performImport(
  data: Record<string, unknown[]>,
): Promise<{ ok: true; totalInserted: number }> {
  const { db } = await import("./db.server");

  const deleteOrder = [...TABLES].reverse();
  for (const table of deleteOrder) {
    if (!data[table.name]) continue;
    await db
      .from(table.name as any)
      .delete()
      .not(table.pk, "is", null);
  }

  let totalInserted = 0;
  for (const table of TABLES) {
    const rows = data[table.name];
    if (!rows || rows.length === 0) continue;
    const { error } = await db.from(table.name as any).insert(rows as any);
    if (!error) totalInserted += rows.length;
  }

  return { ok: true, totalInserted };
}

export const importBackup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => importSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    return performImport(data.data);
  });

/* ───────────── ترانسفر مستقیم به یک پروژه Supabase مقصد ─────────────
 * دقیقاً همان روشی که این سایت با دیتابیس خودش صحبت می‌کند (@supabase/supabase-js
 * روی HTTP/PostgREST، بدون هیچ اتصال TCP خامی) — فقط با URL و Service Role Key یک
 * پروژه Supabase دیگر.
 *
 * PostgREST خودش اجازه اجرای CREATE TABLE را نمی‌دهد (فقط CRUD روی جدول‌های موجود)،
 * برای همین برای ساخت خودکار جدول‌های ناموجود روی مقصد از یک تابع کمکی کوچک در همان
 * پروژه مقصد استفاده می‌شود (DESTINATION_BOOTSTRAP_SQL) که فقط یک‌بار، دستی، باید
 * در SQL Editor مقصد اجرا شود. بعد از آن، دکمه بک‌آپ همیشه با یک کلیک هر جدول
 * ناموجود را خودش می‌سازد — نیازی به اجرای دستی SQL دیگری نیست.
 */

const META_SETTING_KEY = "_destination_backup_meta";
const CHUNK_SIZE = 500;
const EXEC_SQL_FN = "webyar_exec_sql";

/** یک‌بار در SQL Editor پروژه Supabase مقصد اجرا شود تا بک‌آپ خودکار (با ساخت خودکار جدول‌ها) فعال شود */
export const DESTINATION_BOOTSTRAP_SQL = `create or replace function public.${EXEC_SQL_FN}(query text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute query;
end;
$$;

grant execute on function public.${EXEC_SQL_FN}(text) to service_role;
revoke execute on function public.${EXEC_SQL_FN}(text) from anon, authenticated;`;

function pgColumnType(col: ColumnDef): string {
  switch (col.type) {
    case "VARCHAR":
      return `VARCHAR(${col.length ?? 191})`;
    case "TEXT":
      return "TEXT";
    case "INT":
      return "INTEGER";
    case "SMALLINT":
      return "SMALLINT";
    case "BIGINT":
      return "BIGINT";
    case "TIMESTAMP":
      return "TIMESTAMP";
  }
}

function buildCreateTableSql(table: TableDef): string {
  const cols = table.columns.map((c) => `"${c.name}" ${pgColumnType(c)}`).join(", ");
  return `CREATE TABLE IF NOT EXISTS public."${table.name}" (${cols})`;
}

/**
 * هر جدول ناموجود روی مقصد را از طریق تابع کمکی می‌سازد (idempotent — IF NOT EXISTS).
 * اگر خودِ تابع کمکی هنوز نصب نشده باشد (اولین بار)، bootstrapRequired=true برمی‌گردد
 * تا رابط کاربری اسکریپت نصب یک‌باره را نشان دهد.
 */
async function ensureDestinationSchema(
  dest: Awaited<ReturnType<typeof connectDestinationSupabase>>,
): Promise<{ bootstrapRequired: boolean; tableErrors: Record<string, string> }> {
  const tableErrors: Record<string, string> = {};
  for (const table of TABLES) {
    const { error } = await dest.rpc(
      EXEC_SQL_FN as any,
      {
        query: buildCreateTableSql(table),
      } as any,
    );
    if (error) {
      if (/Could not find the function|function .* does not exist/i.test(error.message)) {
        return { bootstrapRequired: true, tableErrors: {} };
      }
      tableErrors[table.name] = error.message;
    }
  }
  return { bootstrapRequired: false, tableErrors };
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** همان wrapper که client.server.ts برای دیتابیس خودِ سایت استفاده می‌کند — این‌جا برای مقصد */
function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

async function connectDestinationSupabase() {
  const { loadDestinationDb } = await import("./settings.server");
  const conn = await loadDestinationDb();
  if (!conn.url || !conn.serviceRoleKey) {
    throw new Error(
      "اتصال Supabase مقصد هنوز تنظیم نشده — اول در بخش پشتیبان‌گیری آدرس پروژه و کلید Service Role را وارد و ذخیره کنید.",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(conn.url, conn.serviceRoleKey, {
    global: { fetch: createSupabaseFetch(conn.serviceRoleKey) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** وضعیت اتصال Supabase مقصد — کلید واقعی هرگز به کلاینت برنمی‌گردد */
export const getDestinationDbStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadDestinationDb } = await import("./settings.server");
  const conn = await loadDestinationDb();
  return {
    configured: !!(conn.url && conn.serviceRoleKey),
    url: conn.url,
    serviceRoleKeySet: !!conn.serviceRoleKey,
  };
});

const saveDestinationDbSchema = z.object({
  url: z.string().min(1, "آدرس پروژه Supabase الزامی است"),
  serviceRoleKey: z.string().optional(),
});

/** ذخیره مشخصات اتصال — اگر کلید را خالی بفرستید، کلید قبلی دست‌نخورده می‌ماند */
export const saveDestinationDbSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveDestinationDbSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveDestinationDb } = await import("./settings.server");
    const partial: { url: string; serviceRoleKey?: string } = { url: data.url.trim() };
    if (data.serviceRoleKey) partial.serviceRoleKey = data.serviceRoleKey;
    await saveDestinationDb(partial);
    return { ok: true };
  });

/** آمار دیتابیس مقصد — تعداد ردیف هر جدول و زمان آخرین بک‌آپ، قبل از بازیابی */
export const inspectDestinationDatabase = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    generatedAt: string | null;
    tables: { name: string; rowCount: number; error: string | null }[];
  }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();

    const dest = await connectDestinationSupabase();

    let generatedAt: string | null = null;
    const { data: metaRow, error: metaError } = await dest
      .from("settings" as any)
      .select("setting_value")
      .eq("setting_key", META_SETTING_KEY)
      .maybeSingle();
    if (!metaError && metaRow?.setting_value) {
      try {
        generatedAt =
          (JSON.parse(metaRow.setting_value) as { generatedAt?: string }).generatedAt ?? null;
      } catch {
        generatedAt = null;
      }
    }

    const tables = await Promise.all(
      TABLES.map(async (table) => {
        const { count, error } = await dest
          .from(table.name as any)
          .select("*", { count: "exact", head: true });
        // خطا (مثلاً RLS یا جدول ناموجود) نادیده گرفته نمی‌شود — دقیقاً همان پیامی که
        // Supabase برمی‌گرداند نمایش داده می‌شود تا دلیل واقعی مشخص باشد
        return { name: table.name, rowCount: count ?? 0, error: error?.message ?? null };
      }),
    );

    return { generatedAt, tables };
  },
);

/** بک‌آپ مستقیم دیتابیس فعلی سایت به داخل پروژه Supabase مقصد — بدون فایل واسط */
export const backupToDestinationDb = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    ok: boolean;
    generatedAt: string;
    bootstrapRequired?: boolean;
    bootstrapSql?: string;
    tables: { name: string; rowCount: number; error: string | null }[];
  }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();

    const dest = await connectDestinationSupabase();

    // هر جدول ناموجود روی مقصد را قبل از نوشتن داده خودش می‌سازد — به همین دلیل بک‌آپ
    // همیشه با یک کلیک کار می‌کند، حتی روی یک پروژه Supabase کاملاً خالی
    const schema = await ensureDestinationSchema(dest);
    if (schema.bootstrapRequired) {
      return {
        ok: false,
        generatedAt: new Date().toISOString(),
        bootstrapRequired: true,
        bootstrapSql: DESTINATION_BOOTSTRAP_SQL,
        tables: [],
      };
    }

    const summary: { name: string; rowCount: number; error: string | null }[] = [];
    for (const table of TABLES) {
      const schemaError = schema.tableErrors[table.name];
      if (schemaError) {
        summary.push({ name: table.name, rowCount: 0, error: schemaError });
        continue;
      }
      const rows = await buildTableExport(table);
      try {
        const { error: deleteError } = await dest
          .from(table.name as any)
          .delete()
          .not(table.pk, "is", null);
        if (deleteError) throw new Error(deleteError.message);

        let inserted = 0;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          if (chunk.length === 0) continue;
          const { error: insertError } = await dest.from(table.name as any).insert(chunk as any);
          // نادیده گرفتن error این‌جا دقیقاً همان چیزی بود که باعث می‌شد بک‌آپ ظاهراً موفق
          // گزارش شود بدون این‌که واقعاً چیزی روی مقصد نوشته شده باشد
          if (insertError) throw new Error(insertError.message);
          inserted += chunk.length;
        }
        summary.push({ name: table.name, rowCount: inserted, error: null });
      } catch (err) {
        // این جدول رد می‌شود و پیام خطای واقعی گزارش می‌شود؛ بقیه جدول‌ها ادامه پیدا می‌کنند
        summary.push({
          name: table.name,
          rowCount: 0,
          error: err instanceof Error ? err.message : "خطای نامشخص",
        });
      }
    }

    const generatedAt = new Date().toISOString();
    const metaValue = JSON.stringify({ generatedAt });
    const { data: existingMeta } = await dest
      .from("settings" as any)
      .select("id")
      .eq("setting_key", META_SETTING_KEY)
      .maybeSingle();
    if (existingMeta) {
      await dest
        .from("settings" as any)
        .update({ setting_value: metaValue, updated_at: generatedAt })
        .eq("id", existingMeta.id);
    } else {
      await dest.from("settings" as any).insert({
        id: crypto.randomUUID(),
        setting_key: META_SETTING_KEY,
        setting_value: metaValue,
        is_private: 0,
        updated_at: generatedAt,
      } as any);
    }

    return { ok: true, generatedAt, tables: summary };
  },
);

/** بازیابی دیتابیس فعلی سایت از یک پروژه Supabase مقصد که قبلاً با همین ابزار بک‌آپ گرفته شده */
export const restoreFromDestinationDb = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: boolean; totalInserted: number }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();

    const dest = await connectDestinationSupabase();

    const gathered: Record<string, unknown[]> = {};
    const failures: string[] = [];
    for (const table of TABLES) {
      try {
        gathered[table.name] = await buildTableExport(table, dest);
      } catch (err) {
        // جدول روی مقصد وجود ندارد یا خواندن از آن شکست خورد — رد می‌شود، بقیه ادامه پیدا می‌کنند
        failures.push(err instanceof Error ? err.message : `${table.name}: خطای نامشخص`);
      }
    }
    // اگر هیچ جدولی قابل خواندن نبود (مثلاً کلید اشتباه یا دسترسی رد شده)، به‌جای گزارش
    // موفقیت با صفر رکورد، دلیل واقعی را نشان بده
    if (failures.length === TABLES.length) {
      throw new Error(failures[0] ?? "خواندن از Supabase مقصد ممکن نشد");
    }
    return performImport(gathered);
  },
);
