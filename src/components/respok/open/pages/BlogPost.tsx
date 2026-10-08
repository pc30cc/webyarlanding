import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import {
  blogCategoryLabel,
  formatPostDate,
  readingMinutes,
  tagSlug,
  textDir,
} from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Markdown } from "../../shared/Markdown";
import type { BlogPostPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { PostCover } from "../blog";
import { Container, CornerDot, Dot, Eyebrow, GiantBubble, SectionHeader } from "../ui";
import { cx, displayClass, pad } from "../tokens";

export function BlogPostPage({ post, related }: BlogPostPageData) {
  const { settings, brand, siteUrl, t } = useRespok();
  const copy = useContent(getBlogContent);
  const category = blogCategoryLabel(
    t,
    post.categoryName ?? undefined,
    post.categorySlug ?? undefined,
    copy.general,
  );
  const date = formatPostDate(post);
  const minutes = copy.minutes(readingMinutes(post.content));
  const url = siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined;
  const hasCover = !!post.coverImage;
  const rtl = textDir(post.title) === "rtl";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.coverImage || undefined,
      url,
      mainEntityOfPage: url ? { "@type": "WebPage", "@id": url } : undefined,
      author: { "@type": "Person", name: post.author || brand },
      publisher: { "@type": "Organization", name: brand, url: siteUrl || undefined },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: copy.title, path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  const meta: { label: string; value: string; dateTime?: string }[] = [
    ...(post.author ? [{ label: OPEN_COPY.blog.author, value: post.author }] : []),
    ...(date
      ? [
          {
            label: OPEN_COPY.blog.published,
            value: date,
            dateTime: post.publishedAt || post.createdAt,
          },
        ]
      : []),
    { label: OPEN_COPY.blog.reading, value: minutes },
    { label: OPEN_COPY.blog.category, value: category },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="relative isolate overflow-hidden bg-rpk-ink text-white">
        {hasCover ? null : <GiantBubble size="md" />}
        <Container
          className={cx("relative", hasCover ? "pb-40 sm:pb-56 lg:pb-64" : "pb-16 sm:pb-20")}
        >
          <div className="flex items-center justify-between gap-4 border-b border-rpk-ink-line py-4 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
            <span className="truncate">
              {brand} · {copy.eyebrow}
            </span>
            <span
              dir={textDir(category)}
              className={cx(
                "max-w-[50%] shrink-0 truncate",
                textDir(category) === "rtl" && "font-rpk tracking-normal",
              )}
            >
              {category}
            </span>
          </div>
          <Link
            to="/blog"
            className="group/back mt-8 inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-medium text-white/75 transition-colors hover:text-white"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform group-hover/back:-translate-x-1"
            />
            {copy.back}
          </Link>
          {/* A Persian title sets the reading edge: its dateline and byline follow it right. */}
          <div className={cx("pt-10 sm:pt-14", rtl && "text-right")}>
            <Eyebrow surface="ink">
              {date ? (
                <>
                  <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
                  <span aria-hidden="true"> · </span>
                  {minutes}
                </>
              ) : (
                minutes
              )}
            </Eyebrow>
            <h1
              dir={textDir(post.title)}
              className={cx(
                displayClass("md", rtl ? "rtl" : "ltr"),
                "mt-5 text-balance text-white",
                !rtl && "max-w-[22ch]",
              )}
            >
              {post.title}
            </h1>
            {post.author ? (
              <p
                className={cx(
                  "mt-8 flex items-center gap-3 text-[15px] text-white/72",
                  rtl && "justify-end",
                )}
              >
                <Dot size={8} />
                <span>
                  {copy.by}{" "}
                  <span dir={textDir(post.author)} className="font-semibold text-white">
                    {post.author}
                  </span>
                </span>
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <Container className="pb-20 sm:pb-28">
        {hasCover ? (
          <div className="relative -mt-28 mr-5 sm:-mt-44 sm:mr-7 lg:-mt-52">
            <PostCover
              post={post}
              label={category}
              eager
              bubble="xl"
              className="aspect-[16/9] bg-rpk-ink-soft shadow-rpk-panel"
            />
            <CornerDot size={22} />
          </div>
        ) : null}

        <div className="mt-14 grid gap-12 sm:mt-20 lg:grid-cols-12 lg:gap-10">
          <aside className="min-w-0 lg:col-span-3">
            <div className="lg:sticky lg:top-[104px]">
              <dl className="grid grid-cols-2 gap-x-6 border-t-2 border-rpk-ink lg:grid-cols-1">
                {meta.map((item) => (
                  <div key={item.label} className="min-w-0 border-b border-rpk-mist py-4">
                    <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-[16px] font-semibold wrap-anywhere text-rpk-ink">
                      {item.dateTime ? (
                        <time dateTime={item.dateTime}>{item.value}</time>
                      ) : (
                        <bdi>{item.value}</bdi>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {post.tags.length > 0 ? (
                <div className="mt-6">
                  <p className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                    {copy.tags}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          to="/tag/$slug"
                          params={{ slug: tagSlug(tag) }}
                          dir={textDir(tag)}
                          className="inline-flex min-h-9 max-w-full items-center rounded-[12px] rounded-br-[3px] bg-white px-3 text-[14px] font-medium wrap-anywhere text-rpk-ink transition-colors hover:bg-rpk-ink hover:text-white"
                        >
                          <span aria-hidden="true" className="mr-0.5 text-rpk-signal-deep">
                            #
                          </span>
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>

          <article className="min-w-0 lg:col-span-7 lg:col-start-5">
            {post.excerpt ? (
              <p
                dir={textDir(post.excerpt)}
                className="mb-10 border-b border-rpk-mist pb-10 text-[21px] leading-[1.55] font-medium tracking-[-0.005em] text-rpk-ink sm:text-[24px]"
              >
                {post.excerpt}
              </p>
            ) : null}
            <Markdown className="rpk-o-prose" dir={textDir(post.content)}>
              {post.content}
            </Markdown>
          </article>
        </div>
      </Container>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="bg-white">
          <Container className="py-16 sm:py-24">
            <SectionHeader
              index="02"
              eyebrow={copy.eyebrow}
              title={copy.related}
              id="related-title"
            />
            <ol className="mt-8">
              {related.map((item, index) => (
                <li key={item.id} className="border-b border-rpk-mist">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: item.slug }}
                    className="group/row grid grid-cols-[40px_1fr_auto] items-center gap-x-4 gap-y-1 rounded-[6px] py-6 md:grid-cols-12 md:gap-x-10"
                  >
                    <span className="font-rpk-mono text-[13px] text-rpk-slate md:col-span-4 lg:col-span-3">
                      {pad(index + 1)}
                    </span>
                    <span
                      dir={textDir(item.title)}
                      className="min-w-0 text-[19px] leading-[1.3] font-bold tracking-[-0.01em] wrap-anywhere text-rpk-ink md:col-span-5 lg:col-span-6 lg:text-[22px]"
                    >
                      {item.title}
                    </span>
                    <span className="hidden font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase md:col-span-2 md:block">
                      {formatPostDate(item)}
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
              ))}
            </ol>
          </Container>
        </section>
      ) : null}
    </>
  );
}
