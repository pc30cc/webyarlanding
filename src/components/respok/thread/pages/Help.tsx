import { Link } from "@tanstack/react-router";
import { Clock, FileText, Mail, Trash2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { LegalPageData } from "../../types";
import { useContent } from "../../content";
import { getHelpContent } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { THREAD_COPY } from "../copy";
import {
  AnswerCard,
  Container,
  IconBadge,
  PageOpener,
  ReadTicks,
  SHAPE,
  SectionHeader,
  Timestamp,
  cx,
} from "../ui";

const LINK =
  "rounded-sm font-semibold text-rpk-ink underline decoration-rpk-signal decoration-2 underline-offset-4 transition-colors hover:text-rpk-signal-deep";

function HelpCard({
  icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnswerCard as="li" className="flex flex-col p-6 sm:p-8">
      <IconBadge icon={icon} tone="soft" />
      <h2 className="mt-6 text-[20px] leading-[1.25] font-bold tracking-[-0.01em] text-rpk-ink">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[16px] leading-[1.6] text-rpk-slate">{children}</div>
    </AnswerCard>
  );
}

/** Transcript timestamps: 09:41, 09:42, … */
function clock(step: number): string {
  const minutes = 9 * 60 + 41 + step;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function HelpPage({ settings }: LegalPageData) {
  const { brand, siteUrl } = useRespok();
  const copy = useContent(getHelpContent);
  const email = settings.brand.email?.trim() || "";
  const phone = settings.brand.phone?.trim() || "";
  const address = settings.brand.address?.trim() || "";
  const cards = copy.cards;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: `${brand} Support`,
      url: siteUrl ? `${siteUrl}/help` : undefined,
      mainEntity: {
        "@type": "Organization",
        name: brand,
        ...(email ? { email } : {}),
        ...(phone ? { telephone: phone } : {}),
        ...(email
          ? {
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email,
                  availableLanguage: ["en"],
                },
              ],
            }
          : {}),
      },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: "Support", path: "/help" },
    ]),
  ];

  const emailLink = email ? (
    <a href={`mailto:${email}`} className={LINK}>
      {email}
    </a>
  ) : (
    <Link to="/contact" className={LINK}>
      contact form
    </Link>
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener question={copy.question} title={copy.title} lede={copy.lede} />

      <section aria-label={copy.eyebrow} className="bg-rpk-paper py-14 sm:py-20">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <HelpCard icon={Mail} title={cards.email.title}>
              <p className="text-[18px]">{emailLink}</p>
              <p>{cards.email.body}</p>
            </HelpCard>
            <HelpCard icon={Clock} title={cards.response.title}>
              <p>{cards.response.body}</p>
              {(phone || address) && (
                <dl className="space-y-2 border-t border-rpk-mist pt-3">
                  {phone && (
                    <div className="flex flex-wrap gap-x-3">
                      <dt className="font-rpk-mono text-[13px] tracking-[0.06em] uppercase">
                        {cards.response.phone}
                      </dt>
                      <dd>
                        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={LINK}>
                          {phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {address && (
                    <div className="flex flex-wrap gap-x-3">
                      <dt className="font-rpk-mono text-[13px] tracking-[0.06em] uppercase">
                        {cards.response.address}
                      </dt>
                      <dd className="text-rpk-ink">{address}</dd>
                    </div>
                  )}
                </dl>
              )}
            </HelpCard>
            <HelpCard icon={Trash2} title={cards.deletion.title}>
              <p>
                {email ? (
                  <>
                    {cards.deletion.before}{" "}
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(cards.deletion.subject)}`}
                      className={LINK}
                    >
                      {email}
                    </a>{" "}
                    {cards.deletion.after}
                  </>
                ) : (
                  <>
                    {cards.deletion.before} us through the {emailLink} {cards.deletion.after}
                  </>
                )}
              </p>
            </HelpCard>
            <HelpCard icon={FileText} title={cards.policies.title}>
              <ul className="flex flex-wrap gap-2 pt-1">
                {[
                  { to: "/privacy", label: cards.policies.privacy },
                  { to: "/terms", label: cards.policies.terms },
                ].map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cx(
                        "inline-flex min-h-11 items-center px-5 text-[15px] font-semibold text-rpk-ink ring-1 ring-rpk-mist ring-inset transition-colors hover:bg-rpk-ink hover:text-white hover:ring-rpk-ink",
                        SHAPE.answer,
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </HelpCard>
          </ul>
        </Container>
      </section>

      <section aria-labelledby="help-faq" className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeader
            id="help-faq"
            question={THREAD_COPY.help.faqQuestion}
            title={copy.faqTitle}
          />
          <ol className="relative mt-12 space-y-10 sm:mt-16">
            {copy.faqs.map((faq, index) => (
              <li key={faq.q} className="flex flex-col gap-3">
                <div className="flex max-w-[92%] items-end gap-3 sm:max-w-[72%]">
                  <h3
                    className={cx(
                      "bg-rpk-ink px-5 py-3.5 text-[16px] leading-[1.4] font-semibold text-white sm:px-6 sm:text-[17px]",
                      SHAPE.questionSoft,
                    )}
                  >
                    {faq.q}
                  </h3>
                  <Timestamp className="mb-2 hidden sm:inline">{clock(index * 3)}</Timestamp>
                </div>
                <div className="flex flex-col items-end">
                  <AnswerCard className="max-w-[92%] px-5 py-4 sm:max-w-[72%] sm:px-7 sm:py-5">
                    <p className="text-[16px] leading-[1.65] text-rpk-ink/85">{faq.a}</p>
                  </AnswerCard>
                  <span className="mt-2 mr-2 flex items-center gap-1.5 text-rpk-slate">
                    <Timestamp>{clock(index * 3 + 1)}</Timestamp>
                    <ReadTicks className="size-3.5 text-rpk-signal-deep" />
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col items-end sm:mt-20">
            <AnswerCard
              tone="soft"
              className="max-w-[92%] px-6 py-5 sm:max-w-[72%] sm:px-8 sm:py-7"
            >
              <p className="text-[17px] leading-[1.6] text-rpk-ink sm:text-[19px]">
                {email
                  ? (() => {
                      const [before, after] = copy.closing(email).split(email);
                      return (
                        <>
                          {before}
                          {emailLink}
                          {after}
                        </>
                      );
                    })()
                  : copy.closing("us")}
              </p>
            </AnswerCard>
          </div>
        </Container>
      </section>
    </>
  );
}
