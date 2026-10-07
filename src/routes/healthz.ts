import { createFileRoute } from "@tanstack/react-router";

// Lightweight liveness probe for Coolify/Docker healthchecks (no DB access).
export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: async () =>
        new Response("ok", {
          headers: { "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
        }),
    },
  },
});
