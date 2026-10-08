/**
 * Long-form reading layout shared by Privacy and Terms: sticky contents on desktop
 * (brand-book "contents" rows with a live dot on the section you're reading), numbered
 * sections, emails turned into mailto links.
 */
import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { LegalSection } from "@/lib/legal-en";
import { OPEN_COPY } from "./copy";
import { Container, Dot, type Surface } from "./ui";
import { anchorId, cx, splitNumbered, textLinkClass } from "./tokens";

const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

/** Plain text with any e-mail address rendered as a mailto link. */
export function Linkified({ text, surface = "paper" }: { text: string; surface?: Surface }) {
  const parts = text.split(EMAIL);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <a key={index} href={`mailto:${part}`} className={textLinkClass(surface)}>
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** "Account data: name, email…" → bold label + text. */
function LabelledItem({ text }: { text: string }) {
  const match = /^([A-Z][A-Za-z ]{2,28}):\s(.+)$/.exec(text);
  if (!match) return <Linkified text={text} />;
  return (
    <>
      <strong className="font-semibold text-rpk-ink">{match[1]}:</strong>{" "}
      <Linkified text={match[2] ?? ""} />
    </>
  );
}

export interface TocEntry {
  id: string;
  n: string;
  title: string;
}

/** Highlights the section currently being read. */
function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const nodes = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => !!node);
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (first) setActive(first[0]);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);
  return active;
}

export function TableOfContents({
  entries,
  active,
  label = OPEN_COPY.legal.contents,
}: {
  entries: TocEntry[];
  active: string | null;
  label?: string;
}) {
  return (
    <nav aria-label={label}>
      <p className="flex items-center justify-between border-b-2 border-rpk-ink pb-2 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
        <span>{label}</span>
        <span>{OPEN_COPY.legal.sections(entries.length)}</span>
      </p>
      <ol>
        {entries.map((entry) => {
          const current = entry.id === active;
          return (
            <li key={entry.id} className="border-b border-rpk-mist">
              <a
                href={`#${entry.id}`}
                aria-current={current ? "location" : undefined}
                className={cx(
                  "group/toc flex min-h-11 items-center gap-3 rounded-[4px] py-2 text-[15px] leading-[1.35] transition-colors",
                  current ? "font-semibold text-rpk-ink" : "text-rpk-slate hover:text-rpk-ink",
                )}
              >
                <span className="w-6 shrink-0 font-rpk-mono text-[12px] font-normal text-rpk-slate">
                  {entry.n}
                </span>
                <span className="flex-1">{entry.title}</span>
                <Dot
                  size={8}
                  tone={current ? "signal" : "away-ink"}
                  className={cx(
                    "transition-[transform,opacity] duration-300 ease-rpk-pop",
                    current
                      ? "scale-100 opacity-100"
                      : "scale-75 opacity-0 group-hover/toc:opacity-100",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Mobile contents: a collapsible block before the text. */
export function CollapsibleContents({ entries }: { entries: TocEntry[] }) {
  return (
    <details className="group/details rounded-[24px] rounded-br-[6px] bg-white lg:hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[24px] rounded-br-[6px] px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
          {OPEN_COPY.legal.contents} · {OPEN_COPY.legal.sections(entries.length)}
        </span>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-rpk-paper text-[18px] leading-none font-semibold transition-transform group-open/details:rotate-45"
        >
          +
        </span>
      </summary>
      <ol className="px-5 pb-4">
        {entries.map((entry) => (
          <li key={entry.id} className="border-t border-rpk-mist">
            <a
              href={`#${entry.id}`}
              className="flex min-h-11 items-center gap-3 rounded-[4px] py-2 text-[15px] text-rpk-ink"
            >
              <span className="w-6 font-rpk-mono text-[12px] text-rpk-slate">{entry.n}</span>
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

function tocFromSections(sections: LegalSection[]): TocEntry[] {
  return sections.map((section, index) => {
    const { n, text } = splitNumbered(section.title, index + 1);
    return { id: `s-${anchorId(text)}`, n, title: text };
  });
}

/** Paper chapter with sticky contents (desktop) and numbered sections. */
export function LegalBody({ sections, aside }: { sections: LegalSection[]; aside?: ReactNode }) {
  const entries = tocFromSections(sections);
  const active = useScrollSpy(entries.map((entry) => entry.id));

  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
          <div className="sticky top-[104px] max-h-[calc(100dvh-128px)] overflow-y-auto pr-2 pb-4">
            <TableOfContents entries={entries} active={active} />
            {aside}
          </div>
        </aside>
        <div className="min-w-0 lg:col-span-8 xl:col-span-8 xl:col-start-5">
          <CollapsibleContents entries={entries} />
          <div className="mt-8 lg:mt-0">
            {sections.map((section, index) => {
              const entry = entries[index];
              if (!entry) return null;
              const asList = section.body.length >= 3;
              return (
                <section
                  key={entry.id}
                  id={entry.id}
                  aria-labelledby={`${entry.id}-h`}
                  className="scroll-mt-28 border-t border-rpk-mist py-10 first:border-t-0 first:pt-0 sm:py-12"
                >
                  <div className="grid gap-x-8 gap-y-3 sm:grid-cols-[56px_1fr]">
                    <span
                      aria-hidden="true"
                      className="pt-2 font-rpk-mono text-[13px] tracking-[0.06em] text-rpk-slate"
                    >
                      {entry.n}
                    </span>
                    <div className="min-w-0">
                      <h2
                        id={`${entry.id}-h`}
                        className="text-[24px] leading-[1.2] font-bold tracking-[-0.015em] text-rpk-ink sm:text-[28px]"
                      >
                        {entry.title}
                      </h2>
                      {asList ? (
                        <ul className="mt-5 space-y-3">
                          {section.body.map((text, i) => (
                            <li
                              key={i}
                              className="relative pl-6 text-[17px] leading-[1.65] text-rpk-ink/85"
                            >
                              <span
                                aria-hidden="true"
                                className="absolute top-[0.66em] left-1 size-[7px] rounded-full bg-rpk-signal"
                              />
                              <LabelledItem text={text} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {section.body.map((text, i) => (
                            <p key={i} className="text-[17px] leading-[1.7] text-rpk-ink/85">
                              <LabelledItem text={text} />
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
