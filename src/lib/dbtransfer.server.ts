// انتقال مستقیم دیتابیس به دیتابیس — اتصال خام PostgreSQL به سرور مقصد (psql/Supabase سلف‌هاست).
// فقط سمت سرور اجرا می‌شود.
import type { Client } from "pg";
import { TABLES, type ColumnDef, type TableDef } from "./backup.functions";

const PAGE_SIZE = 500;
const INSERT_BATCH = 200;

export function isLikelyPostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\/[^\s]+$/i.test(value.trim());
}

/** پیام خام درایور را به یک کد پایدار + متن اصلی تبدیل می‌کند */
export function describeTargetError(err: unknown): { code: string; message: string } {
  const e = err as { code?: string; message?: string };
  const message = e?.message ?? String(err);
  const pgCode = e?.code ?? "";
  if (pgCode === "ENOTFOUND" || pgCode === "EAI_AGAIN")
    return { code: "آدرس سرور مقصد پیدا نشد", message };
  if (pgCode === "ECONNREFUSED") return { code: "اتصال به سرور مقصد رد شد", message };
  if (pgCode === "ETIMEDOUT" || /timeout expired|timed? ?out/i.test(message))
    return { code: "سرور مقصد پاسخ نداد (احتمالاً پورت ۵۴۳۲ باز نیست)", message };
  if (pgCode === "28P01" || pgCode === "28000")
    return { code: "نام کاربری یا رمز عبور مقصد اشتباه است", message };
  if (pgCode === "3D000") return { code: "دیتابیس مقصد وجود ندارد", message };
  if (/self[- ]signed|certificate|SSL|TLS/i.test(message))
    return { code: "خطای گواهی TLS در اتصال به مقصد", message };
  return { code: "اتصال به مقصد برقرار نشد", message };
}

export async function connectTarget(connectionString: string): Promise<Client> {
  const mod: any = await import("pg");
  const PgClient = mod.Client ?? mod.default?.Client;
  const trimmed = connectionString.trim();
  const disableSsl = /sslmode=disable/i.test(trimmed);
  const options = {
    connectionString: trimmed,
    statement_timeout: 300_000,
    connectionTimeoutMillis: 15_000,
  };
  const client: Client = new PgClient(
    disableSsl ? options : { ...options, ssl: { rejectUnauthorized: false } },
  );
  try {
    await client.connect();
    return client;
  } catch (err) {
    const { code } = describeTargetError(err);
    if (disableSsl || !code.includes("TLS")) throw err;
    const plain: Client = new PgClient(options);
    await plain.connect();
    return plain;
  }
}

export async function inspectTarget(connectionString: string) {
  const client = await connectTarget(connectionString);
  try {
    const version = await client.query<{ version: string }>("select version()");
    const tables = await client.query<{ count: string }>(
      `select count(*)::text as count from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );
    const db = await client.query<{ db: string; usr: string }>(
      "select current_database() as db, current_user as usr",
    );
    return {
      version: version.rows[0]?.version ?? "",
      tableCount: Number(tables.rows[0]?.count ?? 0),
      database: db.rows[0]?.db ?? "",
      user: db.rows[0]?.usr ?? "",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

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

function quote(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function pkCols(table: TableDef): string[] {
  return table.pkColumns && table.pkColumns.length > 0 ? table.pkColumns : [table.pk];
}

function createTableSql(table: TableDef): string {
  const cols = table.columns.map((c) => `${quote(c.name)} ${pgColumnType(c)}`).join(", ");
  const pk = pkCols(table).map(quote).join(", ");
  return `create table if not exists public.${quote(table.name)} (${cols}, primary key (${pk}))`;
}

/** اگر کلید اصلی مقصد با تعریف سایت یکی نبود، اصلاحش می‌کند (مثلاً کلید مرکب جدول برچسب‌ها) */
async function ensurePrimaryKey(client: Client, table: TableDef): Promise<void> {
  const expected = pkCols(table);
  const { rows } = await client.query<{ column_name: string; conname: string }>(
    `select a.attname as column_name, c.conname
       from pg_constraint c
       join pg_class t on t.oid = c.conrelid
       join pg_namespace n on n.oid = t.relnamespace
       join unnest(c.conkey) with ordinality as k(attnum, ord) on true
       join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
      where n.nspname = 'public' and t.relname = $1 and c.contype = 'p'
      order by k.ord`,
    [table.name],
  );
  const current = rows.map((r) => r.column_name);
  if (current.length > 0 && current.join(",") === expected.join(",")) return;
  if (current.length > 0) {
    await client.query(
      `alter table public.${quote(table.name)} drop constraint ${quote(rows[0]!.conname)}`,
    );
  }
  await client.query(
    `alter table public.${quote(table.name)} add primary key (${expected.map(quote).join(", ")})`,
  );
}

function addColumnSql(table: TableDef, col: ColumnDef): string {
  return `alter table public.${quote(table.name)} add column if not exists ${quote(col.name)} ${pgColumnType(col)}`;
}

/** ستون‌های واقعی جدول روی مقصد */
async function targetColumns(client: Client, table: string): Promise<Set<string>> {
  const { rows } = await client.query<{ column_name: string }>(
    `select column_name from information_schema.columns
      where table_schema = 'public' and table_name = $1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

async function readSourceRows(tableName: string): Promise<Record<string, unknown>[]> {
  const { db } = await import("./db.server");
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from(tableName as any)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${tableName}: ${error.message}`);
    const chunk = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return rows;
}

async function sourceRowCount(tableName: string): Promise<number> {
  const { db } = await import("./db.server");
  const { count } = await db.from(tableName as any).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export interface CompareResult {
  identical: boolean;
  targetTableCount: number;
  tables: {
    name: string;
    sourceRows: number;
    targetRows: number | null;
    missingOnTarget: boolean;
    missingColumns: string[];
    extraColumns: string[];
  }[];
}

/** مقایسه دقیق ساختار و تعداد رکورد بین دیتابیس سایت و دیتابیس مقصد */
export async function compareWithTarget(connectionString: string): Promise<CompareResult> {
  const client = await connectTarget(connectionString);
  try {
    const all = await client.query<{ count: string }>(
      `select count(*)::text as count from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );

    const tables: CompareResult["tables"] = [];
    for (const table of TABLES) {
      const sourceRows = await sourceRowCount(table.name);
      const cols = await targetColumns(client, table.name);
      if (cols.size === 0) {
        tables.push({
          name: table.name,
          sourceRows,
          targetRows: null,
          missingOnTarget: true,
          missingColumns: table.columns.map((c) => c.name),
          extraColumns: [],
        });
        continue;
      }
      const expected = new Set(table.columns.map((c) => c.name));
      const countRes = await client.query<{ count: string }>(
        `select count(*)::text as count from public.${quote(table.name)}`,
      );
      tables.push({
        name: table.name,
        sourceRows,
        targetRows: Number(countRes.rows[0]?.count ?? 0),
        missingOnTarget: false,
        missingColumns: [...expected].filter((c) => !cols.has(c)),
        extraColumns: [...cols].filter((c) => !expected.has(c)),
      });
    }

    const identical = tables.every(
      (t) =>
        !t.missingOnTarget &&
        t.missingColumns.length === 0 &&
        t.targetRows === t.sourceRows,
    );

    return { identical, targetTableCount: Number(all.rows[0]?.count ?? 0), tables };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export interface TransferOptions {
  connectionString: string;
  includeSchema: boolean;
  truncateTarget: boolean;
}

export interface TransferResult {
  totalRows: number;
  tables: { name: string; rows: number; error: string | null; skipped?: string }[];
  warnings: string[];
}

function encodeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

/** انتقال کامل ساختار و داده‌ها از دیتابیس سایت به دیتابیس مقصد */
export async function runTransfer(options: TransferOptions): Promise<TransferResult> {
  const client = await connectTarget(options.connectionString);
  const warnings: string[] = [];
  const result: TransferResult["tables"] = [];
  let totalRows = 0;

  try {
    if (options.includeSchema) {
      for (const table of TABLES) {
        try {
          await client.query(createTableSql(table));
          for (const col of table.columns) {
            await client.query(addColumnSql(table, col));
          }
        } catch (err) {
          warnings.push(`ساخت ${table.name}: ${(err as Error).message}`);
        }
      }
    }

    let replica = true;
    await client.query("set session_replication_role = 'replica'").catch(() => {
      replica = false;
    });

    for (const table of TABLES) {
      const cols = await targetColumns(client, table.name);
      if (cols.size === 0) {
        result.push({ name: table.name, rows: 0, error: null, skipped: "روی مقصد وجود ندارد" });
        continue;
      }

      if (options.truncateTarget) {
        await client
          .query(`truncate table public.${quote(table.name)} cascade`)
          .catch((e) => warnings.push(`پاک‌سازی ${table.name}: ${e.message}`));
      }

      try {
        const rows = await readSourceRows(table.name);
        let copied = 0;
        for (let i = 0; i < rows.length; i += INSERT_BATCH) {
          const batch = rows.slice(i, i + INSERT_BATCH);
          const columns = table.columns.map((c) => c.name).filter((c) => cols.has(c));
          if (columns.length === 0) break;
          const params: unknown[] = [];
          const tuples = batch.map((row) => {
            const placeholders = columns.map((col) => {
              params.push(encodeValue(row[col]));
              return `$${params.length}`;
            });
            return `(${placeholders.join(",")})`;
          });
          const sql = `insert into public.${quote(table.name)} (${columns
            .map(quote)
            .join(",")}) values ${tuples.join(",")} on conflict do nothing`;
          await client.query(sql, params);
          copied += batch.length;
        }
        totalRows += copied;
        result.push({ name: table.name, rows: copied, error: null });
      } catch (err) {
        result.push({ name: table.name, rows: 0, error: (err as Error).message });
      }
    }

    if (replica) {
      await client.query("set session_replication_role = 'origin'").catch(() => undefined);
    }

    return { totalRows, tables: result, warnings };
  } finally {
    await client.end().catch(() => undefined);
  }
}
