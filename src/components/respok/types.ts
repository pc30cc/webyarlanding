/**
 * Data contract between the public routes and the two English (Respok) templates.
 * Every route passes its own loader data unchanged; templates never fetch page data.
 */
import type { ComponentType, ReactNode } from "react";
import type { EnglishTemplate, SiteSettings } from "@/lib/settings";
import type { SeoPageDto } from "@/lib/seo.functions";
import type { AppDto } from "@/lib/apps.functions";
import type { CatalogCategoryDto, CatalogItemDto, CatalogType } from "@/lib/catalog.functions";
import type { CategoryDto, PostDto, PostPageDto } from "@/lib/blog.functions";
import type { PlansComparison, PublicPlan } from "@/lib/plans";

export type { EnglishTemplate };

interface WithSettings {
  settings: SiteSettings;
}
interface WithSeo extends WithSettings {
  seoOverride: SeoPageDto | null;
}

export type HomePageData = WithSeo & { apps: AppDto[] };
export type AboutPageData = WithSeo;
export type ContactPageData = WithSeo;
export type PricingPageData = WithSeo & {
  remotePlans: { plans: PublicPlan[]; comparison: PlansComparison } | null;
};
export type LegalPageData = WithSeo;
export type BlogIndexPageData = WithSeo & {
  page: PostPageDto;
  categories: CategoryDto[];
  category?: string | undefined;
  q?: string | undefined;
};
export type BlogPostPageData = WithSettings & {
  post: PostDto;
  related: PostDto[];
};
export type TagPageData = WithSeo & { posts: PostDto[]; slug: string };
export type CatalogIndexPageData = WithSeo & {
  kind: CatalogType;
  categories: CatalogCategoryDto[];
};
export type CatalogItemPageData = WithSeo & {
  kind: CatalogType;
  item: CatalogItemDto;
  categoryTitle: string | null;
  related: CatalogItemDto[];
};
export type DownloadIndexPageData = WithSeo & { apps: AppDto[] };
export type DownloadAppPageData = WithSettings & {
  app: AppDto;
  others: AppDto[];
};
/** What could not be found decides the copy and the way back. */
export type NotFoundKind = "page" | "post" | "tag" | "product" | "solution" | "app";
export type NotFoundPageData = WithSettings & { kind: NotFoundKind };

export interface RespokPageProps {
  home: HomePageData;
  about: AboutPageData;
  contact: ContactPageData;
  pricing: PricingPageData;
  privacy: LegalPageData;
  terms: LegalPageData;
  sla: LegalPageData;
  help: LegalPageData;
  blogIndex: BlogIndexPageData;
  blogPost: BlogPostPageData;
  tag: TagPageData;
  catalogIndex: CatalogIndexPageData;
  catalogItem: CatalogItemPageData;
  downloadIndex: DownloadIndexPageData;
  downloadApp: DownloadAppPageData;
  notFound: NotFoundPageData;
}
export type RespokPageKey = keyof RespokPageProps;

export interface RespokShellProps {
  children: ReactNode;
}

/** What each template module (open/, thread/) default-exports. */
export interface RespokTemplateModule {
  template: EnglishTemplate;
  /** Header, navigation, footer and page frame. */
  Shell: ComponentType<RespokShellProps>;
  pages: { [K in RespokPageKey]: ComponentType<RespokPageProps[K]> };
}
