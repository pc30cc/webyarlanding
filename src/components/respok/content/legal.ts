import { CheckCircle2, Clock, Shield, Zap } from "lucide-react";
import {
  HELP_FAQS_EN,
  LEGAL_EFFECTIVE_DATE_EN,
  privacySectionsEn,
  termsSectionsEn,
  type LegalSection,
} from "@/lib/legal-en";
import type { ContentFlags, FeatureCopy } from ".";

export interface LegalDoc {
  title: string;
  question: string;
  meta: string;
  sections: LegalSection[];
}

export function getPrivacyContent(brand: string, email: string, address: string): LegalDoc {
  return {
    title: "Privacy Policy",
    question: "What happens to my data?",
    meta: `Effective date: ${LEGAL_EFFECTIVE_DATE_EN} · ${brand}`,
    sections: privacySectionsEn(brand, email, address),
  };
}

export function getTermsContent(brand: string, email: string): LegalDoc {
  return {
    title: "Terms of Use",
    question: "What are the rules?",
    meta: `Effective date: ${LEGAL_EFFECTIVE_DATE_EN} · ${brand}`,
    sections: termsSectionsEn(brand, email),
  };
}

export function getHelpContent({ brand }: ContentFlags) {
  return {
    question: "I need help with my account.",
    eyebrow: "Support",
    title: "Support & Help Center",
    lede: `Need help with ${brand}? Our support team answers every message. Use the contact details below for technical issues, billing questions, privacy requests or account deletion.`,
    cards: {
      email: { title: "Support email", body: "The main support channel for all users, including App Store reviewers." },
      response: { title: "Response time", body: "Within 1 business day (Saturday to Thursday).", phone: "Phone", address: "Address" },
      deletion: {
        title: "Account deletion",
        before: "Email",
        after: "with the subject “Account Deletion Request”. Your data is erased within 30 days.",
        subject: "Account Deletion Request",
      },
      policies: { title: "Policies", privacy: "Privacy Policy", terms: "Terms of Use" },
    },
    faqTitle: "Frequently asked questions",
    faqs: HELP_FAQS_EN,
    closing: (email: string) =>
      `Still stuck? Write to ${email} and include your account email, device model, operating system version and app version so we can help faster.`,
  };
}

export function getSlaContent({ brand }: ContentFlags) {
  return {
    question: "Can I rely on it?",
    eyebrow: "Service level",
    title: "Service Level Agreement (SLA)",
    lede: `${brand}'s commitments to a high-quality, reliable service.`,
    stats: [
      { icon: Zap, value: "99.9%", title: "Guaranteed uptime", body: "The platform is available 99.9% of the time." },
      { icon: Clock, value: "< 2 hours", title: "Support response", body: "Maximum response time on the Professional plan." },
      { icon: Shield, value: "< 4 hours", title: "Data recovery", body: "Restore from the most recent backup." },
      { icon: CheckCircle2, value: "Zero downtime", title: "Updates", body: "Updates ship without taking the service down." },
    ] satisfies (FeatureCopy & { value: string })[],
    credits: {
      title: "Service credits",
      lede: "If monthly uptime falls below our commitment, you receive a credit on your next invoice.",
      columns: ["Monthly uptime", "Service credit"],
      rows: [
        ["99.9% – 99.5%", "10% of the monthly fee"],
        ["99.5% – 99.0%", "25% of the monthly fee"],
        ["Below 99.0%", "50% of the monthly fee"],
      ] as [string, string][],
    },
  };
}
