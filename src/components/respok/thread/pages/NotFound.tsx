import type { NotFoundPageData } from "../../types";
import { getNotFoundContent } from "../../content/notFound";
import { TYPE, cx } from "../classes";
import { ActionLink, Container, Conversation, OpenerMark } from "../ui";

/** 404: the visitor asks, and the answer pill is an outline — nobody's here. */
export function NotFoundPage({ kind }: NotFoundPageData) {
  const copy = getNotFoundContent(kind);
  return (
    <section className="relative overflow-hidden bg-white">
      <OpenerMark away />
      <Container className="relative flex min-h-[calc(100dvh-76px)] flex-col justify-center py-16 sm:py-24">
        <div className="max-w-3xl">
          <Conversation
            question={copy.question}
            away
            answer={
              <span className="flex items-center gap-3 px-1 font-rpk-mono text-[15px] font-medium tracking-[0.08em] sm:text-[17px]">
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 rounded-full ring-2 ring-rpk-away ring-inset"
                />
                {copy.code}
              </span>
            }
          />
          <h1 className={cx(TYPE.display, "mt-12 text-balance text-rpk-ink")}>{copy.title}</h1>
          <p className={cx(TYPE.lede, "mt-6 max-w-[36rem] text-pretty")}>{copy.body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ActionLink href={copy.back.to} size="lg" arrow>
              {copy.back.label}
            </ActionLink>
            <ActionLink href={copy.secondary.to} variant="outline" size="lg">
              {copy.secondary.label}
            </ActionLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
