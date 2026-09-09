// تنظیمات سایت (تک‌زبانه فارسی) — ساختار مشترک بین کلاینت و سرور.
// در دیتابیس به صورت key/value متنی ذخیره می‌شود تا انتقال به MySQL ساده باشد.

export interface BrandSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  siteUrl: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
  /** منطقه زمانی نمایش ساعت در پنل ادمین و اعلان‌های تلگرام، مثل Europe/Istanbul */
  timezone: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  robots: string;
  author: string;
  twitterHandle: string;
  googleVerification: string;
  jsonLdOrganization: string;
}

export interface SocialSettings {
  instagram: string;
  telegram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  whatsapp: string;
}

export interface AuthLinksSettings {
  enabled: boolean;
  loginUrl: string;
  signupUrl: string;
  loginLabel: string;
  signupLabel: string;
  /** آدرس یک API روی دامنه‌ی اپلیکیشن که وضعیت لاگین را برمی‌گرداند — خالی یعنی این قابلیت غیرفعال است */
  sessionCheckUrl: string;
  /** آدرس API خروج از حساب روی اپلیکیشن (POST) */
  logoutUrl: string;
  /** آدرس پنل کاربری اپلیکیشن — برای دکمه «پنل» وقتی کاربر لاگین است */
  panelUrl: string;
  panelLabel: string;
  logoutLabel: string;
}

/** همگام‌سازی پلن‌های صفحه قیمت‌گذاری با اپلیکیشن (Brand Builder Hub) */
export interface PlansSettings {
  /** خواندن پلن‌ها از API اپلیکیشن؛ خاموش یعنی پلن‌های پیش‌فرض سایت نمایش داده می‌شوند */
  enabled: boolean;
  /** آدرس API پلن‌ها، مثال: https://api.webyar.ai/api/plans */
  apiUrl: string;
}

export interface ChatWidgetSettings {
  enabled: boolean;
  scriptUrl: string;
  inlineScript: string;
  position: "right" | "left";
}

export interface CallCenterWidgetSettings {
  enabled: boolean;
  scriptUrl: string;
  inlineScript: string;
  position: "right" | "left";
}

export interface AiProviderModels {
  textModel: string;
  imageModel: string;
}

export interface AiSettings {
  enabled: boolean;
  /** کدام سرویس برای تولید متن مقاله (دستی و خودکار) استفاده شود */
  textProvider: "openai" | "gemini";
  /** کدام سرویس برای تولید تصویر کاور استفاده شود — می‌تواند از سرویس متن جدا باشد */
  imageProvider: "openai" | "gemini";
  /** تنظیمات هرکدام از دو سرویس کاملاً جدا و مستقل نگه داشته می‌شود؛ کلید API هرکدام در تنظیمات محرمانه است */
  openai: AiProviderModels;
  gemini: AiProviderModels;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface AnalyticsSettings {
  googleAnalyticsId: string;
  headScripts: string;
  bodyScripts: string;
}

export interface BunnyStorageSettings {
  /** نام Storage Zone در بانی سی‌دی‌ان */
  storageZone: string;
  /** کد ناحیه ذخیره‌سازی (خالی = پیش‌فرض/فرانکفورت)؛ مثلاً ny, la, sg, syd, uk */
  region: string;
  /** آدرس عمومی Pull Zone که فایل‌ها از آن سرو می‌شوند، مثلاً https://xxxx.b-cdn.net */
  pullZoneUrl: string;
}

export interface ArvanStorageSettings {
  /** نام باکت در ابر آروان (Object Storage) */
  bucket: string;
  /** آدرس endpoint سازگار با S3، مثلاً https://s3.ir-thr-at1.arvanstorage.ir */
  endpoint: string;
  /** کد ناحیه، مثلاً ir-thr-at1 */
  region: string;
  /** آدرس عمومی برای دسترسی به فایل‌ها؛ خالی یعنی از endpoint/bucket استفاده شود */
  publicUrl: string;
}

export interface MediaSettings {
  /** محل ذخیره‌سازی تصاویر تولیدشده با هوش مصنوعی و رسانه‌ها؛ "none" یعنی هیچ محل ذخیره‌سازی متصل نیست */
  provider: "none" | "bunny" | "arvan";
  bunny: BunnyStorageSettings;
  arvan: ArvanStorageSettings;
}

export interface TelegramSettings {
  /** ربات وصل و فعال است؛ اگر خاموش باشد هیچ پیامی (نه اعلان، نه پست کانال) ارسال نمی‌شود */
  enabled: boolean;
  /** شناسه یا نام‌کاربری کانالی که مقالات جدید در آن پست می‌شوند، مثل @my_channel یا -1001234567890 */
  channelId: string;
  /** شناسه‌های چت تلگرام مجاز به استفاده از منوی مدیریت ربات، جدا شده با کاما */
  adminChatIds: string;
  /** ارسال پیام لحظه‌ای به مدیران هنگام ورود یک بازدیدکننده جدید به سایت */
  notifyOnVisit: boolean;
  /** پست خودکار مقاله در کانال، به‌محض انتشار مقاله جدید (دستی یا خودکار) */
  notifyOnPublish: boolean;
  /** پیام خطای آخرین تلاش ناموفق برای پست مقاله در کانال — برای دیباگ در پنل ادمین */
  lastChannelPostError: string;
  /** زمان آخرین خطای پست کانال (ISO) */
  lastChannelPostErrorAt: string;
}

export interface SiteSettings {
  brand: BrandSettings;
  seo: SeoSettings;
  social: SocialSettings;
  auth: AuthLinksSettings;
  chatWidget: ChatWidgetSettings;
  callCenterWidget: CallCenterWidgetSettings;
  ai: AiSettings;
  analytics: AnalyticsSettings;
  media: MediaSettings;
  telegram: TelegramSettings;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: "وب‌یار",
    tagline: "چت زنده و تماس ویدیویی، فقط با یک خط کد",
    logoUrl: "",
    faviconUrl: "/favicon.png",
    siteUrl: "https://webyar.app",
    phone: "",
    email: "info@webyar.app",
    address: "",
    copyright: "© ۱۴۰۵ وب‌یار — تمامی حقوق محفوظ است",
    timezone: "Europe/Istanbul",
  },
  seo: {
    metaTitle: "وب‌یار | چت زنده و تماس ویدیویی، فقط با یک خط کد",
    metaDescription:
      "وب‌یار ابزارک چتی است که روی سایت شما می‌نشیند و امکان گفتگوی زنده و تماس تصویری مستقیم با بازدیدکننده‌ها را فراهم می‌کند. نصب در کمتر از ۵ دقیقه، بدون نیاز به برنامه‌نویس.",
    keywords:
      "چت آنلاین, چت زنده, تماس ویدیویی, پشتیبانی آنلاین, ابزارک چت, ویجت چت سایت, نرم‌افزار پشتیبانی مشتری",
    ogImage: "",
    robots: "index,follow",
    author: "وب‌یار",
    twitterHandle: "",
    googleVerification: "",
    jsonLdOrganization: "",
  },
  social: {
    instagram: "",
    telegram: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    whatsapp: "",
  },
  auth: {
    enabled: true,
    // پیش‌فرض خالی عمدی است — تا وقتی مدیر آدرس واقعی اپلیکیشن را در تنظیمات عمومی
    // وارد نکرده، دکمه‌ی «ورود» اصلاً نمایش داده نمی‌شود (نباید به پنل ادمین این سایت لینک بدهد).
    loginUrl: "",
    signupUrl: "/contact",
    loginLabel: "ورود",
    signupLabel: "شروع رایگان",
    sessionCheckUrl: "",
    logoutUrl: "",
    panelUrl: "",
    panelLabel: "پنل",
    logoutLabel: "خروج",
  },
  callCenterWidget: {
    enabled: false,
    scriptUrl: "",
    inlineScript: "",
    position: "right",
  },
  chatWidget: {
    enabled: false,
    scriptUrl: "",
    inlineScript: "",
    position: "right",
  },
  ai: {
    enabled: true,
    textProvider: "openai",
    imageProvider: "openai",
    openai: { textModel: "gpt-4o-mini", imageModel: "gpt-image-1-mini" },
    gemini: { textModel: "gemini-3.1-flash-lite", imageModel: "gemini-3.1-flash-lite-image" },
    systemPrompt:
      "تو یک نویسنده حرفه‌ای فارسی‌زبان برای بلاگ وب‌یار هستی؛ وب‌یار ابزار چت زنده، تماس تصویری و ارتباط با مشتری روی وب‌سایت است. فقط درباره‌ی موضوعات مرتبط با خدمات وب‌سایت (چت آنلاین، تجربه کاربری، تبدیل بازدیدکننده به مشتری)، هوش مصنوعی، و ارتباط/پشتیبانی مشتری بنویس؛ از موضوعات کاملاً بی‌ربط به این حوزه‌ها خودداری کن. لحن نوشتار باید بسیار مودبانه، باکلاس، صمیمی، دوستانه و کاملاً انسانی باشد؛ طوری بنویس که هیچ‌کس، حتی گوگل، متوجه نشود این متن با هوش مصنوعی نوشته شده — از عبارات کلیشه‌ای، تکرارهای قالبی و لحن رباتیک هوش مصنوعی خودداری کن. محتوای دقیق، روان، سئوشده و بدون کلیشه بنویس.",
    temperature: 0.7,
    maxTokens: 4000,
  },
  analytics: {
    googleAnalyticsId: "",
    headScripts: "",
    bodyScripts: "",
  },
  media: {
    provider: "none",
    bunny: { storageZone: "", region: "", pullZoneUrl: "" },
    arvan: { bucket: "", endpoint: "", region: "ir-thr-at1", publicUrl: "" },
  },
  telegram: {
    enabled: false,
    channelId: "",
    adminChatIds: "",
    notifyOnVisit: false,
    notifyOnPublish: true,
    lastChannelPostError: "",
    lastChannelPostErrorAt: "",
  },
};

/** ادغام عمیق تنظیمات ذخیره‌شده با مقادیر پیش‌فرض */
export function mergeSettings(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  const result = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  if (!stored) return result;
  for (const key of Object.keys(result) as (keyof SiteSettings)[]) {
    const section = stored[key];
    if (section && typeof section === "object") {
      Object.assign(result[key] as object, section);
    }
  }
  // ai.openai/ai.gemini باید عمیق ادغام شوند تا ذخیره جزئی یکی، فیلدهای دیگری را پاک نکند
  if (stored.ai?.openai) Object.assign(result.ai.openai, stored.ai.openai);
  if (stored.ai?.gemini) Object.assign(result.ai.gemini, stored.ai.gemini);
  if (stored.media?.bunny) Object.assign(result.media.bunny, stored.media.bunny);
  if (stored.media?.arvan) Object.assign(result.media.arvan, stored.media.arvan);
  return result;
}
