import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getIcon } from "@/lib/icon-registry";
import { useContent, type ContentFlags } from "../../content";
import { getCatalogContent } from "../../content/catalog";
import { useRespok } from "../../shared/context";
import { isAllowedText } from "../../shared/gating";
import { JsonLd } from "../../shared/JsonLd";
import { useGatedCatalog, type NavItem } from "../../shared/nav";
import { Reveal } from "../../shared/Reveal";
import { catalogIndexJsonLd, withOverride } from "../../shared/structured";
import type { CatalogIndexPageData } from "../../types";
import { CtaBubble, EmptyState } from "../blocks";
import { OPEN_COPY } from "../copy";
import { ActionLink, Card, ChapterHero, Container, Dot, IconTile, SectionHeader } from "../ui";
import { BALANCED_GRID, balancedSpans, cx, pad } from "../tokens";

export function CatalogIndexPage({
  kind,
  categories,
  settings,
  seoOverride,
}: CatalogIndexPageData) {
  const { brand, t, callEnabled, aiEnabled } = useRespok();
  const build = useCallback((flags: ContentFlags) => getCatalogContent(kind, flags), [kind]);
  const c = useContent(build);
  const gated = useGatedCatalog(categories);
  const path = kind === "product" ? "/products" : "/solutions";

  // Card bullets: the first three that the call/AI switches allow, translated.
  const source = new Map(categories.flatMap((category) => category.items).map((i) => [i.id, i]));
  const bulletsOf = (id: string) =>
    (source.get(id)?.bullets ?? [])
      .filter((bullet) => isAllowedText({ callEnabled, aiEnabled }, bullet, t(bullet)))
      .slice(0, 3)
      .map((bullet) => t(bullet));

  return (
    <>
      <JsonLd data={withOverride(seoOverride, catalogIndexJsonLd(settings, brand, kind, gated))} />
      <ChapterHero
        running={`${brand} · ${c.eyebrow}`}
        path={path}
        question={c.question}
        eyebrow={c.eyebrow}
        title={c.title.join(" ")}
        lede={c.lede}
      >
        {gated.length > 1 ? (
          <nav aria-label={c.eyebrow} className="mt-12">
            <ul className="flex flex-wrap gap-2">
              {gated.map((category, i) => (
                <li key={category.id}>
                  <a
                    href={`#c-${category.id}`}
                    className="group/jump inline-flex h-11 items-center gap-2.5 rounded-[14px] rounded-br-[4px] border border-white/15 px-4 text-[14px] font-semibold text-white/85 transition-colors hover:border-white/50 hover:text-white"
                  >
                    <span className="font-rpk-mono text-[12px] font-normal text-rpk-signal">
                      {pad(i + 2)}
                    </span>
                    {category.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </ChapterHero>

      <Container className="py-20 sm:py-28">
        {gated.length === 0 ? (
          <EmptyState title={c.empty}>
            <ActionLink to="/" variant="ink" size="sm" className="mt-5">
              {OPEN_COPY.catalog.home}
            </ActionLink>
          </EmptyState>
        ) : (
          gated.map((category, ci) => {
            const spans = balancedSpans(category.items.length, 3);
            return (
              <section
                key={category.id}
                id={`c-${category.id}`}
                aria-labelledby={`c-${category.id}-title`}
                className={cx("scroll-mt-24", ci > 0 && "mt-20 sm:mt-28")}
              >
                <SectionHeader
                  index={pad(ci + 2)}
                  eyebrow={OPEN_COPY.catalog.items(category.items.length, kind)}
                  title={category.title}
                  id={`c-${category.id}-title`}
                />
                <ul className={cx(BALANCED_GRID, "mt-10 sm:mt-12")}>
                  {category.items.map((item, i) => (
                    <li key={item.id} className={cx("min-w-0", spans[i])}>
                      <Reveal delay={(i % 3) * 70} className="h-full">
                        <ItemCard
                          item={item}
                          index={i}
                          bullets={bulletsOf(item.id)}
                          path={path}
                          learnMore={c.learnMore}
                        />
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </Container>

      <section aria-labelledby="catalog-band" className="bg-rpk-paper">
        <Container className="pb-24 sm:pb-32">
          <CtaBubble
            size="md"
            eyebrow={OPEN_COPY.catalog.next}
            title={c.band.title}
            titleId="catalog-band"
            body={c.band.body}
            actions={
              <>
                <ActionLink to={c.band.primary.to} variant="primary" size="lg">
                  {c.band.primary.label}
                </ActionLink>
                <ActionLink to={c.band.secondary.to} variant="secondary" surface="ink" size="lg">
                  {c.band.secondary.label}
                </ActionLink>
              </>
            }
          />
        </Container>
      </section>
    </>
  );
}

function ItemCard({
  item,
  index,
  bullets,
  path,
  learnMore,
}: {
  item: NavItem;
  index: number;
  bullets: string[];
  path: "/products" | "/solutions";
  learnMore: string;
}) {
  const Icon = getIcon(item.icon);
  return (
    <Card className="group/card relative flex h-full flex-col p-6 transition-shadow duration-300 hover:shadow-rpk-card sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <IconTile
          icon={Icon}
          size={52}
          className="transition-colors duration-300 group-hover/card:bg-rpk-signal group-hover/card:text-rpk-ink"
        />
        <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate">
          {pad(index + 1)}
        </span>
      </div>
      <h3 className="mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.015em] text-rpk-ink">
        {item.title}
      </h3>
      {item.shortDesc ? (
        <p className="mt-2.5 text-[16px] leading-[1.6] text-rpk-slate">{item.shortDesc}</p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-6 border-t border-rpk-mist">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-3 border-b border-rpk-mist py-2.5 text-[15px] leading-[1.45] text-rpk-ink"
            >
              <Dot size={6} tone="ink" className="mt-[7px]" />
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        to={`${path}/$slug`}
        params={{ slug: item.slug }}
        aria-label={`${learnMore}: ${item.title}`}
        className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-[6px] pt-6 text-[15px] font-semibold text-rpk-ink after:absolute after:inset-0 after:rounded-[inherit] after:content-['']"
      >
        <Dot
          size={7}
          className="transition-transform duration-300 ease-rpk-pop group-hover/card:scale-[1.35]"
        />
        {learnMore}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover/card:translate-x-1"
        />
      </Link>
    </Card>
  );
}
