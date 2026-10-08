import type { ContentFlags } from ".";

export function getBlogContent({ brand }: ContentFlags) {
  return {
    question: "What's new?",
    eyebrow: "Blog",
    title: "Blog",
    lede: `Articles and news from the ${brand} team about live chat, customer communication and growth.`,
    all: "All",
    search: "Search articles",
    searchPlaceholder: "Search articles…",
    empty: "No articles found.",
    general: "General",
    readMore: "Read more",
    readMoreAria: (title: string) => `Read more: ${title}`,
    minutes: (n: number) => `${n} min read`,
    previous: "Previous page",
    next: "Next page",
    page: (n: number) => `Page ${n}`,
    back: "Back to blog",
    tags: "Tags",
    related: "Related articles",
    by: "By",
    tag: {
      eyebrow: "Tag",
      count: (n: number) => `${n} ${n === 1 ? "article" : "articles"}`,
    },
  };
}
