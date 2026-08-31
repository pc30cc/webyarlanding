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
  return !!value && META_ROBOTS_PATTERN.test(value) && !ROBOTS_TXT_PATTERN.test(value);
}

/** پارس امن schemaJson اختصاصی صفحه؛ در صورت نامعتبر بودن null برمی‌گرداند. */
export function parseSchemaJson(raw: string | null | undefined): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
  } = opts;
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");

  const title = override?.title || fallbackTitle;
  const description = override?.description || fallbackDescription || settings.seo.metaDescription;
  const ogImage =
    override?.ogImage ||
    fallbackOgImage ||
    settings.seo.ogImage ||
    (base ? `${base}/og-image.png` : "/og-image.png");
  const canonical = override?.canonicalUrl || (base ? `${base}${path}` : undefined);
  const robots =
    override?.robots ||
    (looksLikeMetaRobots(settings.seo.robots) ? settings.seo.robots : "index,follow");

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
      ...extraMeta,
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
      name: item.name,
      item: item.path ? (base ? `${base}${item.path}` : undefined) : undefined,
    })),
  };
}
