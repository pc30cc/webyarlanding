import { Fragment, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { LegalPageData } from "../../types";
import { getPrivacyContent, getTermsContent, type LegalDoc } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { THREAD_COPY } from "../copy";
import { SHAPE, cx } from "../classes";
import { AnswerCard, Container, Eyebrow, PageOpener } from "../ui";

interface Section {
  id: string;
  number: string;
  title: string;
  body: string[];
}

/** "3. How We Use Information" → number "03" + title. */
function toSections(doc: LegalDoc): Section[] {
  return doc.sections.map((section, index) => {
    const match = /^(\d+)\.\s*(.+)$/.exec(section.title);
    const n = match?.[1] ?? String(index + 1);
    return {
      id: `section-${n}`,
      number: n.padStart(2, "0"),
      title: match?.[2] ?? section.title,
      body: section.body,
    };
  });
}

const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

/** Turns e-mail addresses into mailto links and bolds a leading "Label:". */
function RichLine({ text }: { text: string }): ReactNode {
  const label = /^([A-Z][A-Za-z ]{2,28}):\s(.+)$/.exec(text);
  const rest = label?.[2] ?? text;
  const parts = rest.split(EMAIL);
  return (
    <>
      {label && <strong className="font-semibold text-rpk-ink">{label[1]}: </strong>}
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <a
            key={index}
            href={`mailto:${part}`}
            className="rounded-sm font-medium text-rpk-ink underline decoration-rpk-signal decoration-2 underline-offset-4 hover:text-rpk-signal-deep"
          >
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Highlights the section currently being read in the table of contents. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    const list = key.split("|");
    let frame = 0;
    const update = () => {
      frame = 0;
      // The last section whose heading has passed the reading line (below the header).
      let current = list[0] ?? "";
      for (const id of list) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [key]);
  return active;
}

function Toc({ sections, active }: { sections: Section[]; active: string }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((section) => {
        const current = section.id === active;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current ? "location" : undefined}
              className={cx(
                "flex min-h-10 items-start gap-3 px-3 py-2 text-[14px] leading-[1.35] font-semibold transition-colors duration-200",
                current
                  ? cx(SHAPE.question, "bg-rpk-ink text-white")
                  : "rounded-full text-rpk-ink/75 hover:bg-white hover:text-rpk-ink",
              )}
            >
              <span
                className={cx(
                  "pt-px font-rpk-mono text-[12px] font-normal tabular-nums",
                  current ? "text-white/70" : "text-rpk-slate",
                )}
              >
                {section.number}
              </span>
              <span>{section.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

const BODY_TEXT = "text-[16px] leading-[1.7] text-rpk-slate sm:text-[17px]";

/** Paragraphs; a run of "To …" purposes reads better as a list with answer-pill bullets. */
function SectionBody({ lines }: { lines: string[] }) {
  const isList = lines.length > 2 && lines.every((line) => /^To\s/.test(line));
  if (isList)
    return (
      <ul className="mt-5 space-y-3 sm:pl-[60px]">
        {lines.map((line, index) => (
          <li key={index} className={cx(BODY_TEXT, "relative pl-7")}>
            <span
              aria-hidden="true"
              className="absolute top-[0.62em] left-0 h-2.5 w-4 rounded-full rounded-br-[2px] bg-rpk-signal"
            />
            <RichLine text={line} />
          </li>
        ))}
      </ul>
    );
  return (
    <div className="mt-5 space-y-4 sm:pl-[60px]">
      {lines.map((line, index) => (
        <p key={index} className={BODY_TEXT}>
          <RichLine text={line} />
        </p>
      ))}
    </div>
  );
}

function LegalDocument({ doc, path, pageName }: { doc: LegalDoc; path: string; pageName: string }) {
  const { settings, brand, siteUrl } = useRespok();
  const sections = toSections(doc);
  const active = useActiveSection(sections.map((s) => s.id));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: doc.title,
      url: siteUrl ? `${siteUrl}${path}` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: siteUrl || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: pageName, path },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener
        question={doc.question}
        title={doc.title}
        meta={
          <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 font-rpk-mono text-[13px] tracking-[0.04em] text-rpk-slate">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-4 rounded-full rounded-br-[2px] bg-rpk-signal"
            />
            {doc.meta}
          </p>
        }
      />

      <section className="bg-rpk-paper py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <aside className="mb-8 lg:mb-0">
              <details className={cx("group bg-white shadow-rpk-card lg:hidden", SHAPE.answerSoft)}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-[15px] font-semibold text-rpk-ink [&::-webkit-details-marker]:hidden">
                  {THREAD_COPY.legal.toc}
                  <ChevronDown
                    aria-hidden="true"
                    strokeWidth={2.4}
                    className="size-4 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <nav aria-label={THREAD_COPY.legal.toc} className="px-2 pb-3">
                  <Toc sections={sections} active={active} />
                </nav>
              </details>
              <nav
                aria-label={THREAD_COPY.legal.toc}
                className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto pb-4 lg:block"
              >
                <Eyebrow className="mb-4 px-3">{THREAD_COPY.legal.toc}</Eyebrow>
                <Toc sections={sections} active={active} />
              </nav>
            </aside>

            <div className="min-w-0 space-y-4 sm:space-y-5">
              {sections.map((section) => (
                <AnswerCard
                  key={section.id}
                  as="section"
                  id={section.id}
                  className="scroll-mt-28 p-6 sm:p-10"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "mt-0.5 inline-flex h-8 w-11 shrink-0 items-center justify-center bg-rpk-ink font-rpk-mono text-[13px] text-white tabular-nums",
                        SHAPE.question,
                      )}
                    >
                      {section.number}
                    </span>
                    <h2 className="pt-px text-[22px] leading-[1.25] font-bold tracking-[-0.015em] text-balance text-rpk-ink sm:text-[26px]">
                      <span className="sr-only">{Number(section.number)}. </span>
                      {section.title}
                    </h2>
                  </div>
                  <SectionBody lines={section.body} />
                </AnswerCard>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Reads naturally in the legal sentences when no support address is configured. */
const NO_EMAIL = "our support team";

export function PrivacyPage({ settings }: LegalPageData) {
  const { brand } = useRespok();
  const doc = getPrivacyContent(
    brand,
    settings.brand.email?.trim() || NO_EMAIL,
    settings.brand.address?.trim() || "",
  );
  return <LegalDocument doc={doc} path="/privacy" pageName="Privacy Policy" />;
}

export function TermsPage({ settings }: LegalPageData) {
  const { brand } = useRespok();
  const doc = getTermsContent(brand, settings.brand.email?.trim() || NO_EMAIL);
  return <LegalDocument doc={doc} path="/terms" pageName="Terms of Use" />;
}
