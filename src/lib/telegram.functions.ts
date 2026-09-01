import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(6)}${key.slice(-4)}`;
}

/** وضعیت توکن ربات و اتصال وبهوک — مقدار واقعی توکن هرگز به کلاینت برنمی‌گردد */
export const adminGetTelegramKeysStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadTelegramKeys } = await import("./settings.server");
  const keys = await loadTelegramKeys();
  return {
    botTokenSet: !!keys.telegramBotToken,
    botTokenPreview: maskKey(keys.telegramBotToken),
    webhookConfigured: !!keys.telegramWebhookSecret,
  };
});

const saveTokenSchema = z.object({
  botToken: z.string().optional(),
  clearBotToken: z.boolean().optional().default(false),
});

/** ذخیره یا حذف توکن ربات تلگرام */
export const adminSaveTelegramBotToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveTokenSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveTelegramKeys } = await import("./settings.server");
    if (data.clearBotToken)
      await saveTelegramKeys({ telegramBotToken: "", telegramWebhookSecret: "" });
    else if (data.botToken) await saveTelegramKeys({ telegramBotToken: data.botToken });
    return { ok: true };
  });

/** ثبت وبهوک ربات نزد تلگرام — پس از وارد کردن توکن، یک بار اجرا شود */
export const adminConnectTelegramWebhook = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: boolean; message: string }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { loadTelegramKeys, saveTelegramKeys, loadSettings } = await import("./settings.server");
    const keys = await loadTelegramKeys();
    if (!keys.telegramBotToken) {
      return { ok: false, message: "ابتدا توکن ربات را ذخیره کنید." };
    }
    const settings = await loadSettings();
    const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
    if (!base) {
      return { ok: false, message: "ابتدا آدرس سایت را در تنظیمات برند وارد کنید." };
    }
    try {
      const webhookSecret = keys.telegramWebhookSecret || crypto.randomUUID();
      const { setTelegramWebhook } = await import("./telegram.server");
      await setTelegramWebhook(
        keys.telegramBotToken,
        `${base}/api/public/telegram-webhook`,
        webhookSecret,
      );
      await saveTelegramKeys({ telegramWebhookSecret: webhookSecret });
      return { ok: true, message: "ربات با موفقیت وصل شد." };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "خطای ناشناخته" };
    }
  },
);

/** وضعیت فعلی وبهوک نزد تلگرام — برای نمایش در پنل ادمین */
export const adminGetTelegramWebhookInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadTelegramKeys } = await import("./settings.server");
  const keys = await loadTelegramKeys();
  if (!keys.telegramBotToken) return null;
  try {
    const { getTelegramWebhookInfo } = await import("./telegram.server");
    return await getTelegramWebhookInfo(keys.telegramBotToken);
  } catch {
    return null;
  }
});
