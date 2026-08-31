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
}

export interface ChatWidgetSettings {
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
  /** کدام سرویس برای تولید مقاله (دستی و خودکار) و تصویر واقعاً استفاده شود */
  provider: "openai" | "gemini";
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

export interface MediaSettings {
  provider: "supabase" | "ftp" | "bunny" | "external";
  publicBaseUrl: string;
  bucket: string;
}

export interface SiteSettings {
  brand: BrandSettings;
  seo: SeoSettings;
  social: SocialSettings;
  auth: AuthLinksSettings;
  chatWidget: ChatWidgetSettings;
  ai: AiSettings;
  analytics: AnalyticsSettings;
  media: MediaSettings;
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
    loginUrl: "/admin-login",
    signupUrl: "/contact",
    loginLabel: "ورود",
    signupLabel: "شروع رایگان",
  },
  chatWidget: {
    enabled: false,
    scriptUrl: "",
    inlineScript: "",
    position: "right",
  },
  ai: {
    enabled: true,
    provider: "openai",
    openai: { textModel: "gpt-4o-mini", imageModel: "dall-e-3" },
    gemini: { textModel: "gemini-2.0-flash", imageModel: "gemini-2.5-flash-image" },
    systemPrompt:
      "تو یک نویسنده حرفه‌ای فارسی‌زبان در حوزه فناوری و کسب‌وکار هستی. محتوای دقیق، روان، سئوشده و بدون کلیشه بنویس.",
    temperature: 0.7,
    maxTokens: 4000,
  },
  analytics: {
    googleAnalyticsId: "",
    headScripts: "",
    bodyScripts: "",
  },
  media: {
    provider: "supabase",
    publicBaseUrl: "",
    bucket: "media",
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
  return result;
}
