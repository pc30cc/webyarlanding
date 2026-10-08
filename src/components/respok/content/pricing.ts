/**
 * Built-in plans, shown only when the plans synced from the app are unavailable
 * (settings.plans disabled or the plans API unreachable). Only features the app really
 * has are listed (checked against the app's capability registry).
 */
import type { FeatureNeed } from ".";

export interface StaticPlan {
  slug: string;
  name: string;
  description: string;
  popular: boolean;
  /** US-dollar prices (the app's seed plans); null = contact sales. */
  usd: { monthly: number; yearly: number } | null;
  limits: { label: string; value: string }[];
  features: { text: string; needs?: FeatureNeed }[];
}

export const STATIC_PLANS: StaticPlan[] = [
  {
    slug: "free",
    name: "Free",
    description: "To get started and try the product",
    popular: false,
    usd: { monthly: 0, yearly: 0 },
    limits: [
      { label: "Operators", value: "1" },
      { label: "Monthly conversations", value: "50" },
      { label: "Domains", value: "1" },
    ],
    features: [
      { text: "Website chat widget" },
      { text: "Shared inbox and saved replies" },
      { text: "Contacts" },
      { text: "Knowledge base" },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "For growing teams",
    popular: true,
    usd: { monthly: 29, yearly: 290 },
    limits: [
      { label: "Operators", value: "5" },
      { label: "Monthly conversations", value: "Unlimited" },
      { label: "Domains", value: "3" },
    ],
    features: [
      { text: "Website chat widget" },
      { text: "Voice and video calls", needs: "call" },
      { text: "AI agent", needs: "ai" },
      { text: "Proactive messages and automatic assignment" },
      { text: "Contacts with CSV import and export" },
      { text: "Telegram and WhatsApp in the inbox" },
      { text: "Live visitors and website analytics" },
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "For large businesses",
    popular: false,
    usd: { monthly: 99, yearly: 990 },
    limits: [
      { label: "Operators", value: "Unlimited" },
      { label: "Monthly conversations", value: "Unlimited" },
      { label: "Domains", value: "Unlimited" },
    ],
    features: [
      { text: "Everything in Pro" },
      { text: "Call center with queue, callbacks and recording", needs: "call" },
      { text: "AI drafts for operators", needs: "ai" },
      { text: "SEO tools and Brand Radar" },
      { text: "Store connectors for WooCommerce, OpenCart and WHMCS" },
    ],
  },
];

export const STATIC_COMPARISON: {
  columns: string[];
  rows: { label: string; values: (string | boolean)[]; needs?: FeatureNeed }[];
} = {
  columns: ["Free", "Pro", "Enterprise"],
  rows: [
    { label: "Operators", values: ["1", "5", "Unlimited"] },
    { label: "Monthly conversations", values: ["50", "Unlimited", "Unlimited"] },
    { label: "Domains", values: ["1", "3", "Unlimited"] },
    { label: "Voice and video calls", values: [false, true, true], needs: "call" },
    { label: "Call center", values: [false, false, true], needs: "call" },
    { label: "AI agent", values: [false, true, true], needs: "ai" },
    { label: "Contacts", values: ["Basic", "With import and export", "With import and export"] },
    { label: "Proactive messages", values: [false, true, true] },
    { label: "Messaging channels (Telegram, WhatsApp)", values: [false, true, true] },
    { label: "Live visitors and website analytics", values: [false, true, true] },
    { label: "SEO tools", values: [false, false, true] },
  ],
};

export function getPricingContent(brand: string, call: boolean, ai: boolean) {
  return {
    question: "How much does it cost?",
    eyebrow: "Pricing",
    title: "Features and pricing",
    lede: `${call ? "From live chat and calls" : "From live chat"} to ${ai ? "an AI agent, " : ""}contacts, SEO and analytics. Pick the plan that fits from ${brand}'s feature set.`,
    monthly: "Monthly",
    yearly: "Yearly",
    popular: "Most popular",
    limits: "Limits",
    features: "Features",
    showAll: "Show all features",
    showLess: "Show less",
    comparisonTitle: "Compare plans",
    comparisonFeature: "Feature",
    included: "Included",
    notIncluded: "Not included",
    questionsTitle: "Questions about plans?",
    questionsBody: "Talk to us and we'll help you choose.",
    questionsCta: "Contact sales",
  };
}
