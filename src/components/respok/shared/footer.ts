import { useRouterState } from "@tanstack/react-router";
import { useRespok } from "./context";

/** Footer facts shared by both templates. */
export function useRespokFooter() {
  const { settings, brand } = useRespok();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = (pathname.replace(/\/+$/, "") || "/") === "/";
  return {
    copyright: `© ${new Date().getFullYear()} ${brand}. All rights reserved.`,
    email: settings.brand.email?.trim() || "",
    phone: settings.brand.phone?.trim() || "",
    /** The trust seal configured in the admin panel is shown on the home page only. */
    trustBadgeHtml:
      isHome && settings.trustBadge?.enabled && settings.trustBadge.html
        ? settings.trustBadge.html
        : "",
  };
}
