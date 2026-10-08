import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getIcon } from "@/lib/icon-registry";
import { useContent, type ContentFlags } from "../../content";
import { getCatalogContent } from "../../content/catalog";
import { useRespokAuth } from "../../shared/auth";
import { useRespok } from "../../shared/context";
import { isAllowedText } from "../../shared/gating";
import { JsonLd } from "../../shared/JsonLd";
import { Markdown } from "../../shared/Markdown";
import { catalogItemJsonLd, withOverride } from "../../shared/structured";
import type { CatalogItemPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import {
  ActionLink,
  Card,
  Container,
  CornerDot,
  Dot,
  Eyebrow,
  GiantBubble,
  IconTile,
  SectionHeader,
} from "../ui";
import { cx, displayClass, pad } from "../tokens";

/** A one-paragraph lead from a markdown description (when there is no short description). */
function plainLead(markdown: string): string {
  const paragraph =
    markdown
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|[-*+] |\d+\. |>|```|!\[)/.test(block)) ?? "";
  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 240 ? `${text.slice(0, 237).replace(/\s+\S*$/, "")}…` : text;
}

export function CatalogItemPage({
  kind,
  item,
  categoryTitle,
  related,
  settings,
  seoOverride,
}: CatalogItemPageData) {
  const { brand, t, callEnabled, aiEnabled } = useRespok();
  const auth = useRespokAuth();
  const build = useCallback((flags: ContentFlags) => getCatalogContent(kind, flags), [kind]);
  const c = useContent(build);
  const flags = { callEnabled, aiEnabled };
  const base = kind === "product" ? "/products" : "/solutions";

  const title = t(item.title);
  const shortDesc = t(item.shortDesc);
  const description = item.description ? t(item.description) : "";
  const lead = shortDesc || plainLead(description);
  const category = categoryTitle ? t(categoryTitle) : "";
  const bullets = item.bullets
    .filter((bullet) => isAllowedText(flags, bullet, t(bullet)))
    .map((bullet) => t(bullet));
  const more = related.filter((r) =>
    isAllowedText(flags, r.title, r.shortDesc, t(r.title), t(r.shortDesc)),
  );
  const Icon = getIcon(item.icon);

  const primary =
    kind === "product" ? (
      <ActionLink to={auth.ctaUrl} variant="primary" size="lg">
        {c.detail.primary}
      </ActionLink>
    ) : (
      <ActionLink to="/contact" variant="primary" size="lg">
        {c.detail.primary}
      </ActionLink>
    );

  // Chapters after the hero (01) follow the sections that are really there.
  const overviewIndex = pad(2);
  const featuresIndex = pad(description ? 3 : 2);
  const relatedIndex = pad(2 + (description ? 1 : 0) + (bullets.length > 0 ? 1 : 0));

  return (
    <>
      <JsonLd
        data={withOverride(
          seoOverride,
          catalogItemJsonLd(settings, brand, kind, item, title, lead || title),
        )}
      />

      <section className="relative isolate overflow-hidden bg-rpk-ink text-white">
        <GiantBubble size="md" />
        <Container className="relative pb-20 sm:pb-24">
          <nav
            aria-label={OPEN_COPY.catalog.breadcrumb}
            className="border-b border-rpk-ink-line py-4 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase"
          >
            <ol dir="ltr" className="flex min-w-0 items-center gap-2">
              <li className="shrink-0">
                <Link to="/" className="rounded-[4px] transition-colors hover:text-white">
                  {OPEN_COPY.catalog.home}
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0 text-white/35">
                /
              </li>
              <li className="shrink-0">
                <Link to={base} className="rounded-[4px] transition-colors hover:text-white">
                  {c.detail.crumb}
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0 text-white/35">
                /
              </li>
              <li aria-current="page" className="min-w-0 truncate text-white">
                {title}
              </li>
            </ol>
          </nav>

          <div className="pt-12 sm:pt-16 lg:pt-20">
            <div className="flex items-center gap-4">
              <IconTile icon={Icon} tone="signal" size={64} />
              {category ? (
                <Eyebrow surface="ink" index="01">
                  {category}
                </Eyebrow>
              ) : null}
            </div>
            <h1 className={cx(displayClass("lg"), "mt-8 max-w-[18ch] text-balance text-white")}>
              {title}
            </h1>
            {lead ? (
              <p className="mt-6 max-w-[58ch] text-[17px] leading-[1.6] text-white/72 sm:text-[19px]">
                {lead}
              </p>
            ) : null}
            <div className="mt-10 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
              {primary}
              <ActionLink to={c.detail.secondary.to} variant="secondary" surface="ink" size="lg">
                {c.detail.secondary.label}
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>

      {description || bullets.length > 0 ? (
        <Container className="py-20 sm:py-28">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
            {description ? (
              <article aria-labelledby="overview-title" className="min-w-0 lg:col-span-7">
                <h2 id="overview-title" className="border-t-2 border-rpk-ink pt-5">
                  <Eyebrow as="span" index={overviewIndex}>
                    {OPEN_COPY.catalog.overview}
                  </Eyebrow>
                </h2>
                <Markdown className="rpk-o-prose mt-10">{description}</Markdown>
              </article>
            ) : null}
            {bullets.length > 0 ? (
              <aside
                aria-labelledby="features-title"
                className={cx(
                  "min-w-0",
                  description ? "lg:col-span-4 lg:col-start-9" : "lg:col-span-8",
                )}
              >
                <div className="relative mr-6 lg:sticky lg:top-28">
                  <Card size="xl" className="p-7 sm:p-9">
                    <Eyebrow index={featuresIndex}>{c.eyebrow}</Eyebrow>
                    <h2
                      id="features-title"
                      className="mt-4 text-[24px] leading-[1.2] font-bold tracking-[-0.015em] text-rpk-ink"
                    >
                      {c.detail.features(title)}
                    </h2>
                    <ul className="mt-6 border-t border-rpk-mist">
                      {bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-3 border-b border-rpk-mist py-3.5 text-[16px] leading-[1.5] text-rpk-ink"
                        >
                          <Dot size={7} className="mt-[8px]" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 grid gap-3">
                      {kind === "product" ? (
                        <ActionLink to={auth.ctaUrl} variant="primary" className="w-full">
                          {c.detail.primary}
                        </ActionLink>
                      ) : (
                        <ActionLink to="/contact" variant="primary" className="w-full">
                          {c.detail.primary}
                        </ActionLink>
                      )}
                    </div>
                  </Card>
                  <CornerDot size={18} />
                </div>
              </aside>
            ) : null}
          </div>
        </Container>
      ) : null}

      <section aria-labelledby={more.length > 0 ? "related-title" : undefined} className="bg-white">
        <Container className="py-20 sm:py-28">
          {more.length > 0 ? (
            <>
              <SectionHeader
                index={relatedIndex}
                eyebrow={OPEN_COPY.catalog.related}
                title={c.detail.related}
                id="related-title"
              />
              <ol className="mt-8">
                {more.map((r, i) => {
                  const RIcon = getIcon(r.icon);
                  const rShort = t(r.shortDesc);
                  return (
                    <li key={r.id} className="border-b border-rpk-mist">
                      <Link
                        to={`${base}/$slug`}
                        params={{ slug: r.slug }}
                        className="group/row grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-[6px] py-6 md:grid-cols-12 md:gap-x-10"
                      >
                        <span className="flex items-center gap-3 md:col-span-4 lg:col-span-3">
                          <span className="font-rpk-mono text-[13px] text-rpk-slate">
                            {pad(i + 1)}
                          </span>
                          <span
                            aria-hidden="true"
                            className="hidden size-10 place-items-center rounded-[13px] rounded-br-[3px] bg-rpk-paper text-rpk-ink transition-colors group-hover/row:bg-rpk-ink group-hover/row:text-white md:grid"
                          >
                            <RIcon className="size-[18px]" strokeWidth={1.75} />
                          </span>
                        </span>
                        <span className="min-w-0 md:col-span-7 lg:col-span-8">
                          <span className="block text-[19px] leading-[1.3] font-bold tracking-[-0.01em] text-rpk-ink lg:text-[22px]">
                            {t(r.title)}
                          </span>
                          {rShort ? (
                            <span className="mt-1 line-clamp-2 block text-[15px] leading-[1.55] text-rpk-slate">
                              {rShort}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center justify-end gap-2 md:col-span-1">
                          <Dot
                            size={8}
                            tone="away-ink"
                            className="transition-[transform,background-color,border-color] duration-300 ease-rpk-pop group-hover/row:translate-x-1 group-hover/row:border-rpk-signal group-hover/row:bg-rpk-signal"
                          />
                          <ArrowRight
                            aria-hidden="true"
                            className="size-[18px] text-rpk-slate transition-transform group-hover/row:translate-x-1 group-hover/row:text-rpk-ink"
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : null}
          <Link
            to={base}
            className={cx(
              "group/back inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-semibold text-rpk-ink",
              more.length > 0 && "mt-12",
            )}
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform group-hover/back:-translate-x-1"
            />
            {c.detail.back}
          </Link>
        </Container>
      </section>
    </>
  );
}
