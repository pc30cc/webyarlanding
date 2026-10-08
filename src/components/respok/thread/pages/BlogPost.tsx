import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { BlogPostPageData } from "../../types";
import { RespokLogo } from "../../RespokLogo";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import { formatPostDate, readingMinutes, tagSlug, textDir } from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Markdown } from "../../shared/Markdown";
import { CoverArt, PostGrid } from "../blog";
import { useAuthorName, useCategoryLabel } from "../labels";
import { THREAD_COPY } from "../copy";
import { SHAPE, chipClass, cx } from "../classes";
import { Container, SectionHeader } from "../ui";

/** "Sara Mitchell" → "SM" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function BlogPostPage({ settings, post, related }: BlogPostPageData) {
  const { brand, siteUrl } = useRespok();
  const copy = useContent(getBlogContent);
  const categoryLabel = useCategoryLabel();
  const authorName = useAuthorName();
  const url = siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined;
  const date = formatPostDate(post);
  const minutes = readingMinutes(post.content);
  const author = authorName(post.author);
  const category = categoryLabel(post.categoryName, post.categorySlug, copy.general);
  const titleDir = textDir(post.title);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.coverImage || undefined,
      url,
      mainEntityOfPage: url ? { "@type": "WebPage", "@id": url } : undefined,
      author: { "@type": "Person", name: author },
      publisher: {
        "@type": "Organization",
        name: brand,
        ...(siteUrl
          ? {
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/respok/thread/apple-touch-icon.png`,
              },
            }
          : {}),
      },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="bg-white">
          <Container className="pt-8 pb-12 sm:pt-12 sm:pb-14">
            <div className="mx-auto max-w-[760px]">
              <Link
                to="/blog"
                className="group/back -ml-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-rpk-ink transition-colors hover:bg-rpk-paper"
              >
                <ArrowLeft
                  aria-hidden="true"
                  strokeWidth={2.4}
                  className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/back:-translate-x-0.5"
                />
                {copy.back}
              </Link>

              {/* The article column follows the post's language (Persian posts align right). */}
              <div dir={titleDir} className="mt-10 sm:mt-14">
                {post.categorySlug ? (
                  <Link
                    to="/blog"
                    search={{ category: post.categorySlug, page: 1 }}
                    className={chipClass(false, "!min-h-9 !text-[13px]")}
                  >
                    {category}
                  </Link>
                ) : (
                  <span className={chipClass(false, "!min-h-9 !text-[13px]")}>{category}</span>
                )}
                <h1 className="mt-6 text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em] text-balance break-words text-rpk-ink sm:text-[52px] lg:text-[60px]">
                  {post.title}
                </h1>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div className="flex items-center gap-3">
                    {author === brand ? (
                      <span
                        aria-hidden="true"
                        className="inline-flex size-11 items-center justify-center rounded-full bg-rpk-paper ring-1 ring-rpk-mist ring-inset"
                      >
                        <RespokLogo concept="thread" variant="symbol" height={18} title="" />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={cx(
                          "inline-flex size-11 items-center justify-center bg-rpk-ink text-[14px] font-bold text-white",
                          SHAPE.question,
                        )}
                      >
                        {initials(author)}
                      </span>
                    )}
                    <p dir="ltr" className="text-[15px] font-semibold text-rpk-ink">
                      <span className="text-rpk-slate">{copy.by} </span>
                      <bdi>{author}</bdi>
                    </p>
                  </div>
                  <p
                    dir="ltr"
                    className="flex flex-wrap items-center gap-x-3 font-rpk-mono text-[13px] tracking-[0.04em] text-rpk-slate"
                  >
                    {date && (
                      <>
                        <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{copy.minutes(minutes)}</span>
                  </p>
                </div>
              </div>
            </div>
          </Container>

          <Container wide className="pb-4">
            <div
              className={cx(
                "aspect-[16/9] overflow-hidden bg-rpk-paper sm:aspect-[2/1]",
                "rounded-[28px] rounded-br-[6px] sm:rounded-[40px] sm:rounded-br-[8px]",
              )}
            >
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt=""
                  width={1600}
                  height={800}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              ) : (
                <CoverArt seed={post.slug} wide />
              )}
            </div>
          </Container>
        </header>

        <div className="bg-white pt-12 pb-20 sm:pt-16 sm:pb-28">
          <Container>
            <div dir={textDir(post.content)} className="mx-auto max-w-[760px]">
              {post.excerpt && (
                <p
                  dir={textDir(post.excerpt)}
                  className="text-[20px] leading-[1.55] font-medium text-pretty text-rpk-ink sm:text-[23px]"
                >
                  {post.excerpt}
                </p>
              )}
              {post.excerpt && (
                <div aria-hidden="true" className="my-10 flex items-center gap-2 sm:my-12">
                  <span className={cx("h-3 w-6 bg-rpk-ink", SHAPE.question)} />
                  <span className={cx("h-3 w-8 bg-rpk-signal", SHAPE.answer)} />
                  <span className="h-px flex-1 bg-rpk-mist" />
                </div>
              )}
              <Markdown className="tt-prose" dir={textDir(post.content)}>
                {post.content}
              </Markdown>

              {post.tags.length > 0 && (
                <div className="mt-14 border-t border-rpk-mist pt-8">
                  <h2 className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                    {copy.tags}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          to="/tag/$slug"
                          params={{ slug: tagSlug(tag) }}
                          dir={textDir(tag)}
                          className={chipClass(false)}
                        >
                          <span aria-hidden="true" className="text-rpk-signal-deep">
                            #
                          </span>
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Container>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-posts" className="bg-rpk-paper py-16 sm:py-24">
          <Container>
            <SectionHeader
              id="related-posts"
              question={THREAD_COPY.blog.relatedQuestion}
              title={copy.related}
              className="mb-10 sm:mb-12"
            />
            <PostGrid posts={related.slice(0, 3)} headingLevel="h3" />
          </Container>
        </section>
      )}
    </>
  );
}
