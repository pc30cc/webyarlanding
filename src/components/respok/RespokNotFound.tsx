import type { ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { getSiteLanguage } from "@/lib/site-i18n";
import type { SiteSettings } from "@/lib/settings";
import { RespokPage } from "./RespokPage";
import type { NotFoundKind } from "./types";

const rootRoute = getRouteApi("__root__");

/**
 * Route-level "not found": the active English template's 404 page on the English site,
 * the route's own Persian markup (children) otherwise.
 */
export function RespokNotFoundSwitch({
  kind,
  children,
}: {
  kind: NotFoundKind;
  children: ReactNode;
}) {
  const root = rootRoute.useLoaderData() as { settings?: SiteSettings } | undefined;
  const settings = root?.settings;
  if (settings && getSiteLanguage(settings) === "en")
    return <RespokPage page="notFound" data={{ settings, kind }} />;
  return <>{children}</>;
}
