import { AdsMeasurementConsent } from "@/components/AdsMeasurementConsent";
import { CallCenterWidget } from "@/components/site/CallCenterWidget";
import { ChatWidget } from "@/components/site/ChatWidget";
import { buildSiteJsonLd } from "@/components/site/SiteLayout";
import type { ComponentType } from "react";
import { getEnglishTemplate } from "@/lib/settings";
import { RespokProvider } from "./shared/context";
import { JsonLd } from "./shared/JsonLd";
import { useRespokTemplate } from "./registry";
import type { RespokPageKey, RespokPageProps } from "./types";

/**
 * Entry point used by every public route when the site language is English: renders
 * the active Respok template (Open or Thread) around the requested page.
 */
export function RespokPage<K extends RespokPageKey>({
  page,
  data,
}: {
  page: K;
  data: RespokPageProps[K];
}) {
  const settings = data.settings;
  const template = getEnglishTemplate(settings);
  const module = useRespokTemplate(template);
  const Page = module.pages[page] as ComponentType<RespokPageProps[K]>;
  const Shell = module.Shell;
  return (
    <RespokProvider settings={settings}>
      <div
        dir="ltr"
        lang="en"
        data-template={template}
        className={`respok respok-${template} relative flex min-h-dvh flex-col overflow-x-clip`}
      >
        <JsonLd data={buildSiteJsonLd(settings)} />
        <AdsMeasurementConsent english />
        <Shell>
          <Page {...data} />
        </Shell>
        <ChatWidget settings={settings} />
        <CallCenterWidget settings={settings} />
      </div>
    </RespokProvider>
  );
}
