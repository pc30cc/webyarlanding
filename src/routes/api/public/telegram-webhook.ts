import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { loadTelegramKeys } = await import("@/lib/settings.server");
        const keys = await loadTelegramKeys();

        // بدون رمز وبهوک تنظیم‌شده، هیچ درخواستی معتبر شمرده نمی‌شود
        const secret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!keys.telegramWebhookSecret || secret !== keys.telegramWebhookSecret) {
          return new Response("unauthorized", { status: 401 });
        }

        let update: unknown;
        try {
          update = await request.json();
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const { handleTelegramUpdate } = await import("@/lib/telegram.server");
        try {
          await handleTelegramUpdate(update as Parameters<typeof handleTelegramUpdate>[0]);
        } catch (e) {
          console.error("telegram webhook handling failed:", e);
        }

        // تلگرام فقط ۲۰۰ می‌خواهد؛ خطای منطق داخلی نباید باعث retry بی‌پایان از سمت تلگرام شود
        return new Response("ok", { status: 200 });
      },
    },
  },
});
