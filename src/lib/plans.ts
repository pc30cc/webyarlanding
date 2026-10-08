/** مدل پلن عمومی برای صفحه قیمت‌گذاری — خروجی نرمال‌شده‌ی API اپلیکیشن */
export interface PublicPlan {
  slug: string;
  name: string;
  description: string;
  nameEn?: string | undefined;
  descriptionEn?: string | undefined;
  isFree: boolean;
  /** قیمت ماهانه به تومان — null یعنی قیمت اعلام نشده (تماس بگیرید) */
  monthly: number | null;
  /** قیمت سالانه به تومان (کل مبلغ سالانه) */
  yearly: number | null;
  /** قیمت دلاری ماهانه برای سایت انگلیسی — فقط اگر API اپلیکیشن ارسال کند */
  usdMonthly?: number | null | undefined;
  /** قیمت دلاری سالانه (کل مبلغ سالانه) */
  usdYearly?: number | null | undefined;
  /** ارز پیش‌فرض پرداخت این پلن در اپلیکیشن (مثلاً IRR یا USD) */
  defaultCurrency?: string | undefined;
  /** امکانات فعال پلن با برچسب فارسی */
  features: string[];
  /** محدودیت‌های کلیدی با برچسب فارسی */
  limits: { label: string; value: string }[];
  popular: boolean;
}

export interface PlansComparison {
  /** ستون‌ها به ترتیب پلن‌ها */
  plans: string[];
  rows: { label: string; values: (string | boolean)[] }[];
}

/** برچسب فارسی امکانات (کلیدهای entitlements در اپلیکیشن) */
export const FEATURE_LABELS_FA: Record<string, string> = {
  chat: "گفتگوی زنده",
  chat_widget: "ابزارک چت سایت",
  video: "تماس تصویری",
  voice: "تماس صوتی",
  voice_video: "تماس صوتی و تصویری",
  call_center: "مرکز تماس",
  call_queue: "صف تماس",
  call_recording: "ضبط تماس",
  call_callbacks: "درخواست تماس مجدد",
  email: "ایمیل",
  sms: "پیامک",
  telegram: "تلگرام",
  whatsapp: "واتس‌اپ",
  instagram: "اینستاگرام",
  bale: "بله",
  omnichannel: "ارتباط چندکاناله",
  contacts: "مدیریت مخاطبین",
  contact_import: "ورود مخاطبین",
  contact_export: "خروجی مخاطبین",
  analytics: "گزارش و تحلیل",
  visitor_tracking: "رهگیری بازدیدکننده",
  automation: "اتوماسیون",
  ai_assistant: "دستیار هوش مصنوعی",
  advanced_ai_agent: "ایجنت هوش مصنوعی پیشرفته",
  ai_operator_assist: "کمک هوش مصنوعی به اپراتور",
  ai_kb_builder: "ساخت پایگاه دانش هوشمند",
  knowledge_base: "پایگاه دانش",
  help_center: "مرکز راهنما",
  seo: "ابزارهای سئو",
  api_access: "دسترسی API",
  audit_logs: "گزارش رویدادها",
  sso: "ورود یکپارچه (SSO)",
  white_label: "برچسب سفید",
  remove_powered_by: "حذف برند وب‌یار از ابزارک",
  custom_branding: "برندسازی اختصاصی",
  priority_support: "پشتیبانی اولویت‌دار",
  email_campaigns: "کمپین ایمیلی",
  inbox_team_chat: "گفتگوی تیمی",
  email_inbox: "صندوق ایمیل",
  web_analytics: "آنالیز وب‌سایت",
  brand_radar: "رادار برند",
  commerce: "اتصال فروشگاه (ووکامرس، اوپن‌کارت، WHMCS)",
};

/**
 * کلیدهایی که در اپلیکیشن اصلی هیچ قابلیتی را فعال نمی‌کنند یا قابلیتشان اصلاً وجود ندارد
 * (بررسی‌شده در capabilityRegistry اپ): حتی اگر در پلنی true باشند، در سایت نمایش داده نمی‌شوند
 * تا فقط امکانات واقعی اپ تبلیغ شود.
 */
export const NOT_OFFERED_FEATURE_KEYS: ReadonlySet<string> = new Set([
  "api_access",
  "sso",
  "audit_logs",
  "white_label",
  "custom_branding",
  "priority_support",
  "email_campaigns",
  "automation",
  "analytics",
  "advanced_ai_agent",
  "help_center",
  "omnichannel",
  "sms",
  "email",
]);

/** کلیدهایی که اگر در پلن مشخص نشده باشند، در اپ به‌طور پیش‌فرض فعال‌اند */
export const DEFAULT_ON_FEATURE_KEYS: ReadonlySet<string> = new Set([
  "chat_widget",
  "knowledge_base",
  "contacts",
  "visitor_tracking",
  "seo",
  "inbox_team_chat",
]);

/** محدودیت‌هایی که اپ اعمال نمی‌کند یا واحدشان برای بازدیدکننده گمراه‌کننده است */
export const HIDDEN_LIMIT_KEYS: ReadonlySet<string> = new Set([
  "data_retention_days",
  "ai_credits_per_month",
]);

/** آیا پلن این قابلیت را واقعاً دارد؟ (کلید غایب = پیش‌فرض اپ) */
export function planHasFeature(
  entitlements: Record<string, unknown>,
  key: string,
): boolean {
  if (NOT_OFFERED_FEATURE_KEYS.has(key)) return false;
  const value = entitlements[key];
  return value === true || (value === undefined && DEFAULT_ON_FEATURE_KEYS.has(key));
}

/** برچسب فارسی محدودیت‌ها (کلیدهای limits در اپلیکیشن) */
export const LIMIT_LABELS_FA: Record<string, string> = {
  max_agents: "تعداد اپراتور",
  max_conversations: "گفتگوی ماهانه",
  max_contacts: "تعداد مخاطب",
  max_visitors: "بازدیدکننده",
  max_widget_domains: "تعداد دامنه",
  storage_gb: "فضای ذخیره‌سازی (گیگابایت)",
  data_retention_days: "نگهداری داده (روز)",
  max_call_minutes_per_month: "دقیقه تماس ماهانه",
  max_concurrent_calls: "تماس هم‌زمان",
  ai_credits_per_month: "اعتبار هوش مصنوعی ماهانه",
};

/** ترتیب نمایش امکانات و محدودیت‌های کلیدی در جدول مقایسه */
export const COMPARISON_LIMIT_KEYS = [
  "max_agents",
  "max_conversations",
  "max_contacts",
  "max_widget_domains",
  "storage_gb",
];
export const COMPARISON_FEATURE_KEYS = [
  "chat_widget",
  "voice_video",
  "call_center",
  "ai_assistant",
  "visitor_tracking",
  "knowledge_base",
  "contact_import",
];
