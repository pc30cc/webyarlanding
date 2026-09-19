import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, LifeBuoy, Clock, Trash2 } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/help")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/help" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/help",
      override: loaderData.seoOverride,
      fallbackTitle: "Support & Help Center | Webyar",
      fallbackDescription:
        "Get help with Webyar: contact support by email, report a problem, request account deletion and read answers to common questions.",
    });
  },
  component: HelpPage,
});

const FAQS = [
  {
    q: "How do I create an account?",
    a: "Open the app or the website, choose Sign up, enter your email address and a password, then confirm your email. You can start on the free plan and upgrade later.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: "Use the \"Forgot password\" link on the sign-in screen. A reset link is sent to your registered email address and stays valid for 60 minutes.",
  },
  {
    q: "How do I manage or cancel my subscription?",
    a: "Subscriptions purchased in the app are managed in your Apple App Store or Google Play account settings. Subscriptions purchased on our website can be cancelled from your account billing page. Cancellation takes effect at the end of the current billing period.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Email our support address from the address linked to your account with the subject \"Account Deletion Request\". We verify the request and permanently delete your account and personal data within 30 days.",
  },
  {
    q: "Is my data secure?",
    a: "Data is transmitted over TLS, passwords are stored only as salted hashes, access is restricted by role, and backups are taken regularly. See our Privacy Policy for full details.",
  },
  {
    q: "How do I report a bug or abuse?",
    a: "Email support with the subject \"Bug report\" or \"Abuse report\", including your account email, device and app version, the steps to reproduce, and screenshots if available.",
  },
];

function HelpPage() {
  const { settings } = Route.useLoaderData();
  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const email = settings.brand.email || "support@webyar.app";
  const phone = settings.brand.phone;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: `${settings.brand.name} Support`,
      url: base ? `${base}/help` : undefined,
      mainEntity: {
        "@type": "Organization",
        name: settings.brand.name,
        email,
        ...(phone ? { telephone: phone } : {}),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email,
            availableLanguage: ["en", "fa"],
          },
        ],
      },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "Support", path: "/help" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div dir="ltr" className="container-page max-w-3xl py-16 text-left sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Support &amp; Help Center
          </h1>
          <p className="mb-10 text-sm leading-7 text-muted-foreground">
            Need help with {settings.brand.name}? Our support team answers every message. Use the
            contact details below for technical issues, billing questions, privacy requests or
            account deletion.
          </p>
        </motion.div>

        <section className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Mail className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">Support email</div>
            <a
              href={`mailto:${email}`}
              className="mt-1 block text-sm text-primary underline underline-offset-4"
            >
              {email}
            </a>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Primary support channel for all users, including App Store reviewers.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Clock className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">Response time</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Within 1 business day (Saturday–Thursday).
            </p>
            {phone ? (
              <p className="mt-2 text-xs text-muted-foreground">Phone: {phone}</p>
            ) : null}
            {settings.brand.address ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Address: {settings.brand.address}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <Trash2 className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">Account deletion</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Email{" "}
              <a
                href={`mailto:${email}?subject=Account%20Deletion%20Request`}
                className="text-primary underline underline-offset-4"
              >
                {email}
              </a>{" "}
              with the subject “Account Deletion Request”. Data is erased within 30 days.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <LifeBuoy className="mb-3 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold text-foreground">Policies</div>
            <p className="mt-1 space-x-3 text-sm text-muted-foreground">
              <Link to="/privacy" className="text-primary underline underline-offset-4">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary underline underline-offset-4">
                Terms of Use
              </Link>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-bold text-foreground">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.04 }}
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">{f.q}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-sm leading-7 text-muted-foreground">
          Still stuck? Write to{" "}
          <a href={`mailto:${email}`} className="text-primary underline underline-offset-4">
            {email}
          </a>{" "}
          and include your account email, device model, operating system version and app version so
          we can help faster.
        </p>
      </div>
    </SiteLayout>
  );
}
