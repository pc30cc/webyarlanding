import type { RespokTemplateModule } from "../types";
import { AboutPage } from "./pages/About";
import { BlogIndexPage } from "./pages/BlogIndex";
import { BlogPostPage } from "./pages/BlogPost";
import { CatalogIndexPage } from "./pages/CatalogIndex";
import { CatalogItemPage } from "./pages/CatalogItem";
import { ContactPage } from "./pages/Contact";
import { HelpPage } from "./pages/Help";
import { HomePage } from "./pages/Home";
import { PrivacyPage, TermsPage } from "./pages/Legal";
import { NotFoundPage } from "./pages/NotFound";
import { PlaceholderPage } from "./pages/Placeholder";
import { PricingPage } from "./pages/Pricing";
import { SlaPage } from "./pages/Sla";
import { TagPage } from "./pages/Tag";

export const pages: RespokTemplateModule["pages"] = {
  home: HomePage,
  about: AboutPage,
  contact: ContactPage,
  pricing: PricingPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  sla: SlaPage,
  help: HelpPage,
  blogIndex: BlogIndexPage,
  blogPost: BlogPostPage,
  tag: TagPage,
  catalogIndex: CatalogIndexPage,
  catalogItem: CatalogItemPage,
  downloadIndex: () => <PlaceholderPage name="Download" />,
  downloadApp: ({ app }) => <PlaceholderPage name={app.slug} />,
  notFound: NotFoundPage,
};
