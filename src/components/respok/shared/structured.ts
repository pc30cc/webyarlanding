/**
 * Structured data (schema.org JSON-LD) for the English template pages, shared by both
 * templates so search engines see the same facts whichever design is active. Text goes
 * through <JsonLd>, which localizes names/descriptions; URLs stay untouched.
 */
import { buildBreadcrumbJsonLd, parseSchemaJson } from "@/lib/seo-meta";
import type { SiteSettings } from "@/lib/settings";
import type { AppDto, AppPlatform } from "@/lib/apps.functions";
import type { CatalogItemDto, CatalogType } from "@/lib/catalog.functions";
import type { SeoPageDto } from "@/lib/seo.functions";
import type { NavCategory } from "./nav";
import type { RespokPlan } from "./pricing";

function base(settings: SiteSettings): string {
  return (settings.brand.siteUrl || "").replace(/\/$/, "");
}

function abs(settings: SiteSettings, path: string): string | undefined {
  const origin = base(settings);
  return origin ? `${origin}${path}` : undefined;
}

/** An admin-written schema for this page (SEO pages) always wins. */
export function withOverride(
  seoOverride: SeoPageDto | null | undefined,
  fallback: unknown,
): unknown {
  return parseSchemaJson(seoOverride?.schemaJson) ?? fallback;
}

export function breadcrumbs(settings: SiteSettings, items: { name: string; path: string }[]) {
  return buildBreadcrumbJsonLd(settings, items);
}

export function homeJsonLd(
  settings: SiteSettings,
  brand: string,
  description: string,
  faqs: { q: string; a: string }[],
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brand,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description,
      url: abs(settings, "/"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];
}

export function aboutJsonLd(settings: SiteSettings, brand: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: `About ${brand}`,
      url: abs(settings, "/about"),
      isPartOf: { "@type": "WebSite", name: brand, url: abs(settings, "") },
    },
    breadcrumbs(settings, [
      { name: "Home", path: "/" },
      { name: "About us", path: "/about" },
    ]),
  ];
}

export function pricingJsonLd(
  settings: SiteSettings,
  brand: string,
  plans: RespokPlan[],
  currency: "USD" | "Toman",
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brand,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: abs(settings, "/pricing"),
      offers: plans
        .map((plan) => {
          if (plan.price.kind === "contact") return null;
          const price = plan.price.kind === "free" ? "0" : plan.price.amount.replace(/[^\d.]/g, "");
          if (!price) return null;
          return {
            "@type": "Offer",
            name: plan.name,
            price,
            // Toman has no ISO code; the app's prices are Iranian rials ÷ 10.
            priceCurrency: currency === "USD" ? "USD" : "IRR",
            ...(currency === "USD" ? {} : { description: "Price in Toman" }),
            url: abs(settings, "/pricing"),
          };
        })
        .filter(Boolean),
    },
    breadcrumbs(settings, [
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]),
  ];
}

export function catalogIndexJsonLd(
  settings: SiteSettings,
  brand: string,
  kind: CatalogType,
  categories: NavCategory[],
) {
  const path = kind === "product" ? "/products" : "/solutions";
  const label = kind === "product" ? "Products" : "Solutions";
  const items = categories.flatMap((category) => category.items);
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${brand} ${label.toLowerCase()}`,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          name: item.title,
          description: item.shortDesc,
          url: abs(settings, `${path}/${item.slug}`),
          provider: { "@type": "Organization", name: brand },
        },
      })),
    },
    breadcrumbs(settings, [
      { name: "Home", path: "/" },
      { name: label, path },
    ]),
  ];
}

export function catalogItemJsonLd(
  settings: SiteSettings,
  brand: string,
  kind: CatalogType,
  item: Pick<CatalogItemDto, "slug">,
  title: string,
  description: string,
) {
  const path = kind === "product" ? "/products" : "/solutions";
  const label = kind === "product" ? "Products" : "Solutions";
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: title,
      description,
      url: abs(settings, `${path}/${item.slug}`),
      provider: {
        "@type": "Organization",
        name: brand,
        url: abs(settings, ""),
      },
    },
    breadcrumbs(settings, [
      { name: "Home", path: "/" },
      { name: label, path },
      { name: title, path: `${path}/${item.slug}` },
    ]),
  ];
}

const OS: Record<AppPlatform, string> = {
  ios: "iOS",
  android: "Android",
  windows: "Windows",
  mac: "macOS",
};

export function appJsonLd(settings: SiteSettings, app: AppDto, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    operatingSystem: OS[app.platform],
    applicationCategory: "BusinessApplication",
    ...(app.version ? { softwareVersion: app.version } : {}),
    description,
    url: abs(settings, `/download/${app.slug}`),
  };
}

export function downloadIndexJsonLd(
  settings: SiteSettings,
  apps: { app: AppDto; name: string; description: string }[],
) {
  return [
    ...apps.map(({ app, name, description }) => appJsonLd(settings, app, name, description)),
    breadcrumbs(settings, [
      { name: "Home", path: "/" },
      { name: "Download apps", path: "/download" },
    ]),
  ];
}
