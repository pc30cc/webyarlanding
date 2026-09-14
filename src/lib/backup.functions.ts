// نسخه‌پشتیبان‌گیری کامل پایگاه‌داده — فقط برای مدیران. خروجی JSON و SQL قابل‌حمل (سازگار با PostgreSQL و MySQL/phpMyAdmin).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface ColumnDef {
  name: string;
  type: "TEXT" | "VARCHAR" | "INT" | "SMALLINT" | "BIGINT" | "TIMESTAMP";
  length?: number;
}

interface TableDef {
  name: string;
  pk: string;
  columns: ColumnDef[];
}

// ترتیب جدول‌ها بر اساس وابستگی کلید خارجی (والد قبل از فرزند) — برای درج امن.
const TABLES: TableDef[] = [
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

async function buildTableExport(table: TableDef): Promise<Record<string, unknown>[]> {
  const { db } = await import("./db.server");
  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data } = await db
      .from(table.name as any)
      .select("*")
      .range(from, from + pageSize - 1);
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

/* ───────────── ترانسفر مستقیم به دیتابیس PostgreSQL مقصد ─────────────
 * برخلاف export/import بالا (که فایل واسط دانلود/آپلود می‌شود)، این بخش مستقیماً
 * از طریق یک اتصال TCP خام (Cloudflare Sockets API، از طریق پکیج postgres.js) به
 * یک سرور PostgreSQL دیگر وصل می‌شود و جدول‌ها را همان‌جا می‌سازد/می‌خواند.
 */

/** نام امن دیتابیس/جدول پستگرس — چون این مقادیر مستقیم در DDL/شناسه استفاده می‌شوند نه به‌عنوان پارامتر */
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const META_TABLE = "_webyar_backup_meta";
const CHUNK_SIZE = 500;

function assertSafeIdentifier(name: string): void {
  if (!SAFE_IDENTIFIER.test(name)) {
    throw new Error(
      "نام دیتابیس فقط می‌تواند شامل حروف انگلیسی، عدد و زیرخط باشد و با عدد شروع نشود.",
    );
  }
}

/** اتصال کوتاه‌مدت به سرور مقصد — اگر databaseName ندهید به دیتابیس نگهداری «postgres» وصل می‌شود (برای LIST/CREATE DATABASE) */
async function connectDestination(databaseName?: string) {
  const { loadDestinationDb } = await import("./settings.server");
  const conn = await loadDestinationDb();
  if (!conn.dbHost || !conn.dbUser) {
    throw new Error(
      "اتصال دیتابیس مقصد هنوز تنظیم نشده — اول در بخش پشتیبان‌گیری مشخصات آن را وارد و ذخیره کنید.",
    );
  }
  const postgresModule = await import("postgres");
  const postgres = postgresModule.default;
  const sql = postgres({
    host: conn.dbHost,
    port: conn.dbPort || 5432,
    username: conn.dbUser,
    password: conn.dbPassword,
    database: databaseName || "postgres",
    ssl: conn.dbSsl ? "require" : false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    // بدون این، postgres.js سعی می‌کند از prepared statement استفاده کند — روی اتصال مستقیم
    // (بدون connection pooler مثل PgBouncer/Hyperdrive) با بعضی سرویس‌های PostgreSQL مدیریت‌شده مشکل ایجاد می‌کند
    prepare: false,
  });
  return sql;
}

function pgColumnSql(col: ColumnDef): string {
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

/** وضعیت اتصال دیتابیس مقصد — رمز عبور واقعی هرگز به کلاینت برنمی‌گردد */
export const getDestinationDbStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadDestinationDb } = await import("./settings.server");
  const conn = await loadDestinationDb();
  return {
    configured: !!(conn.dbHost && conn.dbUser),
    dbHost: conn.dbHost,
    dbPort: conn.dbPort,
    dbUser: conn.dbUser,
    dbSsl: conn.dbSsl,
    passwordSet: !!conn.dbPassword,
  };
});

const saveDestinationDbSchema = z.object({
  dbHost: z.string().min(1, "آدرس سرور الزامی است"),
  dbPort: z.number().int().min(1).max(65535).optional().default(5432),
  dbUser: z.string().min(1, "نام کاربری الزامی است"),
  dbPassword: z.string().optional(),
  dbSsl: z.boolean().optional().default(true),
});

/** ذخیره مشخصات اتصال — اگر رمز عبور خالی بفرستید، رمز قبلی دست‌نخورده می‌ماند */
export const saveDestinationDbSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveDestinationDbSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveDestinationDb } = await import("./settings.server");
    const partial: {
      dbHost: string;
      dbPort: number;
      dbUser: string;
      dbSsl: boolean;
      dbPassword?: string;
    } = {
      dbHost: data.dbHost,
      dbPort: data.dbPort,
      dbUser: data.dbUser,
      dbSsl: data.dbSsl,
    };
    if (data.dbPassword) partial.dbPassword = data.dbPassword;
    await saveDestinationDb(partial);
    return { ok: true };
  });

/** فهرست دیتابیس‌های موجود روی سرور مقصد (به‌جز template0/template1) */
export const listDestinationDatabases = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();

    const sql = await connectDestination();
    try {
      const rows = await sql<{ datname: string }[]>`
      SELECT datname FROM pg_database
      WHERE datistemplate = false AND datname NOT IN ('template0', 'template1')
      ORDER BY datname
    `;
      return rows.map((r) => r.datname);
    } finally {
      await sql.end({ timeout: 3 });
    }
  },
);

const dbNameSchema = z.object({ name: z.string().min(1) });

/** ساخت یک دیتابیس خالی جدید روی سرور مقصد */
export const createDestinationDatabase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dbNameSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    assertSafeIdentifier(data.name);

    const sql = await connectDestination();
    try {
      await sql.unsafe(`CREATE DATABASE "${data.name}"`);
      return { ok: true };
    } finally {
      await sql.end({ timeout: 3 });
    }
  });

/** آمار یک دیتابیس مقصد مشخص — تعداد ردیف هر جدول و زمان آخرین بک‌آپ، قبل از انتخاب برای بازیابی */
export const inspectDestinationDatabase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dbNameSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ generatedAt: string | null; tables: { name: string; rowCount: number }[] }> => {
      const { requireAdmin } = await import("./auth.server");
      await requireAdmin();
      assertSafeIdentifier(data.name);

      const sql = await connectDestination(data.name);
      try {
        let generatedAt: string | null = null;
        try {
          const meta = await sql<
            { generated_at: string }[]
          >`SELECT generated_at FROM ${sql(META_TABLE)} WHERE id = 1`;
          generatedAt = meta[0]?.generated_at ?? null;
        } catch {
          generatedAt = null;
        }

        const tables = await Promise.all(
          TABLES.map(async (table) => {
            try {
              const result = await sql<
                { count: string }[]
              >`SELECT count(*)::text FROM ${sql(table.name)}`;
              return { name: table.name, rowCount: Number(result[0]?.count ?? 0) };
            } catch {
              return { name: table.name, rowCount: 0 };
            }
          }),
        );

        return { generatedAt, tables };
      } finally {
        await sql.end({ timeout: 3 });
      }
    },
  );

/** بک‌آپ مستقیم دیتابیس فعلی به داخل یک دیتابیس مشخص روی سرور مقصد — بدون فایل واسط */
export const backupToDestinationDb = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dbNameSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      generatedAt: string;
      tables: { name: string; rowCount: number }[];
    }> => {
      const { requireAdmin } = await import("./auth.server");
      await requireAdmin();
      assertSafeIdentifier(data.name);

      const sql = await connectDestination(data.name);
      try {
        await sql.unsafe(
          `CREATE TABLE IF NOT EXISTS ${META_TABLE} (id INTEGER PRIMARY KEY, generated_at TIMESTAMP)`,
        );

        const summary: { name: string; rowCount: number }[] = [];
        for (const table of TABLES) {
          const columnsSql = table.columns.map((c) => `"${c.name}" ${pgColumnSql(c)}`).join(", ");
          await sql.unsafe(`CREATE TABLE IF NOT EXISTS "${table.name}" (${columnsSql})`);
          await sql.unsafe(`DELETE FROM "${table.name}"`);

          const rows = await buildTableExport(table);
          const columnNames = table.columns.map((c) => c.name);
          for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
            const chunk = rows.slice(i, i + CHUNK_SIZE).map((row) => {
              const clean: Record<string, unknown> = {};
              for (const col of columnNames) clean[col] = row[col] ?? null;
              return clean;
            });
            if (chunk.length > 0) {
              await sql`INSERT INTO ${sql(table.name)} ${sql(chunk, ...columnNames)}`;
            }
          }
          summary.push({ name: table.name, rowCount: rows.length });
        }

        const generatedAt = new Date().toISOString();
        await sql`
        INSERT INTO ${sql(META_TABLE)} (id, generated_at) VALUES (1, ${generatedAt})
        ON CONFLICT (id) DO UPDATE SET generated_at = EXCLUDED.generated_at
      `;

        return { ok: true, generatedAt, tables: summary };
      } finally {
        await sql.end({ timeout: 3 });
      }
    },
  );

/** بازیابی دیتابیس فعلی سایت از یک دیتابیس مقصد که قبلاً با همین ابزار بک‌آپ گرفته شده */
export const restoreFromDestinationDb = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dbNameSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; totalInserted: number }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    assertSafeIdentifier(data.name);

    const sql = await connectDestination(data.name);
    try {
      const gathered: Record<string, unknown[]> = {};
      for (const table of TABLES) {
        try {
          const rows = await sql.unsafe(`SELECT * FROM "${table.name}"`);
          gathered[table.name] = rows as unknown[];
        } catch {
          // جدول روی مقصد وجود ندارد — نادیده گرفته می‌شود
        }
      }
      return performImport(gathered);
    } finally {
      await sql.end({ timeout: 3 });
    }
  });
