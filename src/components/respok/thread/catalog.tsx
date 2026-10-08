/** Catalog (products / solutions) cards for the Thread template. */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CatalogType } from "@/lib/catalog.functions";
import { getIcon } from "@/lib/icon-registry";
import { SHAPE, cx } from "./classes";
import { CheckList, IconTile } from "./ui";

export interface CatalogCardItem {
  slug: string;
  title: string;
  shortDesc: string;
  icon: string;
}

/** Item card → /products/$slug or /solutions/$slug (the whole card is the link). */
export function CatalogCard({
  kind,
  item,
  bullets,
  learnMore,
  headingLevel = "h3",
  bordered = false,
}: {
  kind: CatalogType;
  item: CatalogCardItem;
  bullets: string[];
  learnMore: string;
  headingLevel?: "h2" | "h3";
  /** Adds a hairline for cards on white backgrounds. */
  bordered?: boolean;
}) {
  const Icon = getIcon(item.icon);
  const Heading = headingLevel;
  const link =
    kind === "product"
      ? ({ to: "/products/$slug", params: { slug: item.slug } } as const)
      : ({ to: "/solutions/$slug", params: { slug: item.slug } } as const);
  return (
    <article
      className={cx(
        "group/card relative flex h-full flex-col bg-white p-6 shadow-rpk-card transition-[transform,box-shadow] duration-300 ease-rpk-spring hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(22_20_43/0.06),0_28px_50px_-28px_rgb(22_20_43/0.4)] sm:p-7",
        SHAPE.answerCard,
        bordered && "ring-1 ring-rpk-mist/70",
      )}
    >
      <IconTile
        icon={Icon}
        className="transition-colors duration-200 group-hover/card:bg-rpk-ink group-hover/card:text-white group-hover/card:ring-rpk-ink"
      />
      <Heading className="mt-6 text-[20px] leading-[1.25] font-bold tracking-[-0.01em] text-balance text-rpk-ink">
        <Link {...link} className="rounded-md after:absolute after:inset-0 after:content-['']">
          {item.title}
        </Link>
      </Heading>
      {item.shortDesc && (
        <p className="mt-2 text-[15px] leading-[1.6] text-pretty text-rpk-slate">{item.shortDesc}</p>
      )}
      {bullets.length > 0 && <CheckList items={bullets} size="sm" className="mt-5" />}
      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[15px] font-semibold text-rpk-ink">
        <span className="underline decoration-rpk-mist decoration-2 underline-offset-[6px] transition-colors group-hover/card:decoration-rpk-signal">
          {learnMore}
        </span>
        <ArrowRight
          aria-hidden="true"
          strokeWidth={2.4}
          className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/card:translate-x-0.5"
        />
      </span>
    </article>
  );
}
