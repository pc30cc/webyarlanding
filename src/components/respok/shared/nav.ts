import { getRouteApi } from "@tanstack/react-router";
import type { CatalogCategoryDto } from "@/lib/catalog.functions";
import { useRespok } from "./context";
import { isAllowedText } from "./gating";

const rootRoute = getRouteApi("__root__");

export interface NavItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  /** lucide icon name from the catalog icon registry (see getIcon). */
  icon: string;
}
export interface NavCategory {
  id: string;
  title: string;
  items: NavItem[];
}

/** Catalog categories, translated and filtered by the call/AI switches. */
export function useGatedCatalog(
  categories: CatalogCategoryDto[],
): NavCategory[] {
  const { t, callEnabled, aiEnabled } = useRespok();
  return categories
    .map((category) => ({
      id: category.id,
      title: t(category.title),
      items: category.items
        .filter((item) =>
          isAllowedText(
            { callEnabled, aiEnabled },
            item.title,
            item.shortDesc,
            t(item.title),
            t(item.shortDesc),
          ),
        )
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          title: t(item.title),
          shortDesc: t(item.shortDesc),
          icon: item.icon,
        })),
    }))
    .filter((category) => category.items.length > 0);
}

/** Products and solutions for the header menus (from the root loader). */
export function useRespokCatalogNav(): {
  products: NavCategory[];
  solutions: NavCategory[];
} {
  const data = rootRoute.useLoaderData() as
    | {
        productCatalog?: CatalogCategoryDto[];
        solutionCatalog?: CatalogCategoryDto[];
      }
    | undefined;
  return {
    products: useGatedCatalog(data?.productCatalog ?? []),
    solutions: useGatedCatalog(data?.solutionCatalog ?? []),
  };
}

export interface NavLinkItem {
  label: string;
  to: string;
  hash?: string;
  /** Opens a products/solutions menu built from useRespokCatalogNav. */
  menu?: "products" | "solutions";
}

/** Main navigation, same destinations as the Persian site. */
export const PRIMARY_NAV: NavLinkItem[] = [
  { label: "Product", to: "/products", menu: "products" },
  { label: "Solutions", to: "/solutions", menu: "solutions" },
  { label: "Pricing", to: "/pricing" },
  { label: "Features", to: "/", hash: "features" },
  { label: "Blog", to: "/blog" },
  { label: "Download", to: "/download" },
];

export const FOOTER_COLUMNS: { title: string; links: NavLinkItem[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Products", to: "/products" },
      { label: "Solutions", to: "/solutions" },
      { label: "Pricing", to: "/pricing" },
      { label: "Download apps", to: "/download" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      { label: "Support", to: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Service Level Agreement", to: "/sla" },
    ],
  },
];

/** Social profiles configured in the admin panel, in a stable order. */
export function useSocialLinks(): { name: string; href: string }[] {
  const { settings } = useRespok();
  const social = settings.social;
  return (
    [
      ["Instagram", social.instagram],
      ["Telegram", social.telegram],
      ["LinkedIn", social.linkedin],
      ["X", social.twitter],
      ["YouTube", social.youtube],
      ["WhatsApp", social.whatsapp],
    ] as const
  )
    .filter(([, href]) => !!href?.trim())
    .map(([name, href]) => ({ name, href: href.trim() }));
}
