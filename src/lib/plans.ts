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
  /** قیمت دلاری ماهانه (دلار کامل) برای سایت انگلیسی — فقط اگر API اپلیکیشن ارسال کند */
  usdMonthly?: number | null | undefined;
  /** قیمت دلاری سالانه (کل مبلغ سالانه، دلار کامل) */
  usdYearly?: number | null | undefined;
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
};

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
  "analytics",
  "ai_assistant",
  "api_access",
  "priority_support",
];
