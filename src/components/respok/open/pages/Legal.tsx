import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { getPrivacyContent, getTermsContent, type LegalDoc } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import type { LegalPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { LegalBody } from "../legal";
import { Badge, ChapterHero, Dot } from "../ui";

function LegalPage({ doc, path }: { doc: LegalDoc; path: "/privacy" | "/terms" }) {
  const { settings, brand, siteUrl } = useRespok();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: doc.title,
      url: siteUrl ? `${siteUrl}${path}` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: siteUrl || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: doc.title, path },
    ]),
  ];
  return (
    <>
      <JsonLd data={jsonLd} />
      <ChapterHero
        running={`${brand} · ${OPEN_COPY.legal.eyebrow}`}
        path={path}
        eyebrow={OPEN_COPY.legal.eyebrow}
        title={doc.title}
        size="md"
      >
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Badge tone="glass">
            <Dot size={6} />
            {doc.meta}
          </Badge>
          <Badge tone="glass">{OPEN_COPY.legal.sections(doc.sections.length)}</Badge>
        </div>
      </ChapterHero>
      <LegalBody sections={doc.sections} />
    </>
  );
}

export function PrivacyPage(_: LegalPageData) {
  const { settings, brand } = useRespok();
  const doc = getPrivacyContent(
    brand,
    settings.brand.email?.trim() || "",
    settings.brand.address?.trim() || "",
  );
  return <LegalPage doc={doc} path="/privacy" />;
}

export function TermsPage(_: LegalPageData) {
  const { settings, brand } = useRespok();
  const doc = getTermsContent(brand, settings.brand.email?.trim() || "");
  return <LegalPage doc={doc} path="/terms" />;
}
