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
}) {
  const { settings, path, override, fallbackTitle, fallbackDescription, fallbackOgImage } = opts;
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
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: ogImage },
      ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    ],
    links: canonical ? [{ rel: "canonical", href: canonical }] : [],
  };
}
