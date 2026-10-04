import { translatorForSettings, getSiteLanguage } from "./site-i18n";
// ابزار مشترک برای ادغام تنظیمات عمومی سئو با override اختصاصی هر صفحه (seo_pages)
// در loader/head صفحات مارکتینگ. خالص و بدون فراخوانی دیتابیس.
import type { SiteSettings } from "./settings";
import type { SeoPageDto } from "./seo.functions";

// متن robots.txt واقعی همیشه با یک خط «User-agent:» شروع می‌شود.
const ROBOTS_TXT_PATTERN = /^\s*user-agent\s*:/im;
// مقدار متا-robots معمولاً یکی از این کلمات را دارد (index/follow/noindex/nofollow).
const META_ROBOTS_PATTERN = /\b(index|noindex|follow|nofollow)\b/i;

/** آیا مقدار ذخیره‌شده شبیه فایل کامل robots.txt است؟ */
export function looksLikeRobotsTxt(value: string | null | undefined): boolean {
  return !!value && ROBOTS_TXT_PATTERN.test(value);
}

/** آیا مقدار ذخیره‌شده شبیه مقدار متای robots (index,follow و…) است؟ */
export function looksLikeMetaRobots(value: string | null | undefined): boolean {
  return (
    !!value &&
    META_ROBOTS_PATTERN.test(value) &&
    !ROBOTS_TXT_PATTERN.test(value)
  );
}

/** پارس امن schemaJson اختصاصی صفحه؛ در صورت نامعتبر بودن null برمی‌گرداند. */
export function parseSchemaJson(
  raw: string | null | undefined,
): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * سریالایز امن JSON-LD برای درج در تگ <script> با dangerouslySetInnerHTML.
 * JSON.stringify خام کاراکتر «<» را escape نمی‌کند؛ اگر عنوان یا محتوای یک مقاله
 * (نوشته‌شده توسط ادمین یا تولیدشده با هوش مصنوعی) شامل رشته‌ی «</script>» باشد،
 * تگ اسکریپت زودتر از موعد بسته می‌شود و کد دلخواه در صفحه اجرا می‌شود (XSS ذخیره‌شده).
 */
export function safeJsonLdHtml(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export interface ParsedScriptTag {
  attrs: Record<string, string>;
  children?: string | undefined;
}

/**
 * قطعه HTML دلخواهی که ادمین در «اسکریپت‌های head/body» وارد کرده را به تگ‌های <script>
 * تجزیه می‌کند (سازگار با سرور و کلاینت — بدون DOMParser، چون در head() سمت سرور هم اجرا
 * می‌شود). قطعاتی مثل کدهای گوگل آنالیتیکس/تگ‌منیجر معمولاً همین ساختار ساده را دارند.
 */
export function extractScriptTags(html: string): ParsedScriptTag[] {
  const results: ParsedScriptTag[] = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html))) {
    const attrsStr = match[1] ?? "";
    const body = match[2]?.trim() ?? "";
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9_-]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrsStr))) {
      const name = attrMatch[1];
      const rawValue = attrMatch[2] ?? "";
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      if (name) attrs[name] = value || "true";
    }
    results.push(body ? { attrs, children: body } : { attrs });
  }
  return results;
}

export function buildPageMeta(opts: {
  settings: SiteSettings;
  path: string; // مثل "/about" (بدون اسلش پایانی، جز مسیر ریشه "/")
  override: SeoPageDto | null; // خروجی getPublicSeoPage یا null
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackOgImage?: string;
  /** نوع Open Graph — پیش‌فرض «website»؛ برای مقالات بلاگ «article» بدهید */
  ogType?: string;
  /** متاتگ‌های اضافی مخصوص نوع محتوا (مثل article:published_time) */
  extraMeta?: { property?: string; name?: string; content: string }[];
  /** پیش‌فرض robots وقتی نه override اختصاصی صفحه و نه تنظیمات عمومی سئو مقداری دارند (پیش‌فرض: "index,follow") — برای صفحات کم‌محتوا (مثل برچسب‌های تک‌مقاله‌ای) "noindex,follow" بدهید */
  defaultRobots?: string;
}) {
  const {
    settings,
    path,
    override,
    fallbackTitle,
    fallbackDescription,
    fallbackOgImage,
    ogType = "website",
    extraMeta = [],
    defaultRobots = "index,follow",
  } = opts;
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");

  const translate = translatorForSettings(settings);
  const title = translate(override?.title || fallbackTitle);
  const description = translate(
    override?.description ||
      fallbackDescription ||
      settings.seo.metaDescription,
  );
  const ogImage =
    override?.ogImage ||
    fallbackOgImage ||
    settings.seo.ogImage ||
    (base ? `${base}/og-image.png` : "/og-image.png");
  const canonical =
    override?.canonicalUrl || (base ? `${base}${path}` : undefined);
  const robots =
    override?.robots ||
    (looksLikeMetaRobots(settings.seo.robots)
      ? settings.seo.robots
      : defaultRobots);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { property: "og:type", content: ogType },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: ogImage },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
      ...(canonical ? [{ property: "og:url", content: canonical }] : []),
      {
        property: "og:locale",
        content: getSiteLanguage(settings) === "en" ? "en_US" : "fa_IR",
      },
      ...extraMeta.map((entry) =>
        /article:(tag|author)/.test(entry.property || "")
          ? { ...entry, content: translate(entry.content) }
          : entry,
      ),
    ],
    links: canonical ? [{ rel: "canonical", href: canonical }] : [],
  };
}

/** JSON-LD مسیر ناوبری (Breadcrumb) — برای صفحات داخلی، سازگار با Google Rich Results */
export function buildBreadcrumbJsonLd(
  settings: SiteSettings,
  items: { name: string; path?: string }[],
) {
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: translatorForSettings(settings)(item.name),
      item: item.path ? (base ? `${base}${item.path}` : undefined) : undefined,
    })),
  };
}
