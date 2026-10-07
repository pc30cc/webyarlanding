#!/usr/bin/env node
// انتقال کامل دیتابیس از Supabase به PostgreSQL سلف‌هاست (کانتینر Coolify).
//
// دو روش (به ترتیب اولویت):
//   ۱) SOURCE_DATABASE_URL (رشته اتصال مستقیم Postgres پروژه Supabase) + pg_dump نصب‌شده
//      → ساختار و داده دقیقاً همان‌طور که در Supabase هست (ستون‌ها، پیش‌فرض‌ها، ایندکس‌ها،
//        محدودیت‌ها) با pg_dump منتقل می‌شود؛ بخش‌های مخصوص Supabase (RLS/policy/grant) حذف می‌شوند.
//   ۲) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (همان متغیرهایی که سایت الان دارد)
//      → اسکیمای db/schema.sql روی مقصد ساخته می‌شود، فهرست واقعی جدول‌ها/ستون‌ها از OpenAPI
//        خود Supabase خوانده می‌شود، ستون‌های جاافتاده اضافه می‌شوند و همه ردیف‌ها صفحه‌به‌صفحه
//        در یک تراکنش منتقل می‌شوند.
// در هر دو حالت در پایان تعداد ردیف تک‌تک جدول‌ها در مبدأ و مقصد مقایسه می‌شود.
//
// مقصد: TARGET_DATABASE_URL (یا DATABASE_URL).
// اجرا:  node scripts/db/migrate-from-supabase.mjs [--force] [--method=dump|api]
//   --force  اگر جدول‌های مقصد داده داشته باشند، پاک و دوباره پر می‌شوند (بدون آن متوقف می‌شود).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_SQL = readFileSync(join(here, "../../db/schema.sql"), "utf8");
const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const methodArg = [...args].find((a) => a.startsWith("--method="))?.split("=")[1];

const TARGET = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
const SOURCE_DB = process.env.SOURCE_DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// جدول‌هایی که ارزش انتقال ندارند (حضور لحظه‌ای آنلاین‌ها)
const SKIP_DATA = new Set((process.env.SKIP_TABLES ?? "site_presence").split(",").filter(Boolean));

const log = (...m) => console.log("•", ...m);
const die = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

if (!TARGET) die("TARGET_DATABASE_URL (یا DATABASE_URL) برای دیتابیس مقصد تنظیم نشده است.");
if (SOURCE_DB && TARGET.trim() === SOURCE_DB.trim()) die("مبدأ و مقصد یکی هستند!");

const q = (name) => `"${String(name).replace(/"/g, '""')}"`;

function connect(url) {
  const ssl = /sslmode=(require|verify|prefer)/i.test(url) || /supabase\.(co|com)/i.test(url);
  return new pg.Client({
    connectionString: url.replace(/([?&])sslmode=[^&]*&?/i, "$1").replace(/[?&]$/, ""),
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    options: "-c timezone=UTC",
  });
}

async function targetTableCounts(client) {
  const { rows } = await client.query(
    `select c.relname as name from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' order by 1`,
  );
  const out = {};
  for (const { name } of rows) {
    const r = await client.query(`select count(*)::bigint as c from public.${q(name)}`);
    out[name] = Number(r.rows[0].c);
  }
  return out;
}

async function guardTargetEmpty(client) {
  const counts = await targetTableCounts(client);
  const nonEmpty = Object.entries(counts).filter(
    ([name, c]) => c > 0 && name !== "autoblog_settings" && name !== "backup_runs",
  );
  if (nonEmpty.length && !FORCE) {
    die(
      `دیتابیس مقصد خالی نیست (${nonEmpty.map(([n, c]) => `${n}=${c}`).join(", ")}).\n` +
        "  برای پاک کردن و انتقال دوباره، با --force اجرا کنید.",
    );
  }
}

function printReport(source, target) {
  const names = [...new Set([...Object.keys(source), ...Object.keys(target)])].sort();
  let ok = true;
  console.log("\n  جدول                        مبدأ      مقصد");
  for (const n of names) {
    const s = source[n];
    const t = target[n];
    const skipped = SKIP_DATA.has(n);
    const match = skipped || s === undefined || s === t;
    if (!match) ok = false;
    console.log(
      `  ${match ? "✓" : "✖"} ${n.padEnd(26)} ${String(s ?? "-").padStart(8)}  ${String(t ?? "-").padStart(8)}${skipped ? "  (رد شد)" : ""}`,
    );
  }
  if (!ok) die("تعداد ردیف‌ها در بعضی جدول‌ها یکی نیست — جزئیات بالا را ببینید.");
  console.log("\n✔ انتقال کامل و تأییدشده انجام شد.\n");
}

/* ───────────── روش ۱: pg_dump ───────────── */

function hasPgDump() {
  const r = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function filterDump(sql) {
  // حذف هر چیزی که به نقش‌ها/امکانات مخصوص Supabase وابسته است
  return sql
    .split("\n")
    .filter(
      (line) =>
        !/^(ALTER TABLE .* ENABLE ROW LEVEL SECURITY|ALTER TABLE .* FORCE ROW LEVEL SECURITY|CREATE POLICY |ALTER DEFAULT PRIVILEGES|GRANT |REVOKE |COMMENT ON SCHEMA public|CREATE SCHEMA public;|DROP SCHEMA IF EXISTS public;|SET transaction_timeout)/.test(
          line,
        ),
    )
    .join("\n");
}

async function migrateWithDump() {
  log("روش: pg_dump (ساختار و داده دقیق Supabase)");
  const dump = spawnSync(
    "pg_dump",
    [
      "--schema=public",
      "--no-owner",
      "--no-privileges",
      "--no-comments",
      "--no-publications",
      "--no-subscriptions",
      "--clean",
      "--if-exists",
      ...[...SKIP_DATA].map((t) => `--exclude-table-data=public.${t}`),
      SOURCE_DB,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024 },
  );
  if (dump.status !== 0) die(`pg_dump شکست خورد:\n${dump.stderr}`);
  const sql = filterDump(dump.stdout);
  log(`dump گرفته شد (${(sql.length / 1024 / 1024).toFixed(2)} MB)`);

  const target = connect(TARGET);
  await target.connect();
  await guardTargetEmpty(target);
  const restore = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-d", TARGET], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (restore.error) die("psql نصب نیست (یا از ایمیج docker/migrate/Dockerfile استفاده کنید).");
  if (restore.status !== 0) die(`اعمال dump روی مقصد شکست خورد (هیچ تغییری ذخیره نشد):\n${restore.stderr}`);
  log("ساختار و داده روی مقصد اعمال شد");
  await target.query("set client_min_messages = warning");
  await target.query(SCHEMA_SQL);
  log("db/schema.sql اعمال شد (جدول‌های جدیدتر مثل backup_runs)");

  const source = connect(SOURCE_DB);
  await source.connect();
  const sCounts = await targetTableCounts(source);
  const tCounts = await targetTableCounts(target);
  await source.end();
  await target.end();
  printReport(sCounts, tCounts);
}

/* ───────────── روش ۲: API سرویس Supabase ───────────── */

function restHeaders(extra = {}) {
  const h = { apikey: SERVICE_KEY, Accept: "application/json", ...extra };
  if (!SERVICE_KEY.startsWith("sb_")) h.Authorization = `Bearer ${SERVICE_KEY}`;
  return h;
}

async function discoverTables() {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/`, {
    headers: restHeaders({ Accept: "application/openapi+json" }),
  });
  if (!res.ok) die(`خواندن ساختار Supabase ناموفق بود: ${res.status} ${await res.text()}`);
  const spec = await res.json();
  const defs = spec.definitions ?? spec.components?.schemas ?? {};
  const tables = {};
  for (const [name, def] of Object.entries(defs)) {
    tables[name] = Object.entries(def.properties ?? {}).map(([col, p]) => ({
      name: col,
      format: p.format ?? p.type ?? "text",
      maxLength: p.maxLength,
    }));
  }
  return tables;
}

function pgTypeFromFormat(c) {
  const f = String(c.format).toLowerCase();
  if (f.startsWith("character varying")) return c.maxLength ? `varchar(${c.maxLength})` : "text";
  if (/^(text|smallint|integer|bigint|boolean|jsonb|json|uuid|date|numeric|real|double precision)$/.test(f)) return f;
  if (f.startsWith("timestamp with time zone")) return "timestamptz";
  if (f.startsWith("timestamp")) return "timestamp";
  return "text";
}

async function fetchAllRows(table) {
  const rows = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}?select=*`,
      { headers: restHeaders({ Range: `${from}-${from + page - 1}`, "Range-Unit": "items" }) },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < page) return rows;
  }
}

async function sourceCount(table) {
  const res = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}?select=*`,
    { method: "HEAD", headers: restHeaders({ Prefer: "count=exact", Range: "0-0" }) },
  );
  const range = res.headers.get("content-range") ?? "";
  return Number(range.split("/")[1] ?? NaN);
}

async function migrateWithApi() {
  log("روش: API سرویس Supabase (PostgREST)");
  const tables = await discoverTables();
  const names = Object.keys(tables).sort();
  log(`${names.length} جدول در Supabase پیدا شد: ${names.join(", ")}`);

  const target = connect(TARGET);
  await target.connect();
  await target.query("set client_min_messages = warning");
  await target.query(SCHEMA_SQL);
  log("اسکیمای db/schema.sql روی مقصد ساخته شد");
  await guardTargetEmpty(target);

  // جدول یا ستونی که در Supabase هست ولی در schema.sql نیست، با نوع واقعی‌اش ساخته می‌شود
  for (const name of names) {
    const cols = tables[name];
    const existing = await target.query(
      `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
      [name],
    );
    if (existing.rowCount === 0) {
      const pk = cols.some((c) => c.name === "id") ? ", primary key (id)" : "";
      await target.query(
        `create table public.${q(name)} (${cols.map((c) => `${q(c.name)} ${pgTypeFromFormat(c)}`).join(", ")}${pk})`,
      );
      log(`جدول ناموجود ساخته شد: ${name}`);
      continue;
    }
    const have = new Set(existing.rows.map((r) => r.column_name));
    for (const c of cols.filter((c) => !have.has(c.name))) {
      await target.query(`alter table public.${q(name)} add column ${q(c.name)} ${pgTypeFromFormat(c)}`);
      log(`ستون ناموجود اضافه شد: ${name}.${c.name}`);
    }
  }

  const sourceCounts = {};
  await target.query("begin");
  try {
    for (const name of names) {
      await target.query(`truncate public.${q(name)}`);
      if (SKIP_DATA.has(name)) continue;
      const rows = await fetchAllRows(name);
      sourceCounts[name] = rows.length;
      const cols = tables[name].map((c) => c.name);
      const batch = Math.max(1, Math.floor(60000 / Math.max(1, cols.length)));
      for (let i = 0; i < rows.length; i += Math.min(batch, 500)) {
        const chunk = rows.slice(i, i + Math.min(batch, 500));
        const params = [];
        const values = chunk
          .map(
            (r) =>
              `(${cols
                .map((c) => {
                  const v = r[c];
                  params.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v);
                  return `$${params.length}`;
                })
                .join(", ")})`,
          )
          .join(", ");
        await target.query(
          `insert into public.${q(name)} (${cols.map(q).join(", ")}) values ${values}`,
          params,
        );
      }
      log(`${name}: ${rows.length} ردیف`);
    }
    await target.query("commit");
  } catch (e) {
    await target.query("rollback");
    die(`انتقال شکست خورد و هیچ تغییری روی مقصد اعمال نشد: ${e.message}`);
  }

  // تأیید نهایی: شمارش مستقیم از Supabase (نه طول آرایه خوانده‌شده)
  for (const name of Object.keys(sourceCounts)) sourceCounts[name] = await sourceCount(name);
  const tCounts = await targetTableCounts(target);
  await target.end();
  printReport(sourceCounts, Object.fromEntries(names.map((n) => [n, tCounts[n]])));
}

/* ───────────── اجرا ───────────── */

const method =
  methodArg ?? (SOURCE_DB && hasPgDump() ? "dump" : SUPABASE_URL && SERVICE_KEY ? "api" : null);
if (method === "dump") {
  if (!SOURCE_DB) die("برای روش dump، SOURCE_DATABASE_URL لازم است.");
  if (!hasPgDump()) die("pg_dump نصب نیست (یا از ایمیج docker/migrate/Dockerfile استفاده کنید).");
  await migrateWithDump();
} else if (method === "api") {
  if (!SUPABASE_URL || !SERVICE_KEY) die("SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY لازم است.");
  await migrateWithApi();
} else {
  die(
    "مبدأ مشخص نیست: یا SOURCE_DATABASE_URL (+pg_dump) یا SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY را تنظیم کنید.",
  );
}
