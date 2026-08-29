import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ChatWidget } from "./ChatWidget";
import type { SiteSettings } from "@/lib/settings";

/** JSON-LD سازمانی + وب‌سایت، سراسری برای همه صفحات (سئو). */
function buildSiteJsonLd(settings: SiteSettings): unknown[] {
  let organization: unknown | null = null;
  if (settings.seo.jsonLdOrganization) {
    try {
      organization = JSON.parse(settings.seo.jsonLdOrganization);
    } catch {
      organization = null;
    }
  }
  if (!organization) {
    organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.brand.name,
      url: settings.brand.siteUrl || undefined,
      logo: settings.brand.logoUrl || undefined,
      description: settings.brand.tagline,
      ...(settings.brand.email ? { email: settings.brand.email } : {}),
      ...(settings.brand.phone ? { telephone: settings.brand.phone } : {}),
      sameAs: [
        settings.social.instagram,
        settings.social.telegram,
        settings.social.linkedin,
        settings.social.twitter,
        settings.social.youtube,
        settings.social.whatsapp,
      ].filter(Boolean),
    };
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brand.name,
    url: settings.brand.siteUrl || undefined,
  };

  return [organization, website];
}

export function SiteLayout({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  const siteJsonLd = buildSiteJsonLd(settings);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <ChatWidget settings={settings} />
    </div>
  );
}
