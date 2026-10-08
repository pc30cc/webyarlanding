import { safeJsonLdHtml } from "@/lib/seo-meta";
import { localizeStructuredData } from "@/lib/site-i18n";
import { useRespok } from "./context";

/** Structured data for search engines, translated with the same rules as page text. */
export function JsonLd({ data }: { data: unknown }) {
  const { settings } = useRespok();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={safeJsonLdHtml(localizeStructuredData(settings, data))}
    />
  );
}
