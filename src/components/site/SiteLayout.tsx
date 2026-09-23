import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ChatWidget } from "./ChatWidget";
import { CallCenterWidget } from "./CallCenterWidget";
import { getPublicTagline, isEnglishChrome, type SiteSettings } from "@/lib/settings";
import { useRouterState } from "@tanstack/react-router";
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
      description: getPublicTagline(settings),
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const english = isEnglishChrome(settings, pathname);
  return (
    <div
      {...(english ? { dir: "ltr" as const, lang: "en" } : {})}
      className="site-theme relative flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground antialiased"
    >
      {/* گرادیان‌های ملایم برند در گوشه‌های صفحه — پس‌زمینه یکدست در تمام صفحات، حتی در نمایش خیلی عریض */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-24 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -end-24 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(siteJsonLd)} />
      <SiteHeader settings={settings} english={english} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} english={english} />
      <ChatWidget settings={settings} />
      <CallCenterWidget settings={settings} />
    </div>
  );
}
