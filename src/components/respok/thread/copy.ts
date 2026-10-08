/**
 * Thread-only interface copy that the shared content files do not cover yet (menu
 * labels, section questions, footer lines). Conversational wording only — no feature
 * claims live here.
 */
export const THREAD_COPY = {
  skip: "Skip to content",
  menu: {
    open: "Open menu",
    close: "Close menu",
    label: "Menu",
    primary: "Main",
    viewAll: { products: "View all products", solutions: "View all solutions" },
    heading: { products: "Products", solutions: "Solutions" },
  },
  footer: {
    tagline: "Live chat for websites. A question goes in, an answer comes back.",
    question: "Still have a question?",
    answer: "Talk to us",
    follow: "Follow",
    email: "Email",
    nav: "Footer",
  },
  legal: {
    toc: "On this page",
  },
  help: {
    faqQuestion: "Can you answer a quick one?",
  },
  sla: {
    creditsQuestion: "What if you miss it?",
    statsLabel: "Our commitments",
  },
  contact: {
    panelStatus: "We reply by email",
    reachQuestion: "Where else can I reach you?",
    form: "Contact form",
  },
  blog: {
    filter: "Filter by category",
    pagination: "Blog pages",
    tagQuestion: "Show me everything tagged",
    relatedQuestion: "What should I read next?",
    searching: (q: string) => `Results for “${q}”`,
    clear: "Clear search",
    showAll: "Show all articles",
  },
  placeholder: "This part of the conversation is still being written.",
} as const;
