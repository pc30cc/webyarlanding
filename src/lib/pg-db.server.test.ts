// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
// تست یکپارچه کلاینت Postgres روی یک دیتابیس واقعی. فقط وقتی اجرا می‌شود که
// TEST_DATABASE_URL تنظیم شده باشد (مثلاً postgres://postgres@localhost:5432/webyar_test).
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["TEST_DATABASE_URL"];

describe.skipIf(!url)("pg-db (Supabase-compatible query builder)", () => {
  let db: ReturnType<typeof import("./pg-db.server").createPgDb>;
  let pgQuery: typeof import("./pg-db.server").pgQuery;

  beforeAll(async () => {
    process.env["DATABASE_URL"] = url;
    const mod = await import("./pg-db.server");
    db = mod.createPgDb();
    pgQuery = mod.pgQuery;
    await pgQuery("truncate public.blog_tags, public.site_presence, public.scheduler_runs");
  });

  it("insert / select / filters / order / range", async () => {
    const ins = await db.from("blog_tags").insert([
      { id: "t1", slug: "a", name: "آلفا", sort_order: 2 },
      { id: "t2", slug: "b", name: "بتا", sort_order: 1, description: { x: 1 } },
      { id: "t3", slug: "c", name: "گاما", sort_order: 3, description: undefined },
    ]);
    expect(ins.error).toBeNull();
    expect(ins.data).toBeNull();

    const all = await db.from("blog_tags").select("id, name").order("sort_order");
    expect(all.data!.map((r: any) => r.id)).toEqual(["t2", "t1", "t3"]);
    expect(Object.keys(all.data![0])).toEqual(["id", "name"]);

    const page = await db
      .from("blog_tags")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: false })
      .range(1, 1);
    expect(page.count).toBe(3);
    expect(page.data!.map((r: any) => r.id)).toEqual(["t1"]);

    const head = await db
      .from("blog_tags")
      .select("id", { count: "exact", head: true })
      .gte("sort_order", 2);
    expect(head.count).toBe(2);
    expect(head.data).toBeNull();

    const inq = await db.from("blog_tags").select("id").in("id", ["t1", "t3"]).order("id");
    expect(inq.data!.map((r: any) => r.id)).toEqual(["t1", "t3"]);
    const emptyIn = await db.from("blog_tags").select("id").in("id", []);
    expect(emptyIn.data).toEqual([]);

    const ilike = await db.from("blog_tags").select("id").ilike("slug", "%B%");
    expect(ilike.data).toEqual([{ id: "t2" }]);

    const json = await db.from("blog_tags").select("description").eq("id", "t2").single();
    expect(json.data).toEqual({ description: '{"x":1}' });

    const ts = await db.from("blog_tags").select("created_at").eq("id", "t1").single();
    expect(ts.data!.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("single / maybeSingle semantics", async () => {
    const none = await db.from("blog_tags").select("*").eq("id", "nope").maybeSingle();
    expect(none).toMatchObject({ data: null, error: null });
    const noneSingle = await db.from("blog_tags").select("*").eq("id", "nope").single();
    expect(noneSingle.error?.code).toBe("PGRST116");
    const many = await db.from("blog_tags").select("*").maybeSingle();
    expect(many.error?.code).toBe("PGRST116");
  });

  it("update / delete / not / match / returning", async () => {
    const upd = await db
      .from("blog_tags")
      .update({ name: "تغییر" })
      .match({ id: "t1", slug: "a" })
      .select()
      .single();
    expect(upd.data!.name).toBe("تغییر");

    const del = await db.from("blog_tags").delete().neq("id", "t1");
    expect(del.error).toBeNull();
    const left = await db.from("blog_tags").select("id");
    expect(left.data).toEqual([{ id: "t1" }]);

    await db.from("blog_tags").delete().not("id", "is", null);
    expect((await db.from("blog_tags").select("id")).data).toEqual([]);
  });

  it("upsert with onConflict and errors without throwing", async () => {
    await db
      .from("site_presence")
      .upsert({ session_id: "s1", path: "/a" }, { onConflict: "session_id" });
    await db
      .from("site_presence")
      .upsert({ session_id: "s1", path: "/b" }, { onConflict: "session_id" });
    const row = await db.from("site_presence").select("path").eq("session_id", "s1").single();
    expect(row.data!.path).toBe("/b");

    await db.from("scheduler_runs").upsert({ job: "x", last_status: "ok" });
    const tz = await db.from("scheduler_runs").select("last_run_at").eq("job", "x").single();
    expect(tz.data!.last_run_at).toMatch(/\+00:00$/);

    const dup = await db.from("site_presence").insert({ session_id: "s1", path: "/c" });
    expect(dup.error?.code).toBe("23505");
    const missing = await db.from("no_such_table").select("*");
    expect(missing.error?.code).toBe("42P01");
  });
});
