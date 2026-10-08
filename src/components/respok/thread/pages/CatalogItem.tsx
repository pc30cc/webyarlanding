import { useCallback, useId } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getIcon } from "@/lib/icon-registry";
import type { CatalogItemPageData } from "../../types";
import { useContent, type ContentFlags } from "../../content";
import { getCatalogContent } from "../../content/catalog";
import { useRespokAuth } from "../../shared/auth";
import { useRespok } from "../../shared/context";
import { isAllowedText } from "../../shared/gating";
import { JsonLd } from "../../shared/JsonLd";
import { Markdown } from "../../shared/Markdown";
import { Reveal } from "../../shared/Reveal";
import { catalogItemJsonLd, withOverride } from "../../shared/structured";
import { CatalogCard } from "../catalog";
import { THREAD_COPY } from "../copy";
import { SHAPE, cx } from "../classes";
import { humanizeSlug, useEnglishText, useGatedList } from "../labels";
import {
  ActionLink,
  AnswerCard,
  CheckDot,
  CheckList,
  Container,
  IconTile,
  PageOpener,
  Section,
  SectionHeader,
} from "../ui";

/** First paragraph of a markdown text as plain text (for the lead when there is no summary). */
function plainLead(markdown: string): string {
  const paragraph =
    markdown
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|>|[-*+] |\d+\. |```|\|)/.test(block)) ?? "";
  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 240 ? `${text.slice(0, 237).replace(/\s+\S*$/, "")}…` : text;
}

export function CatalogItemPage({
  settings,
  seoOverride,
  kind,
  item,
  categoryTitle,
  related,
}: CatalogItemPageData) {
  const { brand, t, callEnabled, aiEnabled } = useRespok();
  const auth = useRespokAuth();
  const build = useCallback((flags: ContentFlags) => getCatalogContent(kind, flags), [kind]);
  const c = useContent(build);
  const en = useEnglishText();
  const gatedList = useGatedList();
  const featuresId = useId();
  const relatedId = useId();

  const listPath = kind === "product" ? "/products" : "/solutions";
  const Icon = getIcon(item.icon);
  const title = en(item.title, humanizeSlug(item.slug));
  const description = en(item.description);
  const lead = en(item.shortDesc) || plainLead(description);
  const category = categoryTitle ? en(categoryTitle) : "";
  const bullets = gatedList(item.bullets);
  const relatedItems = related
    .filter((entry) =>
      isAllowedText(
        { callEnabled, aiEnabled },
        entry.title,
        entry.shortDesc,
        t(entry.title),
        t(entry.shortDesc),
      ),
    )
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      icon: entry.icon,
      title: en(entry.title, humanizeSlug(entry.slug)),
      shortDesc: en(entry.shortDesc),
      bullets: gatedList(entry.bullets, 3),
    }));

  const primary =
    kind === "product"
      ? { href: auth.ctaUrl, label: c.detail.primary }
      : { href: "/contact", label: c.detail.primary };

  const breadcrumb = (
    <nav aria-label={THREAD_COPY.catalog.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-rpk-mono text-[12px] tracking-[0.06em] text-rpk-slate uppercase">
        <li className="flex items-center gap-2">
          <Link to="/" className="rounded-sm transition-colors hover:text-rpk-ink">
            {THREAD_COPY.catalog.home}
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
        </li>
        <li className="flex items-center gap-2">
          <Link to={listPath} className="rounded-sm transition-colors hover:text-rpk-ink">
            {c.detail.crumb}
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
        </li>
        <li aria-current="page" className="max-w-[18rem] truncate text-rpk-ink">
          {title}
        </li>
      </ol>
    </nav>
  );

  const actions = (
    <div className="mt-4 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
      <ActionLink href={primary.href} size="lg" arrow>
        {primary.label}
      </ActionLink>
      <ActionLink href={c.detail.secondary.to} variant="outline" size="lg">
        {c.detail.secondary.label}
      </ActionLink>
    </div>
  );

  const backLink = (
    <Link
      to={listPath}
      className="group/back inline-flex min-h-11 items-center gap-2 rounded-full text-[15px] font-semibold text-rpk-ink"
    >
      <ArrowLeft
        aria-hidden="true"
        strokeWidth={2.4}
        className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/back:-translate-x-0.5"
      />
      <span className="underline decoration-rpk-mist decoration-2 underline-offset-[6px] transition-colors group-hover/back:decoration-rpk-signal">
        {c.detail.back}
      </span>
    </Link>
  );

  const featuresCard = bullets.length > 0 && (
    <AnswerCard as="section" aria-labelledby={featuresId} className="p-7 sm:p-8">
      <IconTile icon={Icon} tone="soft" />
      <h2
        id={featuresId}
        className="mt-6 text-[22px] leading-[1.2] font-bold tracking-[-0.01em] text-balance text-rpk-ink"
      >
        {c.detail.features(title)}
      </h2>
      <CheckList items={bullets} className="mt-6" />
    </AnswerCard>
  );

  return (
    <>
      <JsonLd
        data={withOverride(
          seoOverride,
          catalogItemJsonLd(settings, brand, kind, item, title, lead || description),
        )}
      />
      <PageOpener
        before={breadcrumb}
        question={THREAD_COPY.catalog.itemQuestion(title)}
        eyebrow={
          <span className="flex items-center gap-3">
            <IconTile icon={Icon} tone="ink" className="!h-9 !w-11" />
            {category || c.detail.crumb}
          </span>
        }
        title={title}
        lede={lead}
        meta={actions}
      />

      <div className="bg-rpk-paper py-14 sm:py-16 lg:py-20">
        <Container>
          {description ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-10">
              <AnswerCard as="article" className="px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
                <Markdown className="tt-prose mx-auto max-w-[44rem]">{description}</Markdown>
              </AnswerCard>
              <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                {featuresCard}
                <div className={cx("bg-rpk-ink p-7 text-white sm:p-8", SHAPE.questionCard)}>
                  <p className="text-[18px] leading-[1.35] font-bold text-balance">{title}</p>
                  {lead && (
                    <p className="mt-2 line-clamp-3 text-[15px] leading-[1.55] text-white/70">
                      {lead}
                    </p>
                  )}
                  <ActionLink href={primary.href} arrow className="mt-6 w-full">
                    {primary.label}
                  </ActionLink>
                </div>
              </div>
            </div>
          ) : bullets.length > 0 ? (
            <section aria-labelledby={featuresId}>
              <div className="flex items-center gap-4">
                <IconTile icon={Icon} tone="soft" />
                <h2
                  id={featuresId}
                  className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance text-rpk-ink sm:text-[30px]"
                >
                  {c.detail.features(title)}
                </h2>
              </div>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5">
                {bullets.map((bullet, index) => (
                  <Reveal as="li" key={bullet} delay={(index % 2) * 90}>
                    <AnswerCard className="flex h-full items-start gap-4 p-6">
                      <CheckDot className="mt-[3px]" />
                      <span className="text-[16px] leading-[1.55] text-rpk-ink">{bullet}</span>
                    </AnswerCard>
                  </Reveal>
                ))}
              </ul>
            </section>
          ) : null}
          <div className={cx(description || bullets.length > 0 ? "mt-12" : "")}>{backLink}</div>
        </Container>
      </div>

      {relatedItems.length > 0 && (
        <Section tone="white" labelledBy={relatedId}>
          <Container>
            <SectionHeader id={relatedId} title={c.detail.related} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {relatedItems.map((entry, index) => (
                <Reveal as="li" key={entry.id} delay={(index % 3) * 90}>
                  <CatalogCard
                    kind={kind}
                    item={entry}
                    bullets={entry.bullets}
                    learnMore={c.learnMore}
                    bordered
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
