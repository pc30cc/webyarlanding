/**
 * Blog building blocks for the Open template: post cards with a cover (or a cover drawn
 * from the logo geometry), mono metadata and LTR pagination. Post titles and excerpts keep
 * their original language and direction.
 */
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PostDto } from "@/lib/blog.functions";
import { RespokLogo } from "../RespokLogo";
import { getBlogContent } from "../content/blog";
import { useContent } from "../content";
import {
  blogCategoryLabel,
  formatPostDate,
  pageList,
  readingMinutes,
  textDir,
} from "../shared/blog";
import { useRespok } from "../shared/context";
import { OPEN_COPY } from "./copy";
import { BUBBLE, BubbleGlyph, CornerDot, Dot, type BubbleSize } from "./ui";
import { cx } from "./tokens";

/** A post's category, in English (editor names may be Persian). */
function usePostCategory(post: PostDto): string {
  const { t } = useRespok();
  const blog = useContent(getBlogContent);
  return blogCategoryLabel(
    t,
    post.categoryName ?? undefined,
    post.categorySlug ?? undefined,
    blog.general,
  );
}

/**
 * Mono uppercase label for Latin text. Persian/Arabic DB strings (categories) keep the
 * sans face with no letter-spacing, which would break the script's letter joining.
 */
function monoLabel(dir: "ltr" | "rtl"): string {
  return dir === "rtl"
    ? "font-rpk text-[13px] font-medium"
    : "font-rpk-mono text-[12px] tracking-[0.08em] uppercase";
}

/**
 * Cover drawn from the mark when a post has no image, in three colorways that rotate
 * through a list: Ink with the cover's cropped bubble, Haze with the color symbol, and
 * the symbol cropped huge on white so only its corner and dot show.
 */
function CoverArt({ variant, label }: { variant: number; label: string }) {
  const tone = ((variant % 3) + 3) % 3;
  const dir = textDir(label);
  const labelClass = cx("absolute left-[7%] truncate", monoLabel(dir));
  if (tone === 0) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-rpk-ink">
        <BubbleGlyph className="absolute -right-[12%] -bottom-[42%] w-[74%] text-rpk-ink-soft" />
        <RespokLogo
          concept="open"
          variant="symbol"
          colorway="reversed"
          height={40}
          title=""
          className="absolute top-[11%] left-[7%]"
        />
        <span dir={dir} className={cx(labelClass, "bottom-[10%] max-w-[60%] text-white/70")}>
          {label}
        </span>
      </div>
    );
  }
  if (tone === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-rpk-haze">
        <BubbleGlyph
          dot="live"
          className="absolute top-1/2 left-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 text-rpk-ink"
        />
        <span dir={dir} className={cx(labelClass, "top-[10%] max-w-[60%] text-rpk-ink/75")}>
          {label}
        </span>
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <BubbleGlyph dot="live" className="absolute -top-[55%] -left-[18%] w-[90%] text-rpk-mist" />
      <span dir={dir} className={cx(labelClass, "bottom-[10%] max-w-[50%] text-rpk-slate")}>
        {label}
      </span>
    </div>
  );
}

export function PostCover({
  post,
  label,
  className,
  eager,
  variant = 0,
  bubble = "lg",
}: {
  post: PostDto;
  label: string;
  className?: string;
  eager?: boolean;
  variant?: number;
  bubble?: BubbleSize;
}) {
  return (
    <div className={cx("overflow-hidden", BUBBLE[bubble], className)}>
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-rpk-spring group-hover/card:scale-[1.03]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-full w-full transition-transform duration-700 ease-rpk-spring group-hover/card:scale-[1.03]"
        >
          <CoverArt variant={variant} label={label} />
        </div>
      )}
    </div>
  );
}

/** "GUIDES · OCT 4, 2026 · 4 MIN READ" */
function PostMeta({ post, className }: { post: PostDto; className?: string }) {
  const blog = useContent(getBlogContent);
  const category = usePostCategory(post);
  const date = formatPostDate(post);
  return (
    <p
      className={cx(
        "flex flex-wrap items-center gap-x-2 gap-y-1 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase",
        className,
      )}
    >
      <span
        dir={textDir(category)}
        className={cx(
          "text-rpk-ink",
          textDir(category) === "rtl" && "font-rpk text-[13px] font-medium tracking-normal",
        )}
      >
        {category}
      </span>
      {date ? (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{blog.minutes(readingMinutes(post.content))}</span>
    </p>
  );
}

export function PostCard({
  post,
  featured = false,
  headingLevel = 2,
  index = 0,
}: {
  post: PostDto;
  featured?: boolean;
  headingLevel?: 2 | 3;
  /** Position in the list: rotates the drawn cover colorways. */
  index?: number;
}) {
  const blog = useContent(getBlogContent);
  const category = usePostCategory(post);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const link = { to: "/blog/$slug", params: { slug: post.slug } } as const;
  // A Persian post reads right to left: its whole text column aligns to the right edge.
  const rtl = textDir(post.title) === "rtl";

  return (
    <article
      className={cx(
        "group/card relative",
        featured ? "grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12" : "flex h-full flex-col",
      )}
    >
      <Link
        {...link}
        tabIndex={-1}
        aria-hidden="true"
        className={cx("relative block min-w-0", featured && "lg:col-span-7")}
      >
        <PostCover
          post={post}
          label={category}
          eager={featured}
          variant={index}
          className="aspect-[16/10]"
        />
        <CornerDot
          size={featured ? 18 : 12}
          className="scale-0 transition-transform duration-300 ease-rpk-pop group-hover/card:scale-100"
        />
      </Link>
      <div
        className={cx(
          "flex min-w-0 flex-col",
          featured ? "lg:col-span-5" : "mt-6 flex-1",
          rtl ? "items-end text-right" : "items-start",
        )}
      >
        <PostMeta post={post} className={rtl ? "justify-end" : ""} />
        <Heading
          dir={textDir(post.title)}
          className={cx(
            "mt-3 max-w-full font-bold wrap-anywhere text-rpk-ink",
            rtl ? "leading-[1.5]" : "tracking-[-0.015em]",
            featured ? "text-[28px] sm:text-[36px] lg:text-[40px]" : "text-[21px]",
            !rtl && (featured ? "leading-[1.15]" : "leading-[1.28]"),
          )}
        >
          <Link
            {...link}
            className={cx(
              "rounded-[4px] bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-no-repeat transition-[background-size] duration-300 group-hover/card:bg-[length:100%_2px]",
              rtl ? "bg-right-bottom" : "bg-left-bottom",
            )}
          >
            {post.title}
          </Link>
        </Heading>
        {post.excerpt ? (
          <p
            dir={textDir(post.excerpt)}
            className={cx(
              "mt-3 max-w-full wrap-anywhere text-rpk-slate",
              featured
                ? "line-clamp-4 text-[18px] leading-[1.6]"
                : "line-clamp-3 text-[16px] leading-[1.6]",
            )}
          >
            {post.excerpt}
          </p>
        ) : null}
        <Link
          {...link}
          aria-label={blog.readMoreAria(post.title)}
          className={cx(
            "inline-flex min-h-11 items-center gap-2 rounded-[4px] text-[15px] font-semibold text-rpk-ink",
            featured ? "mt-5" : "mt-auto pt-4",
          )}
        >
          <Dot
            size={7}
            className="transition-transform duration-300 ease-rpk-pop group-hover/card:scale-[1.35]"
          />
          {blog.readMore}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover/card:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

export function PostGrid({
  posts,
  headingLevel = 2,
  offset = 0,
}: {
  posts: PostDto[];
  headingLevel?: 2 | 3;
  offset?: number;
}) {
  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
      {posts.map((post, index) => (
        <li key={post.id} className="min-w-0">
          <PostCard post={post} headingLevel={headingLevel} index={index + offset} />
        </li>
      ))}
    </ul>
  );
}

type BlogSearch = { page: number; category?: string; q?: string };

export function Pagination({
  current,
  total,
  category,
  q,
}: {
  current: number;
  total: number;
  category?: string | undefined;
  q?: string | undefined;
}) {
  const blog = useContent(getBlogContent);
  if (total <= 1) return null;
  const search = (page: number): BlogSearch => ({
    page,
    ...(category ? { category } : {}),
    ...(q ? { q } : {}),
  });
  const edge =
    "inline-flex h-11 items-center gap-2 rounded-[14px] rounded-br-[4px] px-4 text-[15px] font-semibold transition-colors";
  return (
    <nav
      aria-label={OPEN_COPY.blog.pagination}
      dir="ltr"
      className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t-2 border-rpk-ink pt-5 sm:mt-20"
    >
      {current > 1 ? (
        <Link
          to="/blog"
          search={search(current - 1)}
          aria-label={blog.previous}
          className={cx(edge, "text-rpk-ink hover:bg-white")}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">{blog.previous}</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={cx(edge, "text-rpk-ink/30")}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{blog.previous}</span>
        </span>
      )}
      <ol className="flex items-center gap-1">
        {pageList(current, total).map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 font-rpk-mono text-rpk-slate"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/blog"
                search={search(item)}
                aria-label={blog.page(item)}
                aria-current={item === current ? "page" : undefined}
                className={cx(
                  "grid size-11 place-items-center rounded-[14px] rounded-br-[4px] font-rpk-mono text-[14px] transition-colors",
                  item === current ? "bg-rpk-ink text-white" : "text-rpk-ink hover:bg-white",
                )}
              >
                {String(item).padStart(2, "0")}
              </Link>
            </li>
          ),
        )}
      </ol>
      {current < total ? (
        <Link
          to="/blog"
          search={search(current + 1)}
          aria-label={blog.next}
          className={cx(edge, "text-rpk-ink hover:bg-white")}
        >
          <span className="hidden sm:inline">{blog.next}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cx(edge, "text-rpk-ink/30")}>
          <span className="hidden sm:inline">{blog.next}</span>
          <ArrowRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
