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
  home: {
    stageLabel: "Preview: the chat widget on a website, with a new reply waiting",
    today: "Today",
    poweredBy: "Powered by",
    callInvite: { title: "Video call", body: "Join from your browser", join: "Join" },
    inbox: "Inbox",
    inboxOpen: "Open",
    typing: (name: string) => `${name} is typing`,
    channelsLabel: "Connected channels",
    videoTitle: "Video call with a website visitor",
    operatorTitle: "The operator's camera",
    faqTyping: "Typing an answer",
    appsLink: "Download the apps",
    appDetails: "Details",
    storeAll: "All downloads",
  },
  about: {
    valuesQuestion: "What do you care about?",
    teamQuestion: "Who builds it?",
  },
  pricing: {
    period: "Billing period",
    toman: "Prices in Toman",
    plansLabel: "Plans",
    limitsLabel: "Limits",
    featureCount: (n: number) => `${n} more`,
    compareQuestion: "How do the plans compare?",
  },
  catalog: {
    jump: "Jump to a category",
    itemQuestion: (title: string) => `Tell me about ${title}`,
    breadcrumb: "Breadcrumb",
    home: "Home",
    count: (n: number, kind: "product" | "solution") =>
      `${n} ${kind === "product" ? (n === 1 ? "product" : "products") : n === 1 ? "solution" : "solutions"}`,
  },
  download: {
    perksQuestion: "What do I get with the apps?",
    storesLabel: "Download links",
    gallery: (name: string) => `${name} screenshots`,
    illustration: (name: string) => `Illustration of ${name}: the inbox and a conversation`,
    comingSoon: "Coming soon",
    platform: "Platform",
  },
} as const;
