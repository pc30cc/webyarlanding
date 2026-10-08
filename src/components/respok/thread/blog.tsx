import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { PostDto } from "@/lib/blog.functions";
import { RESPOK_SYMBOL } from "../RespokLogo";
import { getBlogContent } from "../content/blog";
import { useContent } from "../content";
import { useRespok } from "../shared/context";
import { formatPostDate, readingMinutes, textDir } from "../shared/blog";
import { cx, SHAPE } from "./ui";

const PERSIAN = /[\u0600-\u06FF]/;

function humanize(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Category names come from the database. When a name has no English translation
 * yet, its (Latin) slug is a better English label than the Persian original.
 */
export function useCategoryLabel() {
  const { t } = useRespok();
  return (name: string | null | undefined, slug: string | null | undefined, fallback: string) => {
    if (!name) return fallback;
    const translated = t(name);
    if (!PERSIAN.test(translated)) return translated;
    if (slug && !PERSIAN.test(slug) && /[a-z]/i.test(slug)) return humanize(slug);
    return translated;
  };
}

/** The Persian brand as an author is the English brand on this site. */
export function useAuthorName() {
  const { t, brand, settings } = useRespok();
  return (author: string | null | undefined) => {
    const name = (author || "").trim();
    if (!name || name === settings.brand.name?.trim()) return brand;
    return t(name);
  };
}

const THREAD = RESPOK_SYMBOL.thread;
const ANSWER_PATH = "path" in THREAD.accent ? THREAD.accent.path : "";

const COVER_TONES = [
  { bg: "#16142B", question: "#FFFFFF", answer: "#FF5A3C", dots: "#16142B" },
  { bg: "#F5F5F8", question: "#16142B", answer: "#FF5A3C", dots: "#16142B" },
  { bg: "#FFE3DC", question: "#16142B", answer: "#FF5A3C", dots: "#16142B" },
] as const;

/**
 * Branded placeholder when a post has no cover: the Thread mark, oversized and
 * cropped, with Respok "typing" inside the answer pill.
 */
export function CoverArt({
  seed,
  index,
  wide = false,
  className,
}: {
  seed: string;
  /** Position in a grid: neighbours get different tones. */
  index?: number;
  /** Banner proportions (article header): the whole mark, right of center. */
  wide?: boolean;
  className?: string;
}) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const pick = index ?? Math.abs(hash);
  const tone = COVER_TONES[pick % COVER_TONES.length] ?? COVER_TONES[0];
  return (
    <svg
      viewBox={wide ? "0 0 640 320" : "0 0 320 200"}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cx("block h-full w-full", className)}
    >
      <rect width={wide ? 640 : 320} height={wide ? 320 : 200} fill={tone.bg} />
      <g transform={wide ? "translate(330 58) scale(2.2)" : "translate(96 22) scale(2.3)"}>
        <path d={THREAD.main} fill={tone.question} />
        <path d={ANSWER_PATH} fill={tone.answer} />
        <circle cx="50" cy="71" r="3.6" fill={tone.dots} />
        <circle cx="63" cy="71" r="3.6" fill={tone.dots} opacity="0.7" />
        <circle cx="76" cy="71" r="3.6" fill={tone.dots} opacity="0.45" />
      </g>
    </svg>
  );
}

/** Blog card: reads like a message with an attachment. */
export function PostCard({
  post,
  headingLevel = "h2",
  featured = false,
  eager = false,
  index,
}: {
  post: PostDto;
  headingLevel?: "h2" | "h3";
  featured?: boolean;
  eager?: boolean;
  index?: number;
}) {
  const copy = useContent(getBlogContent);
  const categoryLabel = useCategoryLabel();
  const Heading = headingLevel;
  const date = formatPostDate(post);
  const minutes = readingMinutes(post.content);
  const category = categoryLabel(post.categoryName, post.categorySlug, copy.general);

  return (
    <article
      className={cx(
        "group/card relative flex h-full flex-col bg-white p-3 shadow-rpk-card transition-[transform,box-shadow] duration-300 ease-rpk-spring hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(22_20_43/0.06),0_28px_50px_-28px_rgb(22_20_43/0.4)]",
        SHAPE.answerCard,
        featured && "lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-2",
      )}
    >
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        tabIndex={-1}
        aria-hidden="true"
        className={cx(
          "block overflow-hidden rounded-[20px] bg-rpk-paper",
          featured ? "aspect-[16/10] lg:aspect-auto lg:min-h-[400px]" : "aspect-[16/10]",
        )}
      >
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            width={800}
            height={500}
            loading={eager ? "eager" : "lazy"}
            {...(eager ? { fetchPriority: "high" as const } : {})}
            className="h-full w-full object-cover transition-transform duration-500 ease-rpk-spring group-hover/card:scale-[1.03]"
          />
        ) : (
          <CoverArt
            seed={post.slug}
            {...(index !== undefined ? { index } : {})}
            className="transition-transform duration-500 ease-rpk-spring group-hover/card:scale-[1.03]"
          />
        )}
      </Link>
      <div
        className={cx(
          "flex flex-1 flex-col px-3 pt-5 pb-2",
          featured && "lg:justify-center lg:px-8 lg:py-8",
        )}
      >
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-rpk-mono text-[12px] tracking-[0.06em] text-rpk-slate uppercase">
          <span className="font-medium text-rpk-ink">{category}</span>
          {date && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
            </>
          )}
        </p>
        <Heading
          dir={textDir(post.title)}
          className={cx(
            "mt-3 font-bold text-balance text-rpk-ink",
            featured
              ? "text-[24px] leading-[1.15] tracking-[-0.02em] sm:text-[34px]"
              : "text-[20px] leading-[1.25] tracking-[-0.01em]",
          )}
        >
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="rounded-md decoration-rpk-signal decoration-2 underline-offset-4 hover:underline"
          >
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && (
          <p
            dir={textDir(post.excerpt)}
            className={cx(
              "mt-3 text-[15px] leading-[1.6] text-rpk-slate",
              featured ? "line-clamp-4 sm:text-[17px]" : "line-clamp-3",
            )}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            aria-label={copy.readMoreAria(post.title)}
            className="group/more inline-flex min-h-11 items-center gap-2 rounded-md text-[15px] font-semibold text-rpk-ink"
          >
            <span className="underline decoration-rpk-mist decoration-2 underline-offset-[6px] transition-colors group-hover/more:decoration-rpk-signal">
              {copy.readMore}
            </span>
            <ArrowRight
              aria-hidden="true"
              strokeWidth={2.4}
              className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/more:translate-x-0.5"
            />
          </Link>
          <p className="font-rpk-mono text-[12px] tracking-[0.04em] whitespace-nowrap text-rpk-slate">
            {copy.minutes(minutes)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function PostGrid({
  posts,
  headingLevel = "h2",
  featureFirst = false,
}: {
  posts: PostDto[];
  headingLevel?: "h2" | "h3";
  featureFirst?: boolean;
}) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {posts.map((post, index) => {
        const featured = featureFirst && index === 0;
        return (
          <li key={post.id} className={cx(featured && "sm:col-span-2 lg:col-span-3")}>
            <PostCard
              post={post}
              headingLevel={headingLevel}
              featured={featured}
              eager={index < 3}
              index={index}
            />
          </li>
        );
      })}
    </ul>
  );
}
