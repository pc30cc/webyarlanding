import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual, createHash } from "node:crypto";

function timingSafeMatch(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

async function handle(request: Request): Promise<Response> {
  const secret = process.env["LOVABLE_CRON_SECRET"];
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: "cron_secret_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token || !timingSafeMatch(token, secret)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { runAutoblog } = await import("@/lib/autoblog.server");
  const result = await runAutoblog("cron");

  return new Response(
    JSON.stringify({
      ok: result.ok,
      skipped: "skipped" in result ? result.skipped : false,
      reason: "reason" in result ? result.reason : undefined,
      hourUtc: new Date().getUTCHours(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export const Route = createFileRoute("/api/public/autoblog-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
