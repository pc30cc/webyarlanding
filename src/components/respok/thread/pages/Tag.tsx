import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { TagPageData } from "../../types";
import { useContent } from "../../content";
import { getBlogContent } from "../../content/blog";
import { textDir } from "../../shared/blog";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { PostGrid } from "../blog";
import { THREAD_COPY } from "../copy";
import { Badge, Container, PageOpener } from "../ui";

export function TagPage({ settings, posts, slug }: TagPageData) {
  const { siteUrl } = useRespok();
  const copy = useContent(getBlogContent);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Tag: ${slug}`,
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
      { name: "Blog", path: "/blog" },
      { name: slug, path: `/tag/${slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener
        question={
          <>
            {THREAD_COPY.blog.tagQuestion}{" "}
            {/* Short tags stay on one line instead of breaking at a hyphen. */}
            <bdi className={slug.length <= 24 ? "whitespace-nowrap" : "[overflow-wrap:anywhere]"}>
              #{slug}
            </bdi>
          </>
        }
        eyebrow={copy.tag.eyebrow}
        title={
          <span className="block break-words">
            <span className="sr-only">{copy.tag.eyebrow}: </span>
            <span aria-hidden="true" className="text-rpk-signal-deep">
              #
            </span>
            <bdi dir={textDir(slug)}>{slug}</bdi>
          </span>
        }
        meta={<Badge tone="ink">{copy.tag.count(posts.length)}</Badge>}
      />
      <section aria-label={copy.title} className="bg-rpk-paper py-12 sm:py-16 lg:py-20">
        <Container>
          <PostGrid posts={posts} />
        </Container>
      </section>
    </>
  );
}
