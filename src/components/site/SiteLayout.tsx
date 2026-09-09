import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ChatWidget } from "./ChatWidget";
import { CallCenterWidget } from "./CallCenterWidget";
import type { SiteSettings } from "@/lib/settings";
import { safeJsonLdHtml } from "@/lib/seo-meta";

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

export function SiteLayout({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const siteJsonLd = buildSiteJsonLd(settings);
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      {/* گرادیان‌های ملایم برند در گوشه‌های صفحه — پس‌زمینه یکدست در تمام صفحات، حتی در نمایش خیلی عریض */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-24 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -end-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(siteJsonLd)} />
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <ChatWidget settings={settings} />
      <CallCenterWidget settings={settings} />
    </div>
  );
}
