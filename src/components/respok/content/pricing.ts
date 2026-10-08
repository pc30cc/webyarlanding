/**
 * Built-in plans, shown only when the plans synced from the app are unavailable
 * (settings.plans disabled or the plans API unreachable). Same plans as the Persian
 * site's fallback.
 */
import type { FeatureNeed } from ".";

export interface StaticPlan {
  slug: string;
  name: string;
  description: string;
  popular: boolean;
  /** Monthly price in Toman; 0 = free; null = contact sales. */
  toman: number | null;
  limits: { label: string; value: string }[];
  features: { text: string; needs?: FeatureNeed }[];
}

export const STATIC_PLANS: StaticPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    description: "To get started and try the product",
    popular: false,
    toman: 0,
    limits: [
      { label: "Operators", value: "1" },
      { label: "Monthly conversations", value: "50" },
      { label: "Domains", value: "1" },
    ],
    features: [
      { text: "Website chat widget" },
      { text: "Contact management (basic CRM)" },
      { text: "Basic reports" },
      { text: "Email support" },
    ],
  },
  {
    slug: "professional",
    name: "Professional",
    description: "For growing teams",
    popular: true,
    toman: 490000,
    limits: [
      { label: "Operators", value: "5" },
      { label: "Monthly conversations", value: "Unlimited" },
      { label: "Domains", value: "3" },
    ],
    features: [
      { text: "Website chat widget" },
      { text: "HD video calls and screen sharing", needs: "call" },
      { text: "AI assistant", needs: "ai" },
      { text: "Automation and knowledge base" },
      { text: "Complete CRM with tags" },
      { text: "WhatsApp and Telegram connection" },
      { text: "Marketing campaigns" },
      { text: "Complete reports and analytics" },
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "For large businesses",
    popular: false,
    toman: null,
    limits: [
      { label: "Operators", value: "Unlimited" },
      { label: "Monthly conversations", value: "Unlimited" },
      { label: "Domains", value: "Unlimited" },
    ],
    features: [
      { text: "Everything in Professional" },
      { text: "Multiple domains at once" },
      { text: "Call center and call queue", needs: "call" },
      { text: "Full API and webhooks" },
      { text: "Single sign-on (SSO) and role-based access" },
      { text: "White label" },
      { text: "SLA and dedicated support" },
    ],
  },
];

export const STATIC_COMPARISON: {
  columns: string[];
  rows: { label: string; values: (string | boolean)[]; needs?: FeatureNeed }[];
} = {
  columns: ["Starter", "Professional", "Enterprise"],
  rows: [
    { label: "Operators", values: ["1", "5", "Unlimited"] },
    { label: "Monthly conversations", values: ["50", "Unlimited", "Unlimited"] },
    { label: "Domains", values: ["1", "3", "Unlimited"] },
    { label: "HD video calls", values: [false, true, true], needs: "call" },
    { label: "Screen sharing", values: [false, true, true], needs: "call" },
    { label: "AI assistant", values: [false, true, true], needs: "ai" },
    { label: "CRM and customer management", values: ["Basic", "Complete", "Complete"] },
    { label: "Automation and knowledge base", values: [false, true, true] },
    { label: "Campaigns and marketing", values: [false, true, true] },
    { label: "Messaging channels (WhatsApp, Telegram)", values: [false, true, true] },
    { label: "Reports and analytics", values: ["Basic", "Complete", "Complete"] },
    { label: "API and webhooks", values: [false, false, true] },
    { label: "Access control (RBAC / SSO)", values: [false, false, true] },
    { label: "Dedicated support", values: [false, false, true] },
  ],
};

export function getPricingContent(brand: string, call: boolean, ai: boolean) {
  return {
    question: "How much does it cost?",
    eyebrow: "Pricing",
    title: "Features and pricing",
    lede: `${call ? "From live chat and video calls" : "From live chat"} to ${ai ? "an AI assistant, " : ""}CRM, automation, campaigns and reporting. Pick the plan that fits from ${brand}'s complete feature set.`,
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
