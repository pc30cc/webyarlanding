import { Award, Heart, Target } from "lucide-react";
import { joinEn, type ContentFlags, type FeatureCopy } from ".";

export function getAboutContent({ callEnabled: call, aiEnabled: ai, brand }: ContentFlags) {
  const middle = joinEn([ai && "an AI agent", call && "a call center"]);
  return {
    question: `Who's behind ${brand}?`,
    eyebrow: "About us",
    title: `The story of ${brand}`,
    lede: `${brand} was built to help online businesses talk to customers as naturally as a shop assistant does, without a big technical team: ${call ? "through live chat and video calls" : "through live chat"}, right where customers make their decisions. Over time it grew into a complete platform${middle ? `: from ${middle} to` : " with"} contacts, a knowledge base, SEO and web analytics, all in one simple dashboard.`,
    values: [
      { icon: Target, title: "Mission", body: "Help online businesses answer customers faster, without complicated tools." },
      { icon: Heart, title: "Values", body: "Transparency, simplicity and reliability in every product decision." },
      { icon: Award, title: "Vision", body: "Become the first choice for businesses that want live conversations with their customers." },
    ] satisfies FeatureCopy[],
    team: {
      title: `The ${brand} team`,
      body: `A small team of developers and product designers works every day to make ${brand} faster, more reliable and easier to use.`,
      cta: "Join our team",
    },
  };
}
