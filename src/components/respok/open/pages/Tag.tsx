import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import { textDir } from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import type { TagPageData } from "../../types";
import { PostGrid } from "../blog";
import { Badge, ChapterHero, Container, Dot } from "../ui";

export function TagPage({ posts, slug }: TagPageData) {
  const { settings, brand, siteUrl } = useRespok();
  const copy = useContent(getBlogContent);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${copy.tag.eyebrow}: ${slug}`,
      url: siteUrl ? `${siteUrl}/tag/${slug}` : undefined,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: posts.slice(0, 20).map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined,
          name: post.title,
        })),
      },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: copy.title, path: "/blog" },
      { name: slug, path: `/tag/${slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path={`/tag/${slug}`}
        eyebrow={copy.tag.eyebrow}
        title={
          <>
            <span aria-hidden="true" className="text-rpk-signal">
              #
            </span>
            {slug}
          </>
        }
        titleDir={textDir(slug)}
        size="md"
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Badge tone="glass">
            <Dot size={6} />
            {copy.tag.count(posts.length)}
          </Badge>
          <Link
            to="/blog"
            className="group/back inline-flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] font-medium text-white/75 transition-colors hover:text-white"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform group-hover/back:-translate-x-1"
            />
            {copy.back}
          </Link>
        </div>
      </ChapterHero>
      <Container className="py-14 sm:py-20">
        <PostGrid posts={posts} />
      </Container>
    </>
  );
}
