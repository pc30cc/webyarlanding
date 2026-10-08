/**
 * Interface labels that belong to the Open template's chrome (navigation, landmarks,
 * reading aids). Product claims never live here: page copy comes from ../content.
 */
export const OPEN_COPY = {
  skip: "Skip to content",
  home: (brand: string) => `${brand} home`,
  tagline: "Live chat for websites. Every conversation starts in the corner.",
  nav: {
    main: "Main",
    open: "Open menu",
    close: "Close menu",
    sheet: "Site menu",
    viewAll: { products: "View all products", solutions: "View all solutions" },
  },
  footer: {
    label: "Footer",
    email: "Email",
    phone: "Phone",
    follow: "Follow",
    social: (name: string) => `${name} (opens in a new tab)`,
    top: "Back to top",
  },
  legal: {
    eyebrow: "Legal",
    contents: "Contents",
    sections: (n: number) => `${n} sections`,
    onThisPage: "On this page",
  },
  help: { contact: "Contact", policies: "Policies", faq: "FAQ", stuck: "Still stuck" },
  sla: { commitments: "Commitments", credits: "Credits" },
  contact: {
    panelSub: "We reply by email",
    details: "Details",
    support: "Support",
    required: "Required",
    loading: "Loading…",
  },
  blog: {
    journal: "Blog",
    filter: "Filter by category",
    results: (n: number) => `${n} ${n === 1 ? "article" : "articles"}`,
    pagination: "Pagination",
    resetSearch: "Show all articles",
    author: "Author",
    published: "Published",
    reading: "Reading time",
    category: "Category",
    latest: "Latest",
  },
  notFound: { status: "Status · away" },
  placeholder: "This section is coming together.",
} as const;
