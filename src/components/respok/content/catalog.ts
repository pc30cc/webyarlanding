import type { CatalogType } from "@/lib/catalog.functions";
import { joinEn, type ContentFlags } from ".";

export function getCatalogContent(
  kind: CatalogType,
  { callEnabled: call, aiEnabled: ai, brand }: ContentFlags,
) {
  if (kind === "product")
    return {
      question: "What can I do with it?",
      eyebrow: "Products",
      title: ["Everything you need for", "customer communication"],
      lede: `${joinEn(["Live chat", call && "voice and video calls", ai && "an AI agent", "contacts", "analytics"])}, all in one platform. Install in minutes, without a technical team.`,
      learnMore: "Learn more",
      empty: "Products will appear here soon.",
      band: {
        title: "Find the right solution for your business",
        body: `${brand} adapts to different industries, from online stores to online education.`,
        primary: { label: "Explore solutions", to: "/solutions" as const },
        secondary: { label: "View pricing", to: "/pricing" as const },
      },
      detail: {
        crumb: "Products",
        features: (title: string) => `What ${title} includes`,
        related: "More products in this category",
        back: "All products",
        primary: "Start free",
        secondary: { label: "View pricing", to: "/pricing" as const },
      },
    };
  return {
    question: "Will it work for my business?",
    eyebrow: "Solutions",
    title: ["A solution made for", "your business"],
    lede: `${brand} works differently in every industry. Explore the solution built for yours.`,
    learnMore: "Learn more",
    empty: "Solutions will appear here soon.",
    band: {
      title: "Can't find your industry?",
      body: `${brand} can be set up for any business that wants live conversations with customers. Get in touch.`,
      primary: { label: "Free consultation", to: "/contact" as const },
      secondary: { label: "Explore products", to: "/products" as const },
    },
    detail: {
      crumb: "Solutions",
      features: (title: string) => `What ${brand} does for ${title}`,
      related: "More solutions in this category",
      back: "All solutions",
      primary: "Free consultation",
      secondary: { label: "Explore products", to: "/products" as const },
    },
  };
}
