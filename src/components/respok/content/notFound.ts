import type { NotFoundKind } from "../types";

const COPY: Record<
  NotFoundKind,
  { title: string; body: string; back: { label: string; to: string } }
> = {
  page: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has moved. Head back home or use the menu to find what you need.",
    back: { label: "Back to home", to: "/" },
  },
  post: {
    title: "Article not found",
    body: "This article may have been moved or unpublished.",
    back: { label: "Back to blog", to: "/blog" },
  },
  tag: {
    title: "Tag not found",
    body: "There are no published articles with this tag yet.",
    back: { label: "Back to blog", to: "/blog" },
  },
  product: {
    title: "Product not found",
    body: "This product may have been renamed or removed.",
    back: { label: "All products", to: "/products" },
  },
  solution: {
    title: "Solution not found",
    body: "This solution may have been renamed or removed.",
    back: { label: "All solutions", to: "/solutions" },
  },
  app: {
    title: "App not found",
    body: "This app isn't available. See all the apps you can download.",
    back: { label: "Back to app downloads", to: "/download" },
  },
};

export function getNotFoundContent(kind: NotFoundKind) {
  return {
    code: "404",
    question: "Hello? Is this page here?",
    ...COPY[kind],
    secondary: { label: "Contact us", to: "/contact" },
  };
}
