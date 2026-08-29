import { createFileRoute } from "@tanstack/react-router";

/**
 * بررسی سلامت سرور و وجود متغیرهای محیطی (بدون افشای مقدار آن‌ها).
 * برای عیب‌یابی دیپلوی: https://<domain>/api/public/health
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
        const optional = ["SUPABASE_PUBLISHABLE_KEY", "LOVABLE_API_KEY", "LOVABLE_CRON_SECRET"];

        const present = (name: string) => Boolean(process.env[name]);
        const missing = required.filter((name) => !present(name));

        let database: string;
        if (missing.length > 0) {
          database = "skipped";
        } else {
          try {
            const { db } = await import("@/lib/db.server");
            const { error } = await db.from("settings").select("key").limit(1);
            database = error ? `error: ${error.message}` : "ok";
          } catch (error) {
            database = `error: ${error instanceof Error ? error.message : String(error)}`;
          }
        }

        const body = {
          ok: missing.length === 0 && database === "ok",
          env: {
            required: Object.fromEntries(required.map((name) => [name, present(name)])),
            optional: Object.fromEntries(optional.map((name) => [name, present(name)])),
            missing,
          },
          database,
        };

        return new Response(JSON.stringify(body, null, 2), {
          status: body.ok ? 200 : 503,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
