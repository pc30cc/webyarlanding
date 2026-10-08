import { useCallback, useId } from "react";
import type { CatalogIndexPageData } from "../../types";
import { useContent, type ContentFlags } from "../../content";
import { getCatalogContent } from "../../content/catalog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { useGatedCatalog } from "../../shared/nav";
import { Reveal } from "../../shared/Reveal";
import { catalogIndexJsonLd, withOverride } from "../../shared/structured";
import { CatalogCard } from "../catalog";
import { THREAD_COPY } from "../copy";
import { chipClass } from "../classes";
import { useGatedList } from "../labels";
import {
  ActionLink,
  AnswerPill,
  Badge,
  Container,
  Exchange,
  PageOpener,
  QuestionPill,
} from "../ui";

export function CatalogIndexPage({
  settings,
  seoOverride,
  kind,
  categories,
}: CatalogIndexPageData) {
  const { brand } = useRespok();
  const build = useCallback((flags: ContentFlags) => getCatalogContent(kind, flags), [kind]);
  const c = useContent(build);
  const gated = useGatedCatalog(categories);
  const gatedList = useGatedList();
  const bullets = new Map(
    categories.flatMap((category) => category.items).map((item) => [item.id, item.bullets]),
  );
  const total = gated.reduce((sum, category) => sum + category.items.length, 0);
  const bandId = useId();

  return (
    <>
      <JsonLd data={withOverride(seoOverride, catalogIndexJsonLd(settings, brand, kind, gated))} />
      <PageOpener
        question={c.question}
        eyebrow={c.eyebrow}
        title={c.title.map((line) => (
          <span key={line} className="sm:block">
            {line}{" "}
          </span>
        ))}
        lede={c.lede}
        titleSize={c.title.join(" ").length > 32 ? "md" : "lg"}
      >
        {gated.length > 1 && (
          <nav aria-label={THREAD_COPY.catalog.jump} className="mt-10 sm:mt-12">
            <ul className="flex flex-wrap gap-2">
              {gated.map((category, index) => (
                <li key={category.id}>
                  <a href={`#cat-${category.id}`} className={chipClass(false)}>
                    <span
                      aria-hidden="true"
                      className="font-rpk-mono text-[12px] tracking-[0.04em] text-rpk-slate"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {category.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageOpener>

      <div className="bg-rpk-paper py-14 sm:py-16 lg:py-20">
        <Container>
          {total === 0 ? (
            <div className="py-6 sm:py-10">
              <Exchange
                question={<QuestionPill size="lg">{c.question}</QuestionPill>}
                answer={
                  <AnswerPill size="lg" away>
                    {c.empty}
                  </AnswerPill>
                }
              />
            </div>
          ) : (
            <div className="space-y-16 sm:space-y-20">
              {gated.map((category, index) => {
                const headingId = `cat-${category.id}-title`;
                return (
                  <section
                    key={category.id}
                    id={`cat-${category.id}`}
                    aria-labelledby={headingId}
                    className="scroll-mt-28"
                  >
                    <div className="flex items-end justify-between gap-4 border-b border-rpk-mist pb-5 sm:gap-6">
                      <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
                        <span
                          aria-hidden="true"
                          className="font-rpk-mono text-[13px] tracking-[0.08em] text-rpk-slate"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2
                          id={headingId}
                          className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance text-rpk-ink sm:text-[30px]"
                        >
                          {category.title}
                        </h2>
                      </div>
                      <Badge className="mb-1 shrink-0">
                        {THREAD_COPY.catalog.count(category.items.length, kind)}
                      </Badge>
                    </div>
                    <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      {category.items.map((item, itemIndex) => (
                        <Reveal as="li" key={item.id} delay={(itemIndex % 3) * 90}>
                          <CatalogCard
                            kind={kind}
                            item={item}
                            bullets={gatedList(bullets.get(item.id) ?? [], 3)}
                            learnMore={c.learnMore}
                          />
                        </Reveal>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      <section aria-labelledby={bandId} className="bg-white py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[36px] rounded-ee-[10px] bg-rpk-ink px-6 py-12 text-white sm:rounded-[44px] sm:rounded-ee-[12px] sm:px-12 sm:py-16 lg:px-16">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[36rem]">
                <h2
                  id={bandId}
                  className="text-[30px] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[40px]"
                >
                  {c.band.title}
                </h2>
                <p className="mt-4 text-[17px] leading-[1.6] text-pretty text-white/70 sm:text-[18px]">
                  {c.band.body}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:shrink-0 lg:flex-nowrap">
                <ActionLink href={c.band.primary.to} size="lg" arrow>
                  {c.band.primary.label}
                </ActionLink>
                <ActionLink
                  href={c.band.secondary.to}
                  variant="outline"
                  size="lg"
                  className="!bg-transparent !text-white !ring-white/30 hover:!bg-rpk-ink-raised"
                >
                  {c.band.secondary.label}
                </ActionLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
