import { createFileRoute } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { listPublishedPosts, listTags } from "@/lib/blog.functions";
import { getPublicCatalog } from "@/lib/catalog.functions";
import { getPublicApps } from "@/lib/apps.functions";
import { getActiveLocales, getDefaultLocale } from "@/lib/settings";
import type { Locale } from "@/lib/locales";
import { hreflangAlternates, indexableLocales, localizedUrl } from "@/lib/seo-meta";
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
          ...staticPaths.map((path): SitemapPage => ({ path, blog: path === "/blog" })),
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
            })),
          ...solutionCatalog
            .flatMap((c) => c.items)
            .map((s): SitemapPage => ({
              path: `/solutions/${s.slug}`,
              lastmod: toLastmod(s.updatedAt),
            })),
        ];
        // سایت چندزبانه: هر صفحه یک‌بار برای هر زبان قابل ایندکس، با نسخه‌های دیگر به‌صورت
        // xhtml:link؛ بلاگ فقط نسخه فارسی دارد. سایت تک‌زبانه: هر صفحه یک‌بار.
        const multi = settings.localization?.mode === "multi";
        const locales = multi ? indexableLocales(settings) : [];
        // برنامه‌ها ممکن است فقط در بعضی زبان‌ها نمایش داده شوند
        const appLocales = new Map<string, Locale[]>();
        if (locales.length >= 2) {
          const fallback = getDefaultLocale(settings);
          const perLocale = await Promise.all(
            locales.map((locale) =>
              getPublicApps({ data: { locale: locale === fallback ? null : locale } }).catch(
                () => [],
              ),
            ),
          );
          perLocale.forEach((list, i) => {
            for (const app of list)
              appLocales.set(app.slug, [...(appLocales.get(app.slug) ?? []), locales[i] as Locale]);
          });
        }
        pages.push(
          ...(locales.length >= 2
            ? [...appLocales].map(([slug, available]): SitemapPage => ({
                path: `/download/${slug}`,
                locales: available,
              }))
            : apps.map((a): SitemapPage => ({ path: `/download/${a.slug}` }))),
        );
        const urls: SitemapUrl[] = pages.flatMap((page): SitemapUrl[] => {
          if (page.blog) {
            if (multi && !getActiveLocales(settings).includes("fa")) return [];
            const path = multi ? persianBlogPath(settings, page.path) : page.path;
            return [{ loc: localUrl(settings, path), lastmod: page.lastmod ?? null }];
          }
          if (locales.length < 2)
            return [{ loc: localUrl(settings, page.path), lastmod: page.lastmod ?? null }];
          const available = page.locales ?? locales;
          const alternates = hreflangAlternates(settings, page.path, null, available);
          return available.map((locale) => ({
            loc: localizedUrl(settings, locale, page.path) ?? "",
            lastmod: page.lastmod ?? null,
            alternates,
          }));
        });
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
