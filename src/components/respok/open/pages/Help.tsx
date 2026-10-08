import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, FileText, Mail, Trash2 } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { useContent } from "../../content";
import { getHelpContent } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import type { LegalPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { Linkified } from "../legal";
import {
  ActionLink,
  BubbleGlyph,
  Card,
  ChapterHero,
  Container,
  CornerDot,
  Eyebrow,
  IconTile,
  SectionHeader,
} from "../ui";
import { pad, textLinkClass } from "../tokens";

export function HelpPage(_: LegalPageData) {
  const { settings, brand, siteUrl } = useRespok();
  const copy = useContent(getHelpContent);
  const email = settings.brand.email?.trim() || "";
  const phone = settings.brand.phone?.trim() || "";
  const address = settings.brand.address?.trim() || "";

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

  const cardBody = "mt-3 text-[16px] leading-[1.6] text-rpk-slate";
  const cardTitle = "mt-8 text-[22px] leading-[1.2] font-bold tracking-[-0.01em] wrap-anywhere";

  return (
    <>
      <JsonLd data={jsonLd} />
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path="/help"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
      >
        {email ? (
          <div className="mt-10 flex flex-wrap gap-3">
            <ActionLink to={`mailto:${email}`} variant="primary" size="lg">
              {email}
            </ActionLink>
            <ActionLink to="/contact" variant="secondary" surface="ink" size="lg">
              {OPEN_COPY.help.contact}
            </ActionLink>
          </div>
        ) : null}
      </ChapterHero>

      {/* 01 · Contact */}
      <Container className="py-16 sm:py-24">
        <SectionHeader index="01" eyebrow={OPEN_COPY.help.contact} />
        <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6 [&>*]:min-w-0">
          {email ? (
            <Reveal effect="corner">
              <Card tone="ink" className="relative flex h-full flex-col p-7 sm:p-9">
                <IconTile icon={Mail} tone="signal" />
                <h2 className={cardTitle}>{copy.cards.email.title}</h2>
                <a
                  href={`mailto:${email}`}
                  className="mt-3 self-start rounded-[4px] text-[22px] font-bold break-all text-white underline decoration-rpk-signal decoration-2 underline-offset-[6px] sm:text-[26px]"
                >
                  {email}
                </a>
                <p className="mt-4 text-[16px] leading-[1.6] text-white/72">
                  {copy.cards.email.body}
                </p>
              </Card>
            </Reveal>
          ) : null}

          <Reveal effect="corner" delay={80}>
            <Card className="flex h-full flex-col p-7 sm:p-9">
              <IconTile icon={Clock} />
              <h2 className={cardTitle}>{copy.cards.response.title}</h2>
              <p className={cardBody}>{copy.cards.response.body}</p>
              {phone || address ? (
                <dl className="mt-6 grid gap-3 border-t border-rpk-mist pt-5 wrap-anywhere">
                  {phone ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                        {copy.cards.response.phone}
                      </dt>
                      <dd>
                        <a
                          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                          dir="ltr"
                          className={textLinkClass()}
                        >
                          {phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {address ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                        {copy.cards.response.address}
                      </dt>
                      <dd className="text-[15px] text-rpk-ink">{address}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </Card>
          </Reveal>

          {email ? (
            <Reveal effect="corner" delay={120}>
              <Card className="flex h-full flex-col p-7 sm:p-9">
                <IconTile icon={Trash2} />
                <h2 className={cardTitle}>{copy.cards.deletion.title}</h2>
                <p className={cardBody}>
                  {copy.cards.deletion.before}{" "}
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(copy.cards.deletion.subject)}`}
                    className={textLinkClass()}
                  >
                    {email}
                  </a>{" "}
                  {copy.cards.deletion.after}
                </p>
              </Card>
            </Reveal>
          ) : null}

          <Reveal effect="corner" delay={160}>
            <Card className="flex h-full flex-col p-7 sm:p-9">
              <IconTile icon={FileText} />
              <h2 className={cardTitle}>{copy.cards.policies.title}</h2>
              <ul className="mt-4 border-t border-rpk-mist">
                {(
                  [
                    ["/privacy", copy.cards.policies.privacy],
                    ["/terms", copy.cards.policies.terms],
                  ] as const
                ).map(([to, label]) => (
                  <li key={to} className="border-b border-rpk-mist">
                    <Link
                      to={to}
                      className="group/p flex min-h-12 items-center justify-between gap-4 rounded-[4px] py-2 text-[17px] font-semibold text-rpk-ink"
                    >
                      {label}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-[18px] text-rpk-slate transition-[transform,color] group-hover/p:translate-x-1 group-hover/p:text-rpk-ink"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </Container>

      {/* 02 · FAQ */}
      <Container className="pb-16 sm:pb-24">
        <SectionHeader index="02" eyebrow={OPEN_COPY.help.faq} title={copy.faqTitle} />
        <ol className="mt-10">
          {copy.faqs.map((faq, index) => (
            <li
              key={faq.q}
              className="grid gap-x-10 gap-y-3 border-b border-rpk-mist py-7 md:grid-cols-12 md:py-9 [&>*]:min-w-0 [&>*]:wrap-anywhere"
            >
              <span
                aria-hidden="true"
                className="font-rpk-mono text-[13px] tracking-[0.06em] text-rpk-slate md:col-span-4 md:pt-1.5 lg:col-span-3"
              >
                {pad(index + 1)}
              </span>
              <h3 className="text-[20px] leading-[1.3] font-bold tracking-[-0.01em] text-rpk-ink md:col-span-8 lg:col-span-3">
                {faq.q}
              </h3>
              <p className="text-[17px] leading-[1.65] text-rpk-slate md:col-span-8 md:col-start-5 lg:col-span-6 lg:col-start-auto">
                {faq.a}
              </p>
            </li>
          ))}
        </ol>
      </Container>

      {/* 03 · Closing: a big bubble with the dot outside its corner. */}
      {email ? (
        <Container className="pb-24 sm:pb-32">
          <Reveal effect="corner">
            <div className="relative mr-6 sm:mr-8">
              <Card
                tone="ink"
                size="xl"
                className="relative isolate overflow-hidden p-8 sm:p-12 lg:grid lg:grid-cols-12 lg:items-end lg:gap-10 lg:p-16"
              >
                <BubbleGlyph className="absolute -top-[40%] right-[6%] -z-10 hidden w-[300px] text-rpk-ink-soft lg:block" />
                <div className="lg:col-span-8">
                  <Eyebrow index="03" surface="ink">
                    {OPEN_COPY.help.write}
                  </Eyebrow>
                  <p className="mt-6 max-w-[40ch] text-[22px] leading-[1.4] font-semibold tracking-[-0.01em] text-white sm:text-[28px]">
                    <Linkified text={copy.closing(email)} surface="ink" />
                  </p>
                </div>
                <div className="mt-8 lg:col-span-4 lg:mt-0 lg:justify-self-end">
                  <ActionLink to={`mailto:${email}`} variant="primary" size="lg">
                    {email}
                  </ActionLink>
                </div>
              </Card>
              <CornerDot size={22} />
            </div>
          </Reveal>
        </Container>
      ) : null}
    </>
  );
}
