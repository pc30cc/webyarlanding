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
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || !timingSafeMatch(token, secret)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { loadSettings } = await import("@/lib/settings.server");
  const settings = await loadSettings();
  if (!settings.searchConsole.enabled) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "disabled" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { runSeoReview, formatReviewForTelegram, pruneProposals } = await import(
    "@/lib/seoproposals.server"
  );
  const result = await runSeoReview("cron");
  await pruneProposals();
  if (settings.searchConsole.notifyTelegram) {
    const { sendProposalsForApproval } = await import("@/lib/telegram.server");
    await sendProposalsForApproval(formatReviewForTelegram(result), result.created);
  }

  return new Response(
    JSON.stringify({ ok: true, created: result.created.length, pending: result.pendingCount }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export const Route = createFileRoute("/api/public/seo-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
