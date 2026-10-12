import { RespokPage } from "@/components/respok/RespokPage";
import { getSiteLanguage } from "@/lib/site-i18n";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta } from "@/lib/seo-meta";
import { getRespokBrandName } from "@/lib/settings";

// Refund Policy: English (Respok) site only; the Persian site has no such page.
export const Route = createFileRoute("/refund")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/refund" } }),
    ]);
    if (getSiteLanguage(settings) !== "en") throw notFound();
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const brand = getRespokBrandName(loaderData.settings);
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/refund",
      override: loaderData.seoOverride,
      fallbackTitle: `Refund Policy | ${brand}`,
      fallbackDescription: `${brand} offers a 14-day money-back guarantee on payments made on our website. How to request a refund, how long it takes and what is covered.`,
    });
  },
  component: RefundPage,
});

function RefundPage() {
  const data = Route.useLoaderData();
  return <RespokPage page="refund" data={data} />;
}
