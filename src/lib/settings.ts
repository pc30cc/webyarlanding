// تنظیمات سایت (تک‌زبانه فارسی) — ساختار مشترک بین کلاینت و سرور.
// در دیتابیس به صورت key/value متنی ذخیره می‌شود تا انتقال به MySQL ساده باشد.

export interface BrandSettings {
  name: string;
  /** نام برند به انگلیسی — در صفحات انگلیسی (Privacy/Terms/Support) استفاده می‌شود */
  nameEn?: string;
  /** اگر روشن باشد، منوی بالا، دکمه‌های ورود و فوتر در صفحات Privacy/Terms/Support هم انگلیسی می‌شوند */
  legalEnglishChrome?: boolean;
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
  /** نمایش کلید ماهانه/سالانه و قیمت‌های سالانه در صفحه قیمت‌گذاری */
  showYearly?: boolean;
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

/**
 * نمایش عمومی تماس تصویری/صوتی در سایت — جدا از callCenterWidget (که یک ویجت نصبی دیگر است).
 * خاموش یعنی همه‌ی بخش‌ها، امکانات پلن‌ها، ردیف‌های جدول مقایسه، Endpoint مستندات API و متن‌های
 * سئو/JSON-LD مرتبط با تماس تصویری/صوتی در کل سایت پنهان می‌شوند — بدون حذف کد، تا هر وقت مجوز
 * گرفتید دوباره روشنش کنید.
 */
export interface VideoCallSettings {
  enabled: boolean;
}

/**
 * نمایش عمومی هوش مصنوعی (ایجنت/دستیار هوشمند) در سایت — مستقل از ai (که تنظیمات سرویس تولید
 * محتوای مقالات است، نه یک ویژگی محصول قابل نمایش). خاموش یعنی همه‌ی کارت‌های ویژگی، بخش‌های
 * پنل، امکانات پلن‌ها، ردیف‌های جدول مقایسه و متن‌های سئو/JSON-LD مرتبط با هوش مصنوعی در کل سایت
 * پنهان می‌شوند — بدون حذف کد، تا هر وقت خواستید دوباره روشنش کنید.
 */
export interface AiMarketingSettings {
  enabled: boolean;
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
  videoCall: VideoCallSettings;
  aiMarketing: AiMarketingSettings;
  plans: PlansSettings;
  ai: AiSettings;
  analytics: AnalyticsSettings;
  media: MediaSettings;
  telegram: TelegramSettings;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: "وب‌یار",
    nameEn: "Webyar",
    legalEnglishChrome: true,
    tagline: "چت زنده و تماس ویدیویی، فقط با یک خط کد",
    logoUrl: "",
    faviconUrl: "/favicon.png",
    siteUrl: "https://webyar.ai",
    phone: "",
    email: "info@webyar.ai",
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
  plans: {
    enabled: true,
    apiUrl: "https://api.webyar.ai/api/plans",
    showYearly: false,
  },
  callCenterWidget: {
    enabled: false,
    scriptUrl: "",
    inlineScript: "",
    position: "right",
  },
  videoCall: {
    enabled: true,
  },
  aiMarketing: {
    enabled: true,
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

export const CALL_KEYWORDS = [
  "تماس تصویری",
  "تماس ویدیویی",
  "ویدیویی",
  "تماس صوتی",
  "مرکز تماس",
  "صف تماس",
  "اشتراک‌گذاری صفحه",
];

/** کلمات کلیدی مرتبط با هوش مصنوعی — برای فیلتر کردن محتوای مرتبط در کل سایت مارکتینگ، مشابه CALL_KEYWORDS */
export const AI_KEYWORDS = ["هوش مصنوعی", "دستیار هوشمند", "ایجنت"];

/**
 * چند عبارت فارسی را با ویرگول و «و» قبل از آخرین مورد به هم وصل می‌کند — برای جمله‌هایی که
 * بسته به چند تنظیم مستقل (مثل videoCall/aiMarketing) هرکدام از آیتم‌هایشان ممکن است حذف شود.
 * آیتم‌های خالی/false نادیده گرفته می‌شوند.
 */
export function joinFa(...items: (string | false | null | undefined)[]): string {
  const arr = items.filter((x): x is string => !!x);
  if (arr.length <= 1) return arr[0] ?? "";
  const last = arr[arr.length - 1] ?? "";
  return arr.slice(0, -1).join("، ") + " و " + last;
}

/**
 * شعار/تگ‌لاین برند برای نمایش عمومی (فوتر، JSON-LD). چون این متن آزاد و قابل‌ویرایش توسط مدیر
 * است، خودِ مقدار ذخیره‌شده هرگز تغییر نمی‌کند — فقط وقتی videoCall.enabled یا aiMarketing.enabled
 * خاموش است و متن ذخیره‌شده به همان موضوع اشاره دارد، یک متن عمومی جایگزینش می‌شود؛ به‌محض
 * روشن‌شدن دوباره همان تگ‌لاین اصلی برمی‌گردد.
 */
/** مسیرهای حقوقی/پشتیبانی که می‌توانند کاملاً انگلیسی نمایش داده شوند. */
export const LEGAL_EN_PATHS = ["/privacy", "/terms", "/help"];

/** آیا این مسیر باید با پوسته انگلیسی (منو، دکمه‌ها، فوتر) نمایش داده شود؟ */
export function isEnglishChrome(settings: SiteSettings, pathname: string): boolean {
  if (settings.brand.legalEnglishChrome === false) return false;
  const clean = pathname.replace(/\/+$/, "") || "/";
  return LEGAL_EN_PATHS.includes(clean);
}

/** نام برند برای صفحات انگلیسی؛ اگر تنظیم نشده باشد به Webyar برمی‌گردد. */
export function getBrandNameEn(settings: SiteSettings): string {
  const en = settings.brand.nameEn?.trim();
  return en && en.length > 0 ? en : "Webyar";
}

export function getPublicTagline(settings: SiteSettings): string {
  const tagline = settings.brand.tagline;
  if (!tagline) return tagline;
  const hideForCall = !settings.videoCall.enabled && CALL_KEYWORDS.some((k) => tagline.includes(k));
  const hideForAi = !settings.aiMarketing.enabled && AI_KEYWORDS.some((k) => tagline.includes(k));
  if (!hideForCall && !hideForAi) return tagline;
  return (
    joinFa("چت زنده", settings.aiMarketing.enabled && "دستیار هوشمند") + " برای ارتباط با مشتری"
  );
}

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
