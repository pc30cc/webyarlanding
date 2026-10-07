// بک‌آپ و بازیابی واقعی PostgreSQL با pg_dump / psql (فقط در حالت DATABASE_URL).
// خروجی یک فایل SQL متنی فشرده (.sql.gz) است که با psql هم بیرون از پنل قابل بازیابی است:
//   gunzip -c backup.sql.gz | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction
// باینری‌های pg_dump/psql از طریق nixpacks.toml (postgresql_17) داخل ایمیج نصب می‌شوند.
import { spawn } from "node:child_process";
import { gunzipSync, gzipSync } from "node:zlib";
import { getDatabaseUrl } from "./pg-db.server";

/** جدول تاریخچه بک‌آپ‌ها داخل dump نمی‌رود تا بازیابی، تاریخچه را پاک نکند */
const EXCLUDED_TABLES = ["public.backup_runs"];

function run(
  cmd: string,
  args: string[],
  input?: Buffer,
): Promise<{ code: number; stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    child.stdout.on("data", (d: Buffer) => out.push(d));
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: err }),
    );
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

let toolsAvailable: boolean | null = null;

export async function hasPgTools(): Promise<boolean> {
  if (toolsAvailable !== null) return toolsAvailable;
  try {
    const [dump, psql] = await Promise.all([
      run("pg_dump", ["--version"]),
      run("psql", ["--version"]),
    ]);
    toolsAvailable = dump.code === 0 && psql.code === 0;
  } catch {
    toolsAvailable = false;
  }
  return toolsAvailable;
}

function requireUrl(): string {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL تنظیم نشده است");
  return url;
}

/** dump کامل اسکیمای public (ساختار + داده) به‌صورت SQL فشرده */
export async function dumpDatabase(): Promise<Buffer> {
  const res = await run("pg_dump", [
    "--format=plain",
    "--schema=public",
    "--no-owner",
    "--no-privileges",
    "--clean",
    "--if-exists",
    "--quote-all-identifiers",
    ...EXCLUDED_TABLES.map((t) => `--exclude-table=${t}`),
    `--dbname=${requireUrl()}`,
  ]);
  if (res.code !== 0) throw new Error(`pg_dump ناموفق بود: ${res.stderr.slice(0, 500)}`);
  if (res.stdout.length === 0) throw new Error("pg_dump خروجی خالی داد");
  // خودِ اسکیمای public حذف/ساخته نشود (وابستگی‌های دیگر دارد)؛ فقط اشیای داخلش
  const sql = res.stdout
    .toString("utf8")
    .split("\n")
    .filter(
      (line) =>
        !/^(DROP SCHEMA IF EXISTS "public";|CREATE SCHEMA "public";|COMMENT ON SCHEMA "public")/.test(
          line,
        ),
    )
    .join("\n");
  return gzipSync(Buffer.from(sql, "utf8"), { level: 9 });
}

/** بازیابی یک dump فشرده در یک تراکنش؛ در صورت هر خطا هیچ تغییری اعمال نمی‌شود */
export async function restoreDump(gz: ArrayBuffer): Promise<void> {
  const sql = gunzipSync(Buffer.from(gz));
  const res = await run(
    "psql",
    ["-v", "ON_ERROR_STOP=1", "--single-transaction", "-q", "-X", `--dbname=${requireUrl()}`],
    sql,
  );
  if (res.code !== 0) throw new Error(`بازیابی با psql ناموفق بود: ${res.stderr.slice(0, 500)}`);
}
