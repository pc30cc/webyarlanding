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
    [{ text: "🔎 بررسی سئو و محتوا (پیشنهادها)", callback_data: "seo_audit" }],
    [{ text: "📝 پیشنهادهای در انتظار تأیید", callback_data: "seo_pending" }],
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

/** ارسال یک پیشنهاد همراه دکمه‌های تأیید/رد */
async function sendProposalCard(
  chatId: number | string,
  botToken: string,
  p: { id: string; kind: string; title: string; detail: string; target: string },
): Promise<void> {
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: `📝 [${p.kind}] ${p.title}\n${p.target}\n\n${p.detail}`.slice(0, 3500),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ تأیید و اعمال", callback_data: `spok:${p.id}` },
          { text: "❌ رد", callback_data: `spno:${p.id}` },
        ],
      ],
    },
  });
}

async function handleSeoAudit(chatId: number, botToken: string): Promise<void> {
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: "⏳ در حال بررسی سایت و ساخت پیشنهادها... (ممکن است یک تا دو دقیقه طول بکشد)",
  });
  try {
    const { runSeoReview, formatReviewForTelegram } = await import("./seoproposals.server");
    const result = await runSeoReview("telegram");
    await tgCall(botToken, "sendMessage", {
      chat_id: chatId,
      text: formatReviewForTelegram(result),
      disable_web_page_preview: true,
    });
    for (const p of result.created.slice(0, 10)) await sendProposalCard(chatId, botToken, p);
  } catch (e) {
    await tgCall(botToken, "sendMessage", {
      chat_id: chatId,
      text: `⚠️ بررسی سئو انجام نشد: ${e instanceof Error ? e.message : "خطای نامشخص"}`,
    });
  }
}

async function handleSeoPending(chatId: number, botToken: string): Promise<void> {
  const { listProposals } = await import("./seoproposals.server");
  const pending = await listProposals("pending");
  if (pending.length === 0) {
    await tgCall(botToken, "sendMessage", { chat_id: chatId, text: "✅ پیشنهادی در انتظار نیست." });
    return;
  }
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: `📝 ${pending.length} پیشنهاد در انتظار تأیید:`,
  });
  for (const p of pending.slice(0, 10)) await sendProposalCard(chatId, botToken, p);
}

async function handleProposalDecision(
  chatId: number,
  botToken: string,
  id: string,
  approve: boolean,
): Promise<void> {
  const { decideProposal } = await import("./seoproposals.server");
  const result = await decideProposal(id, approve);
  await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: result.ok
      ? approve
        ? "✅ پیشنهاد تأیید و روی سایت اعمال شد."
        : "❌ پیشنهاد رد شد."
      : `⚠️ اعمال نشد: ${result.error ?? "خطای نامشخص"}`,
  });
}

/** ارسال پیشنهادهای تازه به همه مدیران ربات همراه دکمه تأیید */
export async function sendProposalsForApproval(
  summary: string,
  proposals: { id: string; kind: string; title: string; detail: string; target: string }[],
): Promise<void> {
  const [settings, keys] = await Promise.all([loadSettings(), loadTelegramKeys()]);
  if (!settings.telegram.enabled || !keys.telegramBotToken) return;
  for (const chatId of adminChatIdList(settings.telegram.adminChatIds)) {
    try {
      await tgCall(keys.telegramBotToken, "sendMessage", {
        chat_id: chatId,
        text: summary,
        disable_web_page_preview: true,
      });
      for (const p of proposals.slice(0, 10)) {
        await sendProposalCard(chatId, keys.telegramBotToken, p);
      }
    } catch (e) {
      console.error("sendProposalsForApproval failed:", e);
    }
  }
}

/** ارسال یک پیام آزاد به همه مدیران مجاز ربات — برای گزارش‌هایی که از پنل اجرا می‌شوند */
export async function sendTelegramToAdmins(text: string): Promise<void> {
  const [settings, keys] = await Promise.all([loadSettings(), loadTelegramKeys()]);
  if (!settings.telegram.enabled || !keys.telegramBotToken) return;
  for (const chatId of adminChatIdList(settings.telegram.adminChatIds)) {
    try {
      await tgCall(keys.telegramBotToken, "sendMessage", {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      });
    } catch (e) {
      console.error("sendTelegramToAdmins failed:", e);
    }
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

  const data = cq.data ?? "";
  if (data.startsWith("spok:") || data.startsWith("spno:")) {
    await handleProposalDecision(chatId, botToken, data.slice(5), data.startsWith("spok:"));
    return;
  }

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
    case "seo_audit":
      await handleSeoAudit(chatId, botToken);
      break;
    case "seo_pending":
      await handleSeoPending(chatId, botToken);
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

/** نام فارسی کشورها بر اساس کد دو‌حرفی ISO 3166-1 — برای نمایش خوانا در اعلان بازدید جدید */
const COUNTRY_NAMES_FA: Record<string, string> = {
  AD: "آندورا",
  AE: "امارات متحده عربی",
  AF: "افغانستان",
  AG: "آنتیگوا و باربودا",
  AI: "آنگویلا",
  AL: "آلبانی",
  AM: "ارمنستان",
  AO: "آنگولا",
  AR: "آرژانتین",
  AS: "ساموآی آمریکا",
  AT: "اتریش",
  AU: "استرالیا",
  AW: "آروبا",
  AZ: "آذربایجان",
  BA: "بوسنی و هرزگوین",
  BB: "باربادوس",
  BD: "بنگلادش",
  BE: "بلژیک",
  BF: "بورکینافاسو",
  BG: "بلغارستان",
  BH: "بحرین",
  BI: "بوروندی",
  BJ: "بنین",
  BN: "برونئی",
  BO: "بولیوی",
  BR: "برزیل",
  BS: "باهاما",
  BT: "بوتان",
  BW: "بوتسوانا",
  BY: "بلاروس",
  BZ: "بلیز",
  CA: "کانادا",
  CD: "کنگو (جمهوری دموکراتیک)",
  CF: "آفریقای مرکزی",
  CG: "کنگو",
  CH: "سوئیس",
  CI: "ساحل عاج",
  CL: "شیلی",
  CM: "کامرون",
  CN: "چین",
  CO: "کلمبیا",
  CR: "کاستاریکا",
  CU: "کوبا",
  CV: "کیپ‌ورد",
  CY: "قبرس",
  CZ: "جمهوری چک",
  DE: "آلمان",
  DJ: "جیبوتی",
  DK: "دانمارک",
  DM: "دومینیکا",
  DO: "جمهوری دومینیکن",
  DZ: "الجزایر",
  EC: "اکوادور",
  EE: "استونی",
  EG: "مصر",
  ER: "اریتره",
  ES: "اسپانیا",
  ET: "اتیوپی",
  FI: "فنلاند",
  FJ: "فیجی",
  FR: "فرانسه",
  GA: "گابن",
  GB: "بریتانیا",
  GE: "گرجستان",
  GH: "غنا",
  GM: "گامبیا",
  GN: "گینه",
  GQ: "گینه استوایی",
  GR: "یونان",
  GT: "گواتمالا",
  GW: "گینه بیسائو",
  GY: "گویان",
  HK: "هنگ‌کنگ",
  HN: "هندوراس",
  HR: "کرواسی",
  HT: "هائیتی",
  HU: "مجارستان",
  ID: "اندونزی",
  IE: "ایرلند",
  IL: "اسرائیل",
  IN: "هند",
  IQ: "عراق",
  IR: "ایران",
  IS: "ایسلند",
  IT: "ایتالیا",
  JM: "جامائیکا",
  JO: "اردن",
  JP: "ژاپن",
  KE: "کنیا",
  KG: "قرقیزستان",
  KH: "کامبوج",
  KI: "کیریباتی",
  KM: "کومور",
  KN: "سنت کیتس و نویس",
  KP: "کره شمالی",
  KR: "کره جنوبی",
  KW: "کویت",
  KZ: "قزاقستان",
  LA: "لائوس",
  LB: "لبنان",
  LC: "سنت لوسیا",
  LI: "لیختن‌اشتاین",
  LK: "سریلانکا",
  LR: "لیبریا",
  LS: "لسوتو",
  LT: "لیتوانی",
  LU: "لوکزامبورگ",
  LV: "لتونی",
  LY: "لیبی",
  MA: "مراکش",
  MC: "موناکو",
  MD: "مولداوی",
  ME: "مونته‌نگرو",
  MG: "ماداگاسکار",
  MH: "جزایر مارشال",
  MK: "مقدونیه شمالی",
  ML: "مالی",
  MM: "میانمار",
  MN: "مغولستان",
  MO: "ماکائو",
  MR: "موریتانی",
  MT: "مالت",
  MU: "موریس",
  MV: "مالدیو",
  MW: "مالاوی",
  MX: "مکزیک",
  MY: "مالزی",
  MZ: "موزامبیک",
  NA: "نامیبیا",
  NE: "نیجر",
  NG: "نیجریه",
  NI: "نیکاراگوئه",
  NL: "هلند",
  NO: "نروژ",
  NP: "نپال",
  NR: "نائورو",
  NZ: "نیوزیلند",
  OM: "عمان",
  PA: "پاناما",
  PE: "پرو",
  PG: "پاپوآ گینه نو",
  PH: "فیلیپین",
  PK: "پاکستان",
  PL: "لهستان",
  PS: "فلسطین",
  PT: "پرتغال",
  PW: "پالائو",
  PY: "پاراگوئه",
  QA: "قطر",
  RO: "رومانی",
  RS: "صربستان",
  RU: "روسیه",
  RW: "رواندا",
  SA: "عربستان سعودی",
  SB: "جزایر سلیمان",
  SC: "سیشل",
  SD: "سودان",
  SE: "سوئد",
  SG: "سنگاپور",
  SI: "اسلوونی",
  SK: "اسلواکی",
  SL: "سیرالئون",
  SM: "سان‌مارینو",
  SN: "سنگال",
  SO: "سومالی",
  SR: "سورینام",
  SS: "سودان جنوبی",
  ST: "سائوتومه و پرنسیپ",
  SV: "السالوادور",
  SY: "سوریه",
  SZ: "اسواتینی",
  TD: "چاد",
  TG: "توگو",
  TH: "تایلند",
  TJ: "تاجیکستان",
  TL: "تیمور شرقی",
  TM: "ترکمنستان",
  TN: "تونس",
  TO: "تونگا",
  TR: "ترکیه",
  TT: "ترینیداد و توباگو",
  TV: "تووالو",
  TW: "تایوان",
  TZ: "تانزانیا",
  UA: "اوکراین",
  UG: "اوگاندا",
  US: "ایالات متحده آمریکا",
  UY: "اروگوئه",
  UZ: "ازبکستان",
  VA: "واتیکان",
  VC: "سنت وینسنت و گرنادین‌ها",
  VE: "ونزوئلا",
  VN: "ویتنام",
  VU: "وانواتو",
  WS: "ساموآ",
  YE: "یمن",
  ZA: "آفریقای جنوبی",
  ZM: "زامبیا",
  ZW: "زیمبابوه",
};

export interface VisitorGeo {
  country: string;
  city: string;
}

/** ساعت و تاریخ لحظه‌ی ورود، به وقت منطقه زمانی تنظیم‌شده در تنظیمات عمومی (پیش‌فرض استانبول) */
function formatVisitTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      timeZone: timezone || "Europe/Istanbul",
      calendar: "gregory",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Europe/Istanbul",
      calendar: "gregory",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  }
}

/** اعلان لحظه‌ای به همه‌ی مدیران وقتی بازدیدکننده‌ی جدیدی وارد سایت می‌شود */
export async function notifyNewVisit(path: string, geo?: VisitorGeo): Promise<void> {
  const settings = await loadSettings();
  if (!settings.telegram.enabled || !settings.telegram.notifyOnVisit) return;
  const ids = adminChatIdList(settings.telegram.adminChatIds);
  if (ids.length === 0) return;
  const keys = await loadTelegramKeys();
  if (!keys.telegramBotToken) return;

  const countryName = geo?.country
    ? (COUNTRY_NAMES_FA[geo.country.toUpperCase()] ?? geo.country)
    : "";
  const location = [countryName, geo?.city].filter(Boolean).join("، ") || "نامشخص";
  const visitTime = formatVisitTime(settings.brand.timezone);
  const text = `👀 یک بازدیدکننده جدید وارد سایت شد\n\n📍 موقعیت: ${location}\n🕒 ساعت ورود: ${visitTime}\n🔗 صفحه: ${path}`;
  await Promise.all(
    ids.map((id) =>
      tgCall(keys.telegramBotToken, "sendMessage", { chat_id: id, text }).catch((e) =>
        console.error("notifyNewVisit: send failed for", id, e),
      ),
    ),
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** یکی از چند ایموجی سردر، ثابت برای هر مقاله اما متفاوت بین مقالات — از یکنواختی/تکراری به نظر رسیدن پست‌ها جلوگیری می‌کند */
const LEAD_EMOJIS = ["✨", "📌", "💬", "🌱", "🔎", "💡", "🌟"];
function pickLeadEmoji(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return LEAD_EMOJIS[hash % LEAD_EMOJIS.length] ?? "✨";
}

function toHashtag(text: string): string {
  const cleaned = text
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_\u200c]/gu, "");
  return cleaned ? `#${cleaned}` : "";
}

/** هشتگ‌های مرتبط برای دیده‌شدن بهتر پست در جست‌وجوی داخل تلگرام */
function buildHashtags(tags: string[], focusKeyword: string): string {
  const source = [focusKeyword, ...tags].filter(Boolean).slice(0, 5);
  const list = Array.from(new Set([...source.map(toHashtag), "#وبیار"].filter(Boolean)));
  return list.slice(0, 6).join(" ");
}

/** پست خودکار در کانال، وقتی مقاله‌ای (دستی یا خودکار) تازه منتشر می‌شود */
export async function notifyPublishedPost(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  tags?: string[] | undefined;
  focusKeyword?: string | undefined;
}): Promise<void> {
  const settings = await loadSettings();
  if (!settings.telegram.enabled || !settings.telegram.notifyOnPublish) return;
  if (!settings.telegram.channelId) return;
  const keys = await loadTelegramKeys();
  if (!keys.telegramBotToken) return;

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const url = `${base}/blog/${encodeURIComponent(post.slug)}`;
  const emoji = pickLeadEmoji(post.slug);
  const hashtags = buildHashtags(post.tags ?? [], post.focusKeyword ?? "");
  const caption =
    `${emoji} <b>${escapeHtml(post.title)}</b>\n\n${escapeHtml(post.excerpt || "")}\n\n${hashtags}`.trim();
  const replyMarkup = { inline_keyboard: [[{ text: "📖 مطالعه مقاله", url }]] };

  try {
    if (post.coverImage) {
      try {
        await tgCall(keys.telegramBotToken, "sendPhoto", {
          chat_id: settings.telegram.channelId,
          photo: post.coverImage,
          caption,
          parse_mode: "HTML",
          reply_markup: replyMarkup,
        });
      } catch (photoError) {
        // اگر ارسال عکس شکست بخورد (مثلاً آدرس تصویر برای تلگرام قابل‌دسترس نبود)، حداقل خود
        // مقاله به‌صورت متنی در کانال پست شود تا انتشار به‌طور کامل از دست نرود
        console.error("notifyPublishedPost: sendPhoto failed, falling back to text:", photoError);
        await tgCall(keys.telegramBotToken, "sendMessage", {
          chat_id: settings.telegram.channelId,
          text: caption,
          parse_mode: "HTML",
          reply_markup: replyMarkup,
        });
      }
    } else {
      await tgCall(keys.telegramBotToken, "sendMessage", {
        chat_id: settings.telegram.channelId,
        text: caption,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
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
