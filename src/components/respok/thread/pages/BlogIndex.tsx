import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { BlogIndexPageData } from "../../types";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import { blogCategoryLabel, pageList, useBlogSearch } from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { PostGrid } from "../blog";
import { THREAD_COPY } from "../copy";
import { SHAPE, chipClass, cx } from "../classes";
import { ActionLink, AnswerPill, Container, Exchange, PageOpener, QuestionPill } from "../ui";

const PAGE_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-colors duration-200";

export function BlogIndexPage({ settings, page, categories, category, q }: BlogIndexPageData) {
  const { brand, siteUrl, t } = useRespok();
  const copy = useContent(getBlogContent);
  const search = useBlogSearch(q);
  const posts = page.posts;
  const totalPages = Math.max(1, Math.ceil(page.total / Math.max(1, page.pageSize)));
  const current = Math.min(Math.max(1, page.page), totalPages);
  const filtered = !!category || !!q;
  const featureFirst = !filtered && current === 1 && posts.length >= 4;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `${brand} Blog`,
      url: siteUrl ? `${siteUrl}/blog` : undefined,
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined,
        datePublished: post.publishedAt || post.createdAt,
      })),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]),
  ];

  const pageSearch = (n: number) => ({ category, q, page: n });

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener question={copy.question} title={copy.title} lede={copy.lede}>
        <div className="mt-10 flex flex-col gap-5 sm:mt-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <nav aria-label={THREAD_COPY.blog.filter} className="min-w-0">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  to="/blog"
                  search={{ q, page: 1 }}
                  aria-current={!category ? "page" : undefined}
                  className={chipClass(!category)}
                >
                  {copy.all}
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/blog"
                    search={{ category: c.slug, q, page: 1 }}
                    aria-current={category === c.slug ? "page" : undefined}
                    className={chipClass(category === c.slug)}
                  >
                    {blogCategoryLabel(t, c.name, c.slug, copy.general)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form
            role="search"
            onSubmit={(event) => event.preventDefault()}
            className="relative w-full shrink-0 lg:w-80"
          >
            <label htmlFor="blog-search" className="sr-only">
              {copy.search}
            </label>
            <Search
              aria-hidden="true"
              strokeWidth={2.4}
              className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-rpk-slate"
            />
            <input
              id="blog-search"
              type="search"
              value={search.value}
              onChange={(event) => search.setValue(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className={cx(
                "block h-12 w-full bg-rpk-paper pr-12 pl-12 text-[16px] text-rpk-ink ring-1 ring-rpk-mist ring-inset placeholder:text-rpk-slate hover:ring-rpk-haze focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden",
                SHAPE.question,
              )}
            />
            {search.value && (
              <button
                type="button"
                onClick={() => search.setValue("")}
                aria-label={THREAD_COPY.blog.clear}
                className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-rpk-slate transition-colors hover:bg-rpk-mist hover:text-rpk-ink"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={2.4} />
              </button>
            )}
          </form>
        </div>
      </PageOpener>

      <section aria-label={copy.title} className="bg-rpk-paper py-12 sm:py-16 lg:py-20">
        <Container>
          {q && posts.length > 0 && (
            <p className="mb-8 font-rpk-mono text-[13px] tracking-[0.04em] text-rpk-slate">
              <bdi>{THREAD_COPY.blog.searching(q)}</bdi> · {page.total}
            </p>
          )}

          {posts.length === 0 ? (
            <div className="py-10 sm:py-16">
              <Exchange
                question={
                  <QuestionPill size="lg" className="[overflow-wrap:anywhere]">
                    <bdi>{q ? q : copy.search}</bdi>
                  </QuestionPill>
                }
                answer={
                  <AnswerPill size="lg" away>
                    {copy.empty}
                  </AnswerPill>
                }
              />
              {filtered && (
                <ActionLink href="/blog" variant="secondary" arrow className="mt-10">
                  {THREAD_COPY.blog.showAll}
                </ActionLink>
              )}
            </div>
          ) : (
            <PostGrid posts={posts} featureFirst={featureFirst} />
          )}

          {totalPages > 1 && (
            <nav
              aria-label={THREAD_COPY.blog.pagination}
              className="mt-14 flex items-center justify-center gap-2 sm:mt-16"
            >
              {current > 1 ? (
                <Link
                  to="/blog"
                  search={pageSearch(current - 1)}
                  aria-label={copy.previous}
                  className={cx(
                    PAGE_BUTTON,
                    "bg-white text-rpk-ink ring-1 ring-rpk-mist ring-inset hover:bg-rpk-ink hover:text-white",
                  )}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.4} />
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className={cx(PAGE_BUTTON, "text-rpk-away ring-1 ring-rpk-mist ring-inset")}
                >
                  <ArrowLeft className="size-4" strokeWidth={2.4} />
                </span>
              )}
              <ul className="flex items-center gap-1.5">
                {pageList(current, totalPages).map((n, index) =>
                  n === "gap" ? (
                    <li
                      key={`gap-${index}`}
                      aria-hidden="true"
                      className="px-1 font-rpk-mono text-rpk-slate"
                    >
                      …
                    </li>
                  ) : (
                    <li key={n}>
                      <Link
                        to="/blog"
                        search={pageSearch(n)}
                        aria-label={copy.page(n)}
                        aria-current={n === current ? "page" : undefined}
                        className={cx(
                          PAGE_BUTTON,
                          n === current
                            ? cx(SHAPE.question, "bg-rpk-ink text-white")
                            : "text-rpk-ink hover:bg-white",
                        )}
                      >
                        {n}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
              {current < totalPages ? (
                <Link
                  to="/blog"
                  search={pageSearch(current + 1)}
                  aria-label={copy.next}
                  className={cx(
                    PAGE_BUTTON,
                    "bg-rpk-signal text-rpk-ink hover:-translate-y-px",
                    SHAPE.answer,
                  )}
                >
                  <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className={cx(PAGE_BUTTON, "text-rpk-away ring-1 ring-rpk-mist ring-inset")}
                >
                  <ArrowRight className="size-4" strokeWidth={2.4} />
                </span>
              )}
            </nav>
          )}
        </Container>
      </section>
    </>
  );
}
