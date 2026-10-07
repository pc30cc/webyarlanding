/* eslint-disable @typescript-eslint/no-explicit-any */
// کلاینت PostgreSQL مستقیم (برای دیتابیس سلف‌هاست روی Coolify) با همان API زنجیره‌ای
// @supabase/supabase-js که در کل پروژه استفاده می‌شود: from().select().eq().order()...
// فقط زیرمجموعه‌ای که واقعاً در کد استفاده شده پیاده‌سازی شده و رفتارش (شکل خروجی
// { data, error, count }، throw نکردن روی خطا، single/maybeSingle، فرمت تاریخ‌ها و
// bigint به عدد) عیناً مثل PostgREST است تا جابه‌جایی بین Supabase و Postgres بی‌دردسر باشد.
import type { Pool, PoolClient } from "pg";
import schemaSql from "../../db/schema.sql?raw";

type Row = Record<string, unknown>;

export interface PgError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface PgResult<T = any> {
  data: T;
  error: PgError | null;
  count: number | null;
  status: number;
  statusText: string;
}

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function quoteIdent(name: string): string {
  const trimmed = name.trim();
  if (!IDENT_RE.test(trimmed)) throw new Error(`invalid identifier: ${name}`);
  return `"${trimmed}"`;
}

function toPgError(err: unknown): PgError {
  const e = err as { message?: string; code?: string; detail?: string; hint?: string };
  return {
    message: e?.message ?? String(err),
    code: e?.code ?? "PGERROR",
    details: e?.detail ?? null,
    hint: e?.hint ?? null,
  };
}

/* ───────────── اتصال ───────────── */

let poolPromise: Promise<Pool> | null = null;

/** مقدارها را دقیقاً به شکل خروجی PostgREST برمی‌گرداند (رشته ISO برای تاریخ، عدد برای bigint) */
function installTypeParsers(types: any): void {
  const TIMESTAMP = 1114;
  const TIMESTAMPTZ = 1184;
  const DATE = 1082;
  const INT8 = 20;
  const NUMERIC = 1700;
  types.setTypeParser(TIMESTAMP, (v: string) => v.replace(" ", "T"));
  types.setTypeParser(TIMESTAMPTZ, (v: string) =>
    v.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
  );
  types.setTypeParser(DATE, (v: string) => v);
  types.setTypeParser(INT8, (v: string) => {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : v;
  });
  types.setTypeParser(NUMERIC, (v: string) => Number(v));
}

export function getDatabaseUrl(): string | undefined {
  const url = process.env["DATABASE_URL"]?.trim();
  return url ? url : undefined;
}

export async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const mod: any = await import("pg");
      const pg = mod.default ?? mod;
      installTypeParsers(pg.types);
      const connectionString = getDatabaseUrl();
      if (!connectionString) throw new Error("DATABASE_URL تنظیم نشده است");
      // داخل شبکه داخلی Coolify اتصال SSL ندارد؛ برای سرور بیرونی ?sslmode=require بگذارید.
      const wantsSsl = /sslmode=(require|verify-ca|verify-full|prefer)/i.test(connectionString);
      const pool: Pool = new pg.Pool({
        connectionString: connectionString
          .replace(/([?&])sslmode=[^&]*&?/i, "$1")
          .replace(/[?&]$/, ""),
        ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
        max: Number(process.env["DATABASE_POOL_MAX"] ?? 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 15_000,
        // زمان‌ها مثل Supabase به UTC ذخیره و خوانده می‌شوند
        options: "-c timezone=UTC",
      });
      pool.on("error", (err) => console.error("[pg] idle client error", err.message));
      await ensureSchema(pool);
      return pool;
    })().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/**
 * اسکیمای db/schema.sql را (idempotent) اجرا می‌کند تا جدول‌های جدید در هر دیپلوی خودکار
 * ساخته شوند. با advisory lock تا چند نمونه هم‌زمان سرور با هم تداخل نکنند.
 * با DATABASE_AUTO_MIGRATE=false غیرفعال می‌شود.
 */
async function ensureSchema(pool: Pool): Promise<void> {
  if (process.env["DATABASE_AUTO_MIGRATE"] === "false") return;
  const client = await pool.connect();
  try {
    await client.query("set client_min_messages = warning");
    await client.query("select pg_advisory_lock(727001)");
    await client.query(schemaSql);
  } catch (err) {
    console.error("[pg] schema migration failed:", (err as Error).message);
  } finally {
    await client.query("select pg_advisory_unlock(727001)").catch(() => undefined);
    await client.query("reset client_min_messages").catch(() => undefined);
    client.release();
  }
}

export async function pgQuery<T extends Row = Row>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = await getPool();
  const res = await pool.query(text, params as any[]);
  return res.rows as T[];
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/* ───────────── سازنده کوئری ───────────── */

type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in";

interface Filter {
  column: string;
  op: Op;
  value: unknown;
  negate: boolean;
}

const OP_SQL: Record<Exclude<Op, "is" | "in">, string> = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
  ilike: "ILIKE",
};

type Action = "select" | "insert" | "update" | "delete" | "upsert";

const pkCache = new Map<string, string[]>();

async function primaryKeyOf(table: string): Promise<string[]> {
  const cached = pkCache.get(table);
  if (cached) return cached;
  const rows = await pgQuery<{ column_name: string }>(
    `select a.attname as column_name
       from pg_index i
       join pg_class t on t.oid = i.indrelid
       join pg_namespace n on n.oid = t.relnamespace
       join pg_attribute a on a.attrelid = t.oid and a.attnum = any(i.indkey)
      where i.indisprimary and n.nspname = 'public' and t.relname = $1`,
    [table],
  );
  const cols = rows.map((r) => r.column_name);
  pkCache.set(table, cols);
  return cols;
}

function parseColumns(columns: string): string {
  const trimmed = columns.trim();
  if (!trimmed || trimmed === "*") return "*";
  return trimmed
    .split(",")
    .map((c) => quoteIdent(c))
    .join(", ");
}

export class PgQueryBuilder<T = any> implements PromiseLike<PgResult<T>> {
  private action: Action = "select";
  private columns = "*";
  private returning: string | null = null;
  private countMode: "exact" | null = null;
  private head = false;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean; nullsFirst?: boolean | undefined }[] = [];
  private limitN: number | null = null;
  private offsetN: number | null = null;
  private payload: Row | Row[] | null = null;
  private onConflict: string | null = null;
  private ignoreDuplicates = false;
  private singleMode: "single" | "maybe" | null = null;

  constructor(private readonly table: string) {
    quoteIdent(table);
  }

  /* ---- اکشن‌ها ---- */

  select(columns = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.action === "select") {
      this.columns = columns;
      if (options?.count) this.countMode = "exact";
      if (options?.head) this.head = true;
    } else {
      // insert/update/upsert/delete + select() → RETURNING
      this.returning = columns;
    }
    return this;
  }

  insert(values: Row | Row[]) {
    this.action = "insert";
    this.payload = values;
    return this;
  }

  upsert(values: Row | Row[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.action = "upsert";
    this.payload = values;
    this.onConflict = options?.onConflict ?? null;
    this.ignoreDuplicates = !!options?.ignoreDuplicates;
    return this;
  }

  update(values: Row) {
    this.action = "update";
    this.payload = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  /* ---- فیلترها ---- */

  private add(column: string, op: Op, value: unknown, negate = false) {
    this.filters.push({ column, op, value, negate });
    return this;
  }

  eq(column: string, value: unknown) {
    return this.add(column, "eq", value);
  }
  neq(column: string, value: unknown) {
    return this.add(column, "neq", value);
  }
  gt(column: string, value: unknown) {
    return this.add(column, "gt", value);
  }
  gte(column: string, value: unknown) {
    return this.add(column, "gte", value);
  }
  lt(column: string, value: unknown) {
    return this.add(column, "lt", value);
  }
  lte(column: string, value: unknown) {
    return this.add(column, "lte", value);
  }
  like(column: string, pattern: string) {
    return this.add(column, "like", pattern);
  }
  ilike(column: string, pattern: string) {
    return this.add(column, "ilike", pattern);
  }
  is(column: string, value: null | boolean) {
    return this.add(column, "is", value);
  }
  in(column: string, values: readonly unknown[]) {
    return this.add(column, "in", [...values]);
  }
  match(query: Row) {
    for (const [k, v] of Object.entries(query)) this.add(k, "eq", v);
    return this;
  }
  not(column: string, operator: string, value: unknown) {
    const op = operator as Op;
    if (!(op in OP_SQL) && op !== "is" && op !== "in") {
      throw new Error(`unsupported not() operator: ${operator}`);
    }
    return this.add(column, op, value, true);
  }
  filter(column: string, operator: string, value: unknown) {
    return this.add(column, operator as Op, value);
  }

  /* ---- مرتب‌سازی و صفحه‌بندی ---- */

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this as unknown as PgQueryBuilder<any>;
  }

  maybeSingle() {
    this.singleMode = "maybe";
    return this as unknown as PgQueryBuilder<any>;
  }

  /* ---- ساخت SQL ---- */

  private whereSql(params: unknown[]): string {
    if (this.filters.length === 0) return "";
    const parts = this.filters.map((f) => {
      const col = quoteIdent(f.column);
      let expr: string;
      if (f.op === "is") {
        const v = f.value === null || f.value === "null" ? "NULL" : f.value ? "TRUE" : "FALSE";
        expr = `${col} IS ${v}`;
      } else if (f.op === "in") {
        const list = f.value as unknown[];
        if (list.length === 0) expr = "FALSE";
        else {
          params.push(list.map((v) => (v === null ? null : String(v))));
          expr = `${col}::text = ANY($${params.length}::text[])`;
        }
      } else {
        params.push(f.value);
        expr = `${col} ${OP_SQL[f.op]} $${params.length}`;
      }
      return f.negate ? `NOT (${expr})` : expr;
    });
    return ` WHERE ${parts.join(" AND ")}`;
  }

  private orderSql(): string {
    if (this.orders.length === 0) return "";
    return (
      " ORDER BY " +
      this.orders
        .map(
          (o) =>
            `${quoteIdent(o.column)} ${o.ascending ? "ASC" : "DESC"}` +
            (o.nullsFirst === undefined ? "" : o.nullsFirst ? " NULLS FIRST" : " NULLS LAST"),
        )
        .join(", ")
    );
  }

  private pagingSql(): string {
    let sql = "";
    if (this.limitN !== null) sql += ` LIMIT ${Math.max(0, Math.floor(this.limitN))}`;
    if (this.offsetN !== null) sql += ` OFFSET ${Math.max(0, Math.floor(this.offsetN))}`;
    return sql;
  }

  private returningSql(): string {
    return this.returning === null ? "" : ` RETURNING ${parseColumns(this.returning)}`;
  }

  private rowsOf(): Row[] {
    const p = this.payload;
    if (!p) return [];
    return (Array.isArray(p) ? p : [p]).map((r) => {
      const out: Row = {};
      // undefined مثل PostgREST نادیده گرفته می‌شود؛ ستون مقدار پیش‌فرض خودش را می‌گیرد
      for (const [k, v] of Object.entries(r)) if (v !== undefined) out[k] = normalizeValue(v);
      return out;
    });
  }

  private async buildWrite(params: unknown[]): Promise<string | null> {
    const table = quoteIdent(this.table);
    const rows = this.rowsOf();
    if (rows.length === 0) return null;
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const colSql = keys.map(quoteIdent).join(", ");
    const valuesSql = rows
      .map(
        (r) =>
          "(" +
          keys
            .map((k) => {
              if (!(k in r)) return "DEFAULT";
              params.push(r[k]);
              return `$${params.length}`;
            })
            .join(", ") +
          ")",
      )
      .join(", ");
    let sql = `INSERT INTO public.${table} (${colSql}) VALUES ${valuesSql}`;
    if (this.action === "upsert") {
      const conflictCols = this.onConflict
        ? this.onConflict.split(",").map((c) => c.trim())
        : await primaryKeyOf(this.table);
      const conflict = conflictCols.map(quoteIdent).join(", ");
      const updatable = keys.filter((k) => !conflictCols.includes(k));
      if (this.ignoreDuplicates || updatable.length === 0) {
        sql += ` ON CONFLICT (${conflict}) DO NOTHING`;
      } else {
        sql += ` ON CONFLICT (${conflict}) DO UPDATE SET ${updatable
          .map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`)
          .join(", ")}`;
      }
    }
    return sql + this.returningSql();
  }

  private async execute(): Promise<PgResult<any>> {
    try {
      const params: unknown[] = [];
      const table = `public.${quoteIdent(this.table)}`;
      let sql: string | null;
      let count: number | null = null;

      switch (this.action) {
        case "select": {
          const where = this.whereSql(params);
          if (this.countMode) {
            const rows = await pgQuery<{ c: number }>(
              `SELECT count(*)::int AS c FROM ${table}${where}`,
              params,
            );
            count = rows[0]?.c ?? 0;
            if (this.head) return ok(null, count);
          }
          sql = `SELECT ${parseColumns(this.columns)} FROM ${table}${where}${this.orderSql()}${this.pagingSql()}`;
          break;
        }
        case "insert":
        case "upsert":
          sql = await this.buildWrite(params);
          if (sql === null) return ok(this.returning === null ? null : [], null, 201);
          break;
        case "update": {
          const values = this.rowsOf()[0] ?? {};
          const keys = Object.keys(values);
          if (keys.length === 0) return ok(this.returning === null ? null : [], null);
          const set = keys
            .map((k) => {
              params.push(values[k]);
              return `${quoteIdent(k)} = $${params.length}`;
            })
            .join(", ");
          sql = `UPDATE ${table} SET ${set}${this.whereSql(params)}${this.returningSql()}`;
          break;
        }
        case "delete":
          sql = `DELETE FROM ${table}${this.whereSql(params)}${this.returningSql()}`;
          break;
      }

      const pool = await getPool();
      const res = await pool.query(sql, params as any[]);
      const isWrite = this.action !== "select";
      let data: any = isWrite && this.returning === null ? null : res.rows;

      if (this.singleMode && Array.isArray(data)) {
        if (data.length > 1) {
          return fail(
            {
              message: "JSON object requested, multiple (or no) rows returned",
              code: "PGRST116",
              details: `The result contains ${data.length} rows`,
              hint: null,
            },
            406,
          );
        }
        if (data.length === 0) {
          if (this.singleMode === "single") {
            return fail(
              {
                message: "JSON object requested, multiple (or no) rows returned",
                code: "PGRST116",
                details: "The result contains 0 rows",
                hint: null,
              },
              406,
            );
          }
          data = null;
        } else data = data[0];
      }
      return ok(data, count, this.action === "insert" || this.action === "upsert" ? 201 : 200);
    } catch (err) {
      return fail(toPgError(err), 400);
    }
  }

  then<R1 = PgResult<T>, R2 = never>(
    onfulfilled?: ((value: PgResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

/** شیء/آرایه (ستون‌های json) به رشته JSON تبدیل می‌شود؛ مثل ارسال JSON به PostgREST */
function normalizeValue(value: unknown): unknown {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function ok(data: any, count: number | null, status = 200): PgResult<any> {
  return { data, error: null, count, status, statusText: "OK" };
}

function fail(error: PgError, status: number): PgResult<any> {
  return { data: null, error, count: null, status, statusText: "Error" };
}

export function createPgDb() {
  return {
    from(table: string) {
      return new PgQueryBuilder(table);
    },
    async rpc(): Promise<PgResult<null>> {
      return fail(
        {
          message: "rpc روی Postgres مستقیم پشتیبانی نمی‌شود",
          code: "UNSUPPORTED",
          details: null,
          hint: null,
        },
        400,
      );
    },
  };
}
