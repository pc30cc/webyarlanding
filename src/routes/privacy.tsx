import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/privacy" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/privacy",
      override: loaderData.seoOverride,
      fallbackTitle: "Privacy Policy | Webyar",
      fallbackDescription:
        "How Webyar collects, uses, stores, protects and deletes personal data, and how you can exercise your privacy rights.",
    });
  },
  component: PrivacyPage,
});

const EFFECTIVE_DATE = "September 1, 2026";

function sections(brand: string, email: string, address: string) {
  return [
    {
      title: "1. Introduction",
      body: [
        `This Privacy Policy explains how ${brand} ("we", "us", "our") collects, uses, discloses, stores and protects personal information when you use our website, mobile applications and related services (together, the "Services").`,
        `By using the Services you agree to this Policy. If you do not agree, please stop using the Services.`,
      ],
    },
    {
      title: "2. Information We Collect",
      body: [
        "Account data: name, email address, phone number (if you provide it) and the password hash used to sign you in.",
        "Content data: messages, tickets, files, contacts and other content you or your end users submit to the Services.",
        "Usage data: pages viewed, features used, approximate location derived from IP address, device type, operating system, browser and crash reports.",
        "Transaction data: subscription plan, billing status and invoice records. Full payment card numbers are never stored by us; they are handled by our payment processors.",
      ],
    },
    {
      title: "3. How We Use Information",
      body: [
        "To create and maintain your account and authenticate you.",
        "To provide, operate, support, secure and improve the Services.",
        "To communicate with you about service updates, security notices and support requests.",
        "To detect, prevent and investigate fraud, abuse and violations of our Terms of Use.",
        "To comply with legal obligations.",
      ],
    },
    {
      title: "4. Legal Bases",
      body: [
        "Where required by law, we process personal data on the basis of contract performance (delivering the Services you requested), legitimate interests (security, product improvement), consent (optional communications) and legal obligations.",
      ],
    },
    {
      title: "5. Sharing and Disclosure",
      body: [
        "We do not sell your personal information and we do not share it with third parties for their own advertising.",
        "We share data only with service providers acting on our behalf (hosting, storage, email delivery, analytics, payment processing) under contractual confidentiality obligations, and when required by applicable law or valid legal process.",
      ],
    },
    {
      title: "6. Children's Privacy",
      body: [
        "The Services are not directed to children under 13 years of age, and we do not knowingly collect personal information from them. If you believe a child has provided us personal data, contact us and we will delete it.",
      ],
    },
    {
      title: "7. Data Security",
      body: [
        "We use encryption in transit (TLS), password hashing, access controls, audit logging and regular backups to protect your data. No method of transmission or storage is completely secure, but we work to protect your information and will notify you of a breach where required by law.",
      ],
    },
    {
      title: "8. Data Retention",
      body: [
        "We keep personal data for as long as your account is active and for as long as needed to provide the Services. After account deletion we remove or anonymize personal data within 30 days, except where longer retention is required for legal, accounting or security reasons.",
      ],
    },
    {
      title: "9. Your Rights and Account Deletion",
      body: [
        "You may request access to, correction of, export of, or deletion of your personal data at any time. You may also object to or restrict certain processing and withdraw consent where processing is based on consent.",
        `To delete your account and all associated personal data, email ${email} from the address linked to your account with the subject "Account Deletion Request". We confirm and complete verified requests within 30 days.`,
      ],
    },
    {
      title: "10. Cookies and Similar Technologies",
      body: [
        "We use strictly necessary cookies to keep you signed in and to secure the Services, and optional analytics cookies to understand usage. You can control cookies through your browser settings; disabling necessary cookies may break parts of the Services.",
      ],
    },
    {
      title: "11. International Transfers",
      body: [
        "Your data may be processed on servers located in countries other than your own. Where such transfers occur, we apply appropriate safeguards required by applicable data protection law.",
      ],
    },
    {
      title: "12. Changes to This Policy",
      body: [
        "We may update this Policy from time to time. Material changes will be announced on this page with a new effective date, and where appropriate by email or in-app notice.",
      ],
    },
    {
      title: "13. Contact Us",
      body: [
        `Questions, privacy requests or complaints: ${email}`,
        address ? `Postal address: ${address}` : "",
        "We respond to privacy requests within 30 days.",
      ].filter(Boolean),
    },
  ];
}

function PrivacyPage() {
  const { settings } = Route.useLoaderData();
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const email = settings.brand.email || "support@webyar.app";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      url: base ? `${base}/privacy` : undefined,
      isPartOf: { "@type": "WebSite", name: settings.brand.name, url: base || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "Privacy Policy", path: "/privacy" },
    ]),
  ];
  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div dir="ltr" className="container-page max-w-3xl py-16 text-left sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · {settings.brand.name}
          </p>
        </motion.div>
        <div className="space-y-8">
          {sections(settings.brand.name, email, settings.brand.address || "").map((s, i) => (
            <motion.section
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">{s.title}</h2>
              <div className="space-y-2">
                {s.body.map((p) => (
                  <p key={p} className="text-sm leading-7 text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
