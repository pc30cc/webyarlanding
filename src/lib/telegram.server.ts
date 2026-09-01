// ربات مدیریتی تلگرام — فقط سمت سرور. مستقیم با Telegram Bot API صحبت می‌کند (بدون SDK).
import { db } from "./db.server";
import { loadSettings, loadTelegramKeys } from "./settings.server";
import type { SiteSettings } from "./settings";

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramChat {
  id: number;
}

interface TelegramMessage {
  chat: TelegramChat;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: { chat: TelegramChat };
}

export interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface InlineButton {
  text: string;
  callback_data: string;
}

async function tgCall<T = unknown>(
  botToken: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) throw new Error(`تلگرام (${method}): ${data.description ?? res.status}`);
  return data.result as T;
}

function adminChatIdList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAuthorized(chatId: number, adminChatIds: string): boolean {
  return adminChatIdList(adminChatIds).includes(String(chatId));
}

/** ثبت وبهوک ربات نزد تلگرام + تعریف لیست دستورات منو */
export async function setTelegramWebhook(
  botToken: string,
  url: string,
  secretToken: string,
): Promise<void> {
  await tgCall(botToken, "setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });
  await tgCall(botToken, "setMyCommands", {
    commands: [
      { command: "start", description: "شروع و نمایش منو" },
      { command: "menu", description: "نمایش منوی مدیریت" },
    ],
  });
}

export async function getTelegramWebhookInfo(botToken: string): Promise<{
  url: string;
  pending_update_count: number;
  last_error_message?: string;
}> {
  return await tgCall(botToken, "getWebhookInfo");
}

function buildMainMenu(settings: SiteSettings): InlineButton[][] {
  const t = settings.telegram;
  return [
    [{ text: "📊 آمار بازدید سایت", callback_data: "stats" }],
    [{ text: "📰 وضعیت مقالات", callback_data: "posts_status" }],
    [{ text: "✍️ تولید مقاله جدید", callback_data: "generate_post" }],
    [{ text: "📩 پیام‌های تماس", callback_data: "messages" }],
    [
      {
        text: `🔔 اعلان بازدید لحظه‌ای: ${t.notifyOnVisit ? "روشن ✅" : "خاموش ⛔"}`,
        callback_data: "toggle_notify_visit",
      },
    ],
    [
      {
        text: `📢 پست خودکار در کانال: ${t.notifyOnPublish ? "روشن ✅" : "خاموش ⛔"}`,
        callback_data: "toggle_notify_publish",
      },
    ],
  ];
}

async function sendMainMenu(
  chatId: number,
  settings: SiteSettings,
  botToken: string,
): Promise<void> {
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: "🤖 منوی مدیریت وب‌یار — یکی از گزینه‌ها را انتخاب کنید:",
    reply_markup: { inline_keyboard: buildMainMenu(settings) },
  });
}

async function getVisitStatsText(): Promise<string> {
  const { getVisitStats } = await import("./analytics.server");
  const s = await getVisitStats();
  return (
    `📊 آمار بازدید سایت\n\n` +
    `🟢 آنلاین الان: ${s.onlineNow} نفر\n` +
    `📅 امروز: ${s.today}\n` +
    `🗓 این هفته: ${s.thisWeek}\n` +
    `📆 این ماه: ${s.thisMonth}`
  );
}

async function getPostsStatusText(): Promise<string> {
  const { data } = await db
    .from("blog_posts")
    .select("title, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = data ?? [];
  const published = rows.filter((r) => r.status === "published").length;
  const draft = rows.length - published;
  const latest = rows[0];
  return (
    `📰 وضعیت مقالات\n\n` +
    `کل: ${rows.length}\n` +
    `منتشرشده: ${published}\n` +
    `پیش‌نویس: ${draft}` +
    (latest ? `\n\nآخرین مقاله:\n${latest.title}` : "")
  );
}

async function getMessagesText(): Promise<string> {
  const { data } = await db.from("contact_messages").select("status").limit(1000);
  const rows = data ?? [];
  const unread = rows.filter((r) => r.status !== "read").length;
  return `📩 پیام‌های تماس\n\nخوانده‌نشده: ${unread}\nکل: ${rows.length}`;
}

async function handleGeneratePost(chatId: number, botToken: string): Promise<void> {
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: "⏳ در حال تولید مقاله جدید با هوش مصنوعی... (ممکن است چند ده ثانیه طول بکشد)",
  });
  const { runAutoblog } = await import("./autoblog.server");
  const result = await runAutoblog("manual", { ignoreHourCheck: true });
  if (result.ok && !result.skipped) {
    await tgCall(botToken, "sendMessage", {
      chat_id: chatId,
      text: "✅ مقاله جدید ساخته و ذخیره شد. اگر پست خودکار کانال روشن باشد، به‌زودی در کانال هم منتشر می‌شود.",
    });
  } else {
    const reason = "error" in result ? result.error : "reason" in result ? result.reason : "نامشخص";
    await tgCall(botToken, "sendMessage", {
      chat_id: chatId,
      text: `⚠️ تولید مقاله انجام نشد: ${reason}`,
    });
  }
}

async function toggleTelegramFlag(
  field: "notifyOnVisit" | "notifyOnPublish",
): Promise<SiteSettings> {
  const { saveSettings } = await import("./settings.server");
  const settings = await loadSettings();
  settings.telegram[field] = !settings.telegram[field];
  await saveSettings(settings);
  return settings;
}

async function handleMessage(
  message: TelegramMessage,
  settings: SiteSettings,
  botToken: string,
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text ?? "";

  if (!isAuthorized(chatId, settings.telegram.adminChatIds)) {
    await tgCall(botToken, "sendMessage", {
      chat_id: chatId,
      text: `سلام! برای استفاده از این ربات، شناسه چت زیر را به مدیر سایت بدهید تا در پنل ادمین فعال شود:\n\n${chatId}`,
    });
    return;
  }

  if (text.startsWith("/start") || text.startsWith("/menu")) {
    await sendMainMenu(chatId, settings, botToken);
    return;
  }

  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: "برای دیدن منوی مدیریت، دستور /menu را بفرستید.",
  });
}

async function handleCallback(
  cq: TelegramCallbackQuery,
  settings: SiteSettings,
  botToken: string,
): Promise<void> {
  const chatId = cq.message?.chat.id;
  if (!chatId) return;

  if (!isAuthorized(chatId, settings.telegram.adminChatIds)) {
    await tgCall(botToken, "answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "دسترسی ندارید",
    });
    return;
  }

  await tgCall(botToken, "answerCallbackQuery", { callback_query_id: cq.id });

  switch (cq.data) {
    case "stats":
      await tgCall(botToken, "sendMessage", { chat_id: chatId, text: await getVisitStatsText() });
      break;
    case "posts_status":
      await tgCall(botToken, "sendMessage", { chat_id: chatId, text: await getPostsStatusText() });
      break;
    case "messages":
      await tgCall(botToken, "sendMessage", { chat_id: chatId, text: await getMessagesText() });
      break;
    case "generate_post":
      await handleGeneratePost(chatId, botToken);
      break;
    case "toggle_notify_visit": {
      const next = await toggleTelegramFlag("notifyOnVisit");
      await sendMainMenu(chatId, next, botToken);
      break;
    }
    case "toggle_notify_publish": {
      const next = await toggleTelegramFlag("notifyOnPublish");
      await sendMainMenu(chatId, next, botToken);
      break;
    }
    default:
      break;
  }
}

/** نقطه ورود اصلی webhook — دیسپچ پیام‌ها و کلیک روی دکمه‌های منو */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const [settings, keys] = await Promise.all([loadSettings(), loadTelegramKeys()]);
  if (!keys.telegramBotToken) return;

  if (update.message) {
    await handleMessage(update.message, settings, keys.telegramBotToken);
  } else if (update.callback_query) {
    await handleCallback(update.callback_query, settings, keys.telegramBotToken);
  }
}

/** اعلان لحظه‌ای به همه‌ی مدیران وقتی بازدیدکننده‌ی جدیدی وارد سایت می‌شود */
export async function notifyNewVisit(path: string): Promise<void> {
  const settings = await loadSettings();
  if (!settings.telegram.enabled || !settings.telegram.notifyOnVisit) return;
  const ids = adminChatIdList(settings.telegram.adminChatIds);
  if (ids.length === 0) return;
  const keys = await loadTelegramKeys();
  if (!keys.telegramBotToken) return;

  const text = `👀 یک بازدیدکننده جدید وارد سایت شد\n\nصفحه: ${path}`;
  await Promise.all(
    ids.map((id) =>
      tgCall(keys.telegramBotToken, "sendMessage", { chat_id: id, text }).catch((e) =>
        console.error("notifyNewVisit: send failed for", id, e),
      ),
    ),
  );
}

/** پست خودکار در کانال، وقتی مقاله‌ای (دستی یا خودکار) تازه منتشر می‌شود */
export async function notifyPublishedPost(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
}): Promise<void> {
  const settings = await loadSettings();
  if (!settings.telegram.enabled || !settings.telegram.notifyOnPublish) return;
  if (!settings.telegram.channelId) return;
  const keys = await loadTelegramKeys();
  if (!keys.telegramBotToken) return;

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const url = `${base}/blog/${post.slug}`;
  const text =
    `📝 مقاله جدید منتشر شد\n\n${post.title}\n\n${post.excerpt || ""}\n\n🔗 ${url}`.trim();

  try {
    if (post.coverImage) {
      try {
        await tgCall(keys.telegramBotToken, "sendPhoto", {
          chat_id: settings.telegram.channelId,
          photo: post.coverImage,
          caption: text,
        });
      } catch (photoError) {
        // اگر ارسال عکس شکست بخورد (مثلاً آدرس تصویر برای تلگرام قابل‌دسترس نبود)، حداقل خود
        // مقاله به‌صورت متنی در کانال پست شود تا انتشار به‌طور کامل از دست نرود
        console.error("notifyPublishedPost: sendPhoto failed, falling back to text:", photoError);
        await tgCall(keys.telegramBotToken, "sendMessage", {
          chat_id: settings.telegram.channelId,
          text,
        });
      }
    } else {
      await tgCall(keys.telegramBotToken, "sendMessage", {
        chat_id: settings.telegram.channelId,
        text,
      });
    }
    if (settings.telegram.lastChannelPostError) {
      const { saveSettings } = await import("./settings.server");
      settings.telegram.lastChannelPostError = "";
      settings.telegram.lastChannelPostErrorAt = "";
      await saveSettings(settings);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("notifyPublishedPost: telegram send failed:", e);
    try {
      const { saveSettings } = await import("./settings.server");
      settings.telegram.lastChannelPostError = message.slice(0, 500);
      settings.telegram.lastChannelPostErrorAt = new Date().toISOString();
      await saveSettings(settings);
    } catch (saveError) {
      console.error("notifyPublishedPost: failed to persist last error:", saveError);
    }
  }
}
