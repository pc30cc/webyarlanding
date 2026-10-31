import { siteI18n, type SiteI18n } from "./site-i18n";
import { LOCALES, withLocalePrefix, type Locale } from "./locales";
import { getActiveLocales, getDefaultLocale } from "./settings";
import { hasSiteMessages } from "./site-messages";
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

/** پیشوند آدرس یک زبان: زبان پیش‌فرض بدون پیشوند روی ریشه است. */
export function localePrefix(settings: SiteSettings, locale: Locale): Locale | null {
  return locale === getDefaultLocale(settings) ? null : locale;
}

/** آدرس کامل یک مسیر در یک زبان (برای canonical، hreflang و JSON-LD) */
export function localizedUrl(
  settings: SiteSettings,
  locale: Locale,
  path: string,
): string | undefined {
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  return base ? `${base}${withLocalePrefix(path, localePrefix(settings, locale))}` : undefined;
}

/**
 * آدرس ریشه سایت در یک زبان (برای WebSite در JSON-LD). برای زبان پیش‌فرض `fallback` را
 * برمی‌گرداند تا خروجی آن زبان دقیقاً مثل قبل بماند.
 */
export function localizedSiteUrl(
  settings: SiteSettings,
  locale: Locale,
  fallback: string | undefined,
): string | undefined {
  const prefix = localePrefix(settings, locale);
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  return prefix ? (base ? `${base}/${prefix}` : undefined) : fallback;
}

/** زبان‌هایی که نسخه قابل ایندکس دارند: فعال و دارای دیکشنری ترجمه */
export function indexableLocales(settings: SiteSettings): Locale[] {
  return getActiveLocales(settings).filter((locale) => hasSiteMessages(locale));
}

/** canonical سفارشی نسخه‌های زبان یک مسیر (از seo_pages) */
export type SeoCanonicals = Partial<Record<Locale, string>>;

/**
 * canonical سفارشی (seo_pages) فقط وقتی در hreflang و سایت‌مپ می‌آید که آدرس کامل http(s) روی
 * همان دامنه‌ی سایت (brand.siteUrl) باشد؛ فیلد canonical پنل آزاد است و آدرس نسبی یا دامنه‌ی
 * دیگر آنجا نامعتبر است. در این حالت undefined برمی‌گردد تا آدرس پیش‌فرض همان زبان به‌کار رود.
 */
export function sameSiteCanonical(
  settings: SiteSettings,
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    const site = new URL(settings.brand.siteUrl || "");
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === site.origin
      ? trimmed
      : undefined;
  } catch {
    return undefined;
  }
}

/** آیا مقدار robots صفحه را از ایندکس خارج می‌کند؟ (همان شرط hreflang در buildPageMeta) */
export function isNoindexRobots(robots: string | null | undefined): boolean {
  // "none" همان noindex,nofollow است
  return !!robots && /\b(noindex|none)\b/i.test(robots);
}

/**
 * hreflang یک مسیر: نسخه آن در همه زبان‌های قابل ایندکس به‌علاوه x-default (زبان پیش‌فرض).
 * در سایت تک‌زبانه یا با کمتر از دو زبان قابل ایندکس خالی است. `canonicals` آدرس canonical
 * سفارشی نسخه‌های زبان (seo_pages) است؛ یک رشته یعنی canonical نسخه زبان پیش‌فرض. فقط canonical
 * هم‌دامنه با سایت به‌کار می‌رود (sameSiteCanonical)، مثل سایت‌مپ.
 */
export function hreflangAlternates(
  settings: SiteSettings,
  path: string,
  canonicals?: string | SeoCanonicals | null,
  /** زبان‌هایی که این صفحه در آن‌ها وجود دارد (مثلاً برنامه‌ای که فقط در بعضی زبان‌ها نمایش داده می‌شود) */
  availableIn?: readonly Locale[],
): { hrefLang: string; href: string }[] {
  if (settings.localization?.mode !== "multi") return [];
  const locales = indexableLocales(settings).filter(
    (locale) => !availableIn || availableIn.includes(locale),
  );
  if (locales.length < 2) return [];
  const fallback = getDefaultLocale(settings);
  const custom: SeoCanonicals =
    typeof canonicals === "string" ? { [fallback]: canonicals } : (canonicals ?? {});
  const urlFor = (locale: Locale) =>
    sameSiteCanonical(settings, custom[locale]) || localizedUrl(settings, locale, path);
  const links = locales.flatMap((locale) => {
    const href = urlFor(locale);
    return href ? [{ hrefLang: locale, href }] : [];
  });
  if (links.length < 2) return [];
  const xDefault = urlFor(locales.includes(fallback) ? fallback : (locales[0] as Locale));
  return xDefault ? [...links, { hrefLang: "x-default", href: xDefault }] : links;
}

/** زبان ذخیره‌شده یک ردیف seo_pages؛ نبودنش یعنی زبان پیش‌فرض سایت */
interface SeoLocaleRow {
  locale?: Locale | null | undefined;
}

/** ردیف یکتای یک زبان (null = ردیف‌های بدون زبان)؛ چند ردیف برای یک زبان مبهم است و نادیده گرفته می‌شود. */
function onlySeoRow<T extends SeoLocaleRow>(rows: readonly T[], locale: Locale | null): T | null {
  const found = rows.filter((row) => (row.locale ?? null) === locale);
  return found.length === 1 ? (found[0] ?? null) : null;
}

/** ردیف زبان پیش‌فرض: ردیفی که صریحاً همان زبان را دارد، وگرنه ردیف بدون زبان (ردیف‌های قدیمی) */
function defaultSeoRow<T extends SeoLocaleRow>(
  rows: readonly T[],
  defaultLocale: Locale | null,
): T | null {
  return (defaultLocale ? onlySeoRow(rows, defaultLocale) : null) ?? onlySeoRow(rows, null);
}

/**
 * ردیف seo_pages مناسب یک صفحه از میان ردیف‌های همان مسیر: ردیف زبان صفحه، وگرنه ردیف زبان
 * پیش‌فرض. روی زبان‌های دیگر، ردیف زبان پیش‌فرض فقط برای canonical در hreflang برگردانده
 * می‌شود و buildPageMeta آن را اعمال نمی‌کند (seoOverrideFor). `pageLocale` و `defaultLocale`
 * null یعنی تنظیمات خوانده نشده (مسیر ردیف زبان‌دار ندارد) و فقط ردیف بدون زبان معنا دارد.
 * مثل قبل، چند ردیف برای یک مسیر و یک زبان مبهم است و هیچ‌کدام انتخاب نمی‌شود.
 */
export function selectSeoPageRow<T extends SeoLocaleRow>(
  rows: readonly T[],
  pageLocale: Locale | null,
  defaultLocale: Locale | null,
): T | null {
  return (pageLocale ? onlySeoRow(rows, pageLocale) : null) ?? defaultSeoRow(rows, defaultLocale);
}

/**
 * ردیفی که buildPageMeta روی نسخه یک زبان اعمال می‌کند: زبان پیش‌فرض ردیف خودش یا ردیف بدون
 * زبان، بقیه فقط ردیف یکتای همان زبان.
 */
function seoRowOfLocale<T extends SeoLocaleRow>(
  rows: readonly T[],
  locale: Locale,
  defaultLocale: Locale,
): T | null {
  return locale === defaultLocale ? defaultSeoRow(rows, defaultLocale) : onlySeoRow(rows, locale);
}

/** canonical سفارشی هر نسخه زبان یک مسیر، از همه ردیف‌های seo_pages آن مسیر (برای hreflang) */
export function seoPageCanonicals(
  rows: readonly (SeoLocaleRow & { canonicalUrl?: string | null })[],
  defaultLocale: Locale,
): SeoCanonicals {
  const result: SeoCanonicals = {};
  for (const locale of LOCALES) {
    const row = seoRowOfLocale(rows, locale, defaultLocale);
    if (row?.canonicalUrl) result[locale] = row.canonicalUrl;
  }
  return result;
}

/**
 * زبان‌هایی که ردیف seo_pages خود نسخه‌شان noindex است؛ این نسخه‌ها از hreflang همه نسخه‌های
 * همان مسیر و از سایت‌مپ کنار گذاشته می‌شوند.
 */
export function seoPageNoindexLocales(
  rows: readonly (SeoLocaleRow & { robots?: string | null })[],
  defaultLocale: Locale,
): Locale[] {
  return LOCALES.filter((locale) =>
    isNoindexRobots(seoRowOfLocale(rows, locale, defaultLocale)?.robots),
  );
}

/**
 * override صفحه (seo_pages) اگر به زبان این صفحه نوشته شده باشد؛ ردیف بدون زبان (همه
 * ردیف‌های قدیمی) متعلق به زبان پیش‌فرض است و روی نسخه‌های دیگر زبان اعمال نمی‌شود.
 */
export function seoOverrideFor(
  settings: SiteSettings,
  locale: Locale,
  override: SeoPageDto | null | undefined,
): SeoPageDto | null {
  if (!override) return null;
  return (override.locale ?? getDefaultLocale(settings)) === locale ? override : null;
}

/** canonical سفارشی نسخه‌های زبان این مسیر برای hreflang، از خروجی getPublicSeoPage */
function overrideCanonicals(
  settings: SiteSettings,
  override: SeoPageDto | null,
): SeoCanonicals | null {
  if (!override) return null;
  if (override.alternateCanonicals) return override.alternateCanonicals;
  return override.canonicalUrl
    ? { [override.locale ?? getDefaultLocale(settings)]: override.canonicalUrl }
    : null;
}

/**
 * نسخه‌های noindex این مسیر برای hreflang، از خروجی getPublicSeoPage. بدون noindexLocales
 * (مسیر بدون ردیف زبان‌دار، مثل همه ردیف‌های قدیمی) فقط robots خود ردیف برای زبان خودش معناست.
 */
function overrideNoindexLocales(
  settings: SiteSettings,
  override: SeoPageDto | null,
): readonly Locale[] {
  if (!override) return [];
  if (override.noindexLocales) return override.noindexLocales;
  return isNoindexRobots(override.robots) ? [override.locale ?? getDefaultLocale(settings)] : [];
}

/** زبان‌های hreflang صفحه: زبان‌های موجود صفحه منهای نسخه‌هایی که ردیف سئوی خودشان noindex است */
function hreflangLocales(
  available: readonly Locale[] | undefined,
  noindex: readonly Locale[],
): readonly Locale[] | undefined {
  if (noindex.length === 0) return available;
  return (available ?? LOCALES).filter((locale) => !noindex.includes(locale));
}

export function buildPageMeta(opts: {
  /** زبان صفحه (i18nFromMatches در head)؛ بدون آن زبان پیش‌فرض سایت فرض می‌شود */
  i18n: SiteI18n | null;
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
  /** لینک‌های hreflang به نسخه‌های دیگر زبان؛ برای بلاگ (فقط فارسی) false بدهید */
  alternates?: boolean;
  /** زبان‌هایی که این صفحه در آن‌ها وجود دارد؛ پیش‌فرض: همه زبان‌های قابل ایندکس */
  alternateLocales?: readonly Locale[] | undefined;
}) {
  const {
    settings,
    path,
    override: storedOverride,
    fallbackTitle,
    fallbackDescription,
    fallbackOgImage,
    ogType = "website",
    extraMeta = [],
    defaultRobots = "index,follow",
  } = opts;
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const i18n = opts.i18n ?? siteI18n(settings, getDefaultLocale(settings));
  // override صفحه (seo_pages) فقط روی نسخه همان زبان اعمال می‌شود (canonical آن به آدرس همان
  // زبان اشاره می‌کند)؛ ردیف‌های بدون زبان متعلق به زبان پیش‌فرض‌اند.
  const override = seoOverrideFor(settings, i18n.locale, storedOverride);

  const translate = i18n.translate;
  const title = translate(override?.title || fallbackTitle);
  const description = translate(
    override?.description || fallbackDescription || settings.seo.metaDescription,
  );
  const ogImage =
    override?.ogImage ||
    fallbackOgImage ||
    settings.seo.ogImage ||
    (base ? `${base}/og-image.png?v=2` : "/og-image.png?v=2");
  const canonical = override?.canonicalUrl || localizedUrl(settings, i18n.locale, path);
  // زبانی که هنوز دیکشنری ترجمه ندارد متن فارسی نشان می‌دهد؛ تا ترجمه آماده نشده ایندکس نشود.
  const untranslated = i18n.locale !== "fa" && !hasSiteMessages(i18n.locale);
  const robots = untranslated
    ? "noindex,follow"
    : override?.robots ||
      (looksLikeMetaRobots(settings.seo.robots) ? settings.seo.robots : defaultRobots);

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
      { property: "og:locale", content: i18n.info.ogLocale },
      ...extraMeta.map((entry) =>
        /article:(tag|author)/.test(entry.property || "")
          ? { ...entry, content: translate(entry.content) }
          : entry,
      ),
    ],
    links: [
      ...(canonical ? [{ rel: "canonical", href: canonical }] : []),
      // hreflang فقط برای صفحه قابل ایندکس؛ نسخه زبان پیش‌فرض همان canonical خودش را دارد
      ...(opts.alternates === false || isNoindexRobots(robots)
        ? []
        : hreflangAlternates(
            settings,
            path,
            overrideCanonicals(settings, storedOverride),
            hreflangLocales(
              opts.alternateLocales,
              overrideNoindexLocales(settings, storedOverride),
            ),
          ).map((link) => ({
            rel: "alternate",
            hrefLang: link.hrefLang,
            href: link.href,
          }))),
    ],
  };
}

/** JSON-LD مسیر ناوبری (Breadcrumb) — برای صفحات داخلی، سازگار با Google Rich Results */
export function buildBreadcrumbJsonLd(
  i18n: SiteI18n,
  settings: SiteSettings,
  items: { name: string; path?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: i18n.translate(item.name),
      item: item.path ? localizedUrl(settings, i18n.locale, item.path) : undefined,
    })),
  };
}
