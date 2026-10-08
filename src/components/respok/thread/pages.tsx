import type { RespokTemplateModule } from "../types";

function Placeholder({ name }: { name: string }) {
  return <h1 className="p-8 text-4xl font-extrabold">Thread · {name}</h1>;
}

export const pages: RespokTemplateModule["pages"] = {
  home: () => <Placeholder name="home" />,
  about: () => <Placeholder name="about" />,
  contact: () => <Placeholder name="contact" />,
  pricing: () => <Placeholder name="pricing" />,
  privacy: () => <Placeholder name="privacy" />,
  terms: () => <Placeholder name="terms" />,
  sla: () => <Placeholder name="sla" />,
  help: () => <Placeholder name="help" />,
  blogIndex: () => <Placeholder name="blog" />,
  blogPost: ({ post }) => <Placeholder name={post.title} />,
  tag: ({ slug }) => <Placeholder name={slug} />,
  catalogIndex: ({ kind }) => <Placeholder name={kind} />,
  catalogItem: ({ item }) => <Placeholder name={item.slug} />,
  downloadIndex: () => <Placeholder name="download" />,
  downloadApp: ({ app }) => <Placeholder name={app.slug} />,
  notFound: ({ kind }) => <Placeholder name={"404 " + kind} />,
};
