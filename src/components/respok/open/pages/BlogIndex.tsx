import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import { blogCategoryLabel, textDir, useBlogSearch } from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import type { BlogIndexPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { Pagination, PostCard, PostGrid } from "../blog";
import { ActionLink, BubbleGlyph, Card, ChapterHero, Container, Dot } from "../ui";
import { cx, pad } from "../tokens";

export function BlogIndexPage({ page, categories, category, q }: BlogIndexPageData) {
  const { settings, brand, siteUrl, t } = useRespok();
  const copy = useContent(getBlogContent);
  const search = useBlogSearch(q);
  const { posts, total, pageSize } = page;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = page.page || 1;
  const featured = current === 1 && !category && !q && posts.length >= 3 ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `${brand} Blog`,
      description: copy.lede,
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
      { name: copy.title, path: "/blog" },
    ]),
  ];

  // Filtering by category keeps the current search, as searching keeps the category.
  const keepQuery = q ? { q } : {};
  const chip =
    "inline-flex h-11 items-center gap-2 rounded-[14px] rounded-br-[4px] px-4 text-[14px] font-semibold transition-colors";
  const chipIdle = "bg-white text-rpk-ink hover:bg-rpk-mist";
  const chipActive = "bg-rpk-ink text-white";

  return (
    <>
      <JsonLd data={jsonLd} />
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path="/blog"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
        size="md"
      >
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="mt-10 max-w-[560px]"
        >
          <label htmlFor="blog-search" className="sr-only">
            {copy.search}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-rpk-slate"
            />
            <input
              id="blog-search"
              type="search"
              value={search.value}
              onChange={(event) => search.setValue(event.target.value)}
              placeholder={copy.searchPlaceholder}
              autoComplete="off"
              className="block h-14 w-full rounded-[20px] rounded-br-[6px] border-0 bg-white pr-14 pl-14 text-[16px] text-rpk-ink placeholder:text-rpk-slate outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {search.value ? (
              <button
                type="button"
                onClick={() => search.setValue("")}
                aria-label={OPEN_COPY.blog.resetSearch}
                className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-[12px] rounded-br-[3px] text-rpk-slate transition-colors hover:bg-rpk-paper hover:text-rpk-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </form>
      </ChapterHero>

      <Container className="py-12 sm:py-16">
        {categories.length > 0 ? (
          <nav aria-label={OPEN_COPY.blog.filter} className="border-b border-rpk-mist pb-6">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  to="/blog"
                  search={{ page: 1, ...keepQuery }}
                  aria-current={!category ? "page" : undefined}
                  className={cx(chip, !category ? chipActive : chipIdle)}
                >
                  {!category ? <Dot size={7} /> : null}
                  {copy.all}
                </Link>
              </li>
              {categories.map((c) => {
                const active = category === c.slug;
                const name = blogCategoryLabel(t, c.name, c.slug, copy.general);
                return (
                  <li key={c.id}>
                    <Link
                      to="/blog"
                      search={{ category: c.slug, page: 1, ...keepQuery }}
                      aria-current={active ? "page" : undefined}
                      className={cx(chip, active ? chipActive : chipIdle)}
                    >
                      {active ? <Dot size={7} /> : null}
                      <span dir={textDir(name)}>{name}</span>
                      {typeof c.postCount === "number" ? (
                        <span
                          className={cx(
                            "font-rpk-mono text-[12px] font-normal",
                            active ? "text-white/65" : "text-rpk-slate",
                          )}
                        >
                          {pad(c.postCount)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <p
          className="mt-6 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase"
          aria-live="polite"
        >
          {OPEN_COPY.blog.results(total)}
          {q ? (
            <>
              <span aria-hidden="true"> · </span>
              <span className="normal-case">“{q}”</span>
            </>
          ) : null}
        </p>

        {posts.length === 0 ? (
          <div className="relative mt-10 mr-6 max-w-[720px]">
            <Card className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
              <BubbleGlyph dot="away" className="w-20 shrink-0 text-rpk-mist" />
              <div>
                <h2 className="text-[24px] font-bold tracking-[-0.01em]">{copy.empty}</h2>
                <ActionLink to="/blog" variant="ink" size="sm" className="mt-5">
                  {OPEN_COPY.blog.resetSearch}
                </ActionLink>
              </div>
            </Card>
          </div>
        ) : (
          <>
            {featured ? (
              <div className="mt-10 border-b border-rpk-mist pb-14 sm:pb-16">
                <PostCard post={featured} featured />
              </div>
            ) : null}
            {rest.length > 0 ? (
              <div className={featured ? "mt-14 sm:mt-16" : "mt-10"}>
                <PostGrid posts={rest} offset={featured ? 1 : 0} />
              </div>
            ) : null}
          </>
        )}

        <Pagination current={current} total={totalPages} category={category} q={q} />
      </Container>
    </>
  );
}
