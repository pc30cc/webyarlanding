import type { RespokTemplateModule } from "../types";
import { BlogIndexPage } from "./pages/BlogIndex";
import { BlogPostPage } from "./pages/BlogPost";
import { ContactPage } from "./pages/Contact";
import { HelpPage } from "./pages/Help";
import { PrivacyPage, TermsPage } from "./pages/Legal";
import { NotFoundPage } from "./pages/NotFound";
import { Placeholder } from "./pages/Placeholder";
import { SlaPage } from "./pages/Sla";
import { TagPage } from "./pages/Tag";

export const pages: RespokTemplateModule["pages"] = {
  home: () => <Placeholder name="Home" path="/" />,
  about: () => <Placeholder name="About" path="/about" />,
  contact: ContactPage,
  pricing: () => <Placeholder name="Pricing" path="/pricing" />,
  privacy: PrivacyPage,
  terms: TermsPage,
  sla: SlaPage,
  help: HelpPage,
  blogIndex: BlogIndexPage,
  blogPost: BlogPostPage,
  tag: TagPage,
  catalogIndex: ({ kind }) => (
    <Placeholder
      name={kind === "solution" ? "Solutions" : "Products"}
      path={kind === "solution" ? "/solutions" : "/products"}
    />
  ),
  catalogItem: ({ item, kind }) => (
    <Placeholder
      name={kind === "solution" ? "Solution" : "Product"}
      path={`/${kind === "solution" ? "solutions" : "products"}/${item.slug}`}
    />
  ),
  downloadIndex: () => <Placeholder name="Download" path="/download" />,
  downloadApp: ({ app }) => <Placeholder name="Download" path={`/download/${app.slug}`} />,
  notFound: NotFoundPage,
};
