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

function buildSqlDump(tables: { name: string; columns: ColumnDef[]; rows: Record<string, unknown>[] }[]): string {
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
      const { count } = await db.from(table.name as any).select("*", { count: "exact", head: true });
      return { name: table.name, rowCount: count ?? 0 };
    }),
  );
  return { tables: results };
});

export const exportBackup = createServerFn({ method: "GET" }).handler(async (): Promise<{ generatedAt: string; tables: string[]; data: Record<string, any[]>; sql: string }> => {
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
});

const importSchema = z.object({
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export const importBackup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => importSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();

    const deleteOrder = [...TABLES].reverse();

    for (const table of deleteOrder) {
      if (!data.data[table.name]) continue;
      await db.from(table.name as any).delete().not(table.pk, "is", null);
    }

    let totalInserted = 0;
    for (const table of TABLES) {
      const rows = data.data[table.name];
      if (!rows || rows.length === 0) continue;
      const { error } = await db.from(table.name as any).insert(rows as any);
      if (!error) totalInserted += rows.length;
    }

    return { ok: true, totalInserted };
  });
