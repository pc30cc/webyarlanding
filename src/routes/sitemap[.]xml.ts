import { createFileRoute } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { listPublishedPosts, listTags } from "@/lib/blog.functions";
import { getPublicCatalog } from "@/lib/catalog.functions";
import { getPublicApps } from "@/lib/apps.functions";
import { getActiveLocales, getDefaultLocale } from "@/lib/settings";
import { isLocale, type Locale } from "@/lib/locales";
import {
  hreflangAlternates,
  indexableLocales,
  localizedUrl,
  sameSiteCanonical,
  seoPageCanonicals,
  seoPageNoindexLocales,
  type SeoCanonicals,
} from "@/lib/seo-meta";
import { persianBlogPath } from "@/lib/locale-routing";

const staticPaths = [
  "/",
  "/products",
  "/solutions",
  "/about",
  "/pricing",
  "/contact",
  "/blog",
  "/terms",
  "/privacy",
  "/sla",
  "/help",
  "/download",
];

interface SitemapUrl {
  loc: string;
  lastmod?: string | null;
  /** نسخه‌های همین صفحه در زبان‌های دیگر (xhtml:link) */
  alternates?: { hrefLang: string; href: string }[];
}

/** مسیر داخلی یک صفحه به‌همراه تاریخ آخرین تغییر؛ بلاگ و برچسب‌ها فقط فارسی‌اند */
interface SitemapPage {
  path: string;
  lastmod?: string | null;
  blog?: boolean;
  /** زبان‌هایی که صفحه در آن‌ها وجود دارد (برنامه‌ها)؛ نبودنش یعنی همه زبان‌ها */
  locales?: Locale[];
  /**
   * صفحه ردیف seo_pages همین مسیر را می‌خواند (getPublicSeoPage در loader)؛ canonical سفارشی و
   * noindex هر زبان فقط برای همین صفحات در سایت‌مپ اعمال می‌شود، مثل خود صفحه
   */
  seo?: boolean;
}

/** اثر ردیف‌های seo_pages یک مسیر بر سایت‌مپ چندزبانه */
interface SeoPageHreflang {
  /** canonical سفارشی هر نسخه زبان */
  canonicals: SeoCanonicals;
  /** نسخه‌هایی که ردیف خودشان noindex است و نه آدرسشان می‌آید نه در hreflang بقیه */
  noindex: Locale[];
}

/** ستون‌هایی از seo_pages که سایت‌مپ لازم دارد */
interface SeoPageSitemapRow {
  path: string;
  locale?: string | null;
  canonical_url: string | null;
  robots: string | null;
}

/** حداقل کاراکترهای ویژه‌ی XML را در آدرس escape می‌کند تا سایت‌مپ همیشه معتبر بماند */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** آدرس کامل یک مسیر بدون پیشوند زبان (سایت تک‌زبانه؛ مثل قبل) */
function localUrl(settings: { brand: { siteUrl?: string } }, path: string): string {
  return `${(settings.brand.siteUrl || "").replace(/\/$/, "")}${path}`;
}

/** تاریخ آخرین تغییر به فرمت YYYY-MM-DD (استاندارد lastmod در پروتکل سایت‌مپ) */
function toLastmod(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * canonical سفارشی و noindex نسخه‌های زبان هر مسیر (seo_pages)، تا آدرس‌ها و hreflang سایت‌مپ با
 * canonical، robots و hreflang خود صفحه یکی باشد. فقط در سایت چندزبانه خوانده می‌شود؛ خطای
 * دیتابیس یعنی آدرس‌های پیش‌فرض.
 */
async function loadSeoHreflang(defaultLocale: Locale): Promise<Map<string, SeoPageHreflang>> {
  const result = new Map<string, SeoPageHreflang>();
  try {
    const { db } = await import("@/lib/db.server");
    const withLocale = await db.from("seo_pages").select("path, locale, canonical_url, robots");
    let found = withLocale.data as unknown as SeoPageSitemapRow[] | null;
    if (withLocale.error) {
      // ستون locale پیش از مایگریشن نیست (DATABASE_AUTO_MIGRATE=false): همه ردیف‌ها مثل
      // getPublicSeoPage متعلق به زبان پیش‌فرض‌اند
      console.error("sitemap seo pages with locale failed:", withLocale.error);
      const legacy = await db.from("seo_pages").select("path, canonical_url, robots");
      if (legacy.error) throw legacy.error;
      found = legacy.data as unknown as SeoPageSitemapRow[] | null;
    }
    const byPath = new Map<
      string,
      { locale: Locale | null; canonicalUrl: string | null; robots: string | null }[]
    >();
    for (const row of found ?? []) {
      // ردیف با زبان ناشناخته نادیده گرفته می‌شود (مثل getPublicSeoPage)
      if (row.locale && !isLocale(row.locale)) continue;
      const list = byPath.get(row.path) ?? [];
      list.push({
        locale: isLocale(row.locale) ? row.locale : null,
        canonicalUrl: row.canonical_url,
        robots: row.robots,
      });
      byPath.set(row.path, list);
    }
    for (const [path, rows] of byPath) {
      const canonicals = seoPageCanonicals(rows, defaultLocale);
      const noindex = seoPageNoindexLocales(rows, defaultLocale);
      if (Object.keys(canonicals).length > 0 || noindex.length > 0)
        result.set(path, { canonicals, noindex });
    }
  } catch (error) {
    console.error("sitemap seo pages failed:", error);
  }
  return result;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [settings, posts, tags, productCatalog, solutionCatalog, apps] = await Promise.all([
          fetchSettings(),
          listPublishedPosts({ data: {} }),
          listTags(),
          getPublicCatalog({ data: { type: "product" } }),
          getPublicCatalog({ data: { type: "solution" } }),
          getPublicApps().catch(() => []),
        ]);
        const pages: SitemapPage[] = [
          // همه صفحات ثابت جز بلاگ ردیف seo_pages مسیر خودشان را می‌خوانند
          ...staticPaths.map((path): SitemapPage =>
            path === "/blog" ? { path, blog: true } : { path, seo: true },
          ),
          ...posts.map((p): SitemapPage => ({
            path: `/blog/${p.slug}`,
            lastmod: toLastmod(p.updatedAt),
            blog: true,
          })),
          // دسته‌بندی‌های بلاگ صفحه‌ی مستقل ندارند — فیلترشان فقط سمت کلاینت است و
          // /blog?category=... همان محتوای /blog را رندر می‌کند، پس در سایت‌مپ نمی‌آید.
          // برچسب‌های تک‌مقاله‌ای noindex هستند (محتوای کافی برای ایندکس مستقل ندارند)،
          // پس در سایت‌مپ هم نمی‌آیند تا سیگنال سایت‌مپ با متای robots همان صفحه یکی باشد.
          ...tags
            .filter((t) => (t.postCount ?? 0) >= 2)
            .map((t): SitemapPage => ({ path: `/tag/${t.slug}`, blog: true })),
          ...productCatalog
            .flatMap((c) => c.items)
            .map((p): SitemapPage => ({
              path: `/products/${p.slug}`,
              lastmod: toLastmod(p.updatedAt),
              seo: true,
            })),
          ...solutionCatalog
            .flatMap((c) => c.items)
            .map((s): SitemapPage => ({
              path: `/solutions/${s.slug}`,
              lastmod: toLastmod(s.updatedAt),
              seo: true,
            })),
        ];
        // سایت چندزبانه: هر صفحه یک‌بار برای هر زبان قابل ایندکس، با نسخه‌های دیگر به‌صورت
        // xhtml:link؛ بلاگ فقط نسخه فارسی دارد. سایت تک‌زبانه: هر صفحه یک‌بار.
        const multi = settings.localization?.mode === "multi";
        const locales = multi ? indexableLocales(settings) : [];
        // برنامه‌ها ممکن است فقط در بعضی زبان‌ها نمایش داده شوند
        const appLocales = new Map<string, Locale[]>();
        let seoPages = new Map<string, SeoPageHreflang>();
        if (locales.length >= 2) {
          const fallback = getDefaultLocale(settings);
          const [perLocale, seoHreflang] = await Promise.all([
            Promise.all(
              locales.map((locale) =>
                getPublicApps({ data: { locale: locale === fallback ? null : locale } }).catch(
                  () => [],
                ),
              ),
            ),
            loadSeoHreflang(fallback),
          ]);
          seoPages = seoHreflang;
          perLocale.forEach((list, i) => {
            for (const app of list)
              appLocales.set(app.slug, [...(appLocales.get(app.slug) ?? []), locales[i] as Locale]);
          });
        }
        // صفحه برنامه ردیف seo_pages نمی‌خواند (override: null)، پس seo ندارد
        pages.push(
          ...(locales.length >= 2
            ? [...appLocales].map(([slug, available]): SitemapPage => ({
                path: `/download/${slug}`,
                locales: available,
              }))
            : apps.map((a): SitemapPage => ({ path: `/download/${a.slug}` }))),
        );
        let urls: SitemapUrl[] = pages.flatMap((page): SitemapUrl[] => {
          if (page.blog) {
            if (multi && !getActiveLocales(settings).includes("fa")) return [];
            const path = multi ? persianBlogPath(settings, page.path) : page.path;
            return [{ loc: localUrl(settings, path), lastmod: page.lastmod ?? null }];
          }
          if (locales.length < 2)
            return [{ loc: localUrl(settings, page.path), lastmod: page.lastmod ?? null }];
          // بلاگ و برچسب بالاتر برگشته‌اند؛ canonical سفارشی و noindex فقط برای صفحاتی که seo_pages
          // مسیر خودشان را می‌خوانند
          const seo = page.seo ? (seoPages.get(page.path) ?? null) : null;
          // نسخه‌ای که ردیف سئوی خودش noindex است نه آدرسش می‌آید نه در hreflang بقیه
          const available = (page.locales ?? locales).filter(
            (locale) => !seo?.noindex.includes(locale),
          );
          const custom = seo?.canonicals ?? null;
          const alternates = hreflangAlternates(settings, page.path, custom, available);
          return available.map((locale) => ({
            // canonical سفارشی فقط اگر آدرس کامل روی همین دامنه باشد (مثل hreflang صفحه)
            loc:
              sameSiteCanonical(settings, custom?.[locale]) ||
              (localizedUrl(settings, locale, page.path) ?? ""),
            lastmod: page.lastmod ?? null,
            alternates,
          }));
        });
        // canonical سفارشی ممکن است به آدرس صفحه‌ی دیگری اشاره کند؛ هر آدرس یک‌بار می‌آید
        if (locales.length >= 2) {
          const seen = new Set<string>();
          urls = urls.filter((u) => !seen.has(u.loc) && Boolean(seen.add(u.loc)));
        }
        const hasAlternates = urls.some((u) => u.alternates?.length);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
          hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""
        }>\n${urls
          .map(
            (u) =>
              `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${(
                u.alternates ?? []
              )
                .map(
                  (a) =>
                    `<xhtml:link rel="alternate" hreflang="${escapeXml(a.hrefLang)}" href="${escapeXml(a.href)}"/>`,
                )
                .join("")}</url>`,
          )
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=UTF-8" } });
      },
    },
  },
});
