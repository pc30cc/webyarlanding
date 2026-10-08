import { useRouterState } from "@tanstack/react-router";
import { getNotFoundContent } from "../../content/notFound";
import { useRespok } from "../../shared/context";
import type { NotFoundPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { ActionLink, BubbleGlyph, Container, DISPLAY, Eyebrow } from "../ui";
import { cx } from "../tokens";

/**
 * 404 as the brand's "away" state: the bubble is here, but its dot is an empty ring.
 */
export function NotFoundPage({ kind }: NotFoundPageData) {
  const { brand } = useRespok();
  const copy = getNotFoundContent(kind);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <section className="relative isolate overflow-hidden bg-rpk-ink text-white">
      <Container className="relative pb-20 sm:pb-24 lg:pb-28">
        <div className="flex items-center justify-between gap-4 border-b border-rpk-ink-line py-4 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
          <span className="truncate">
            {brand} · {copy.code}
          </span>
          <span className="max-w-[50%] shrink-0 truncate normal-case" dir="ltr">
            {pathname}
          </span>
        </div>

        <div className="grid items-center gap-14 pt-14 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pt-24">
          <div className="lg:col-span-6">
            {/* The visitor's question, as a message in the widget. */}
            <div className="flex items-end gap-3">
              <p className="relative max-w-[22rem] rounded-[22px] rounded-br-[6px] bg-white px-5 py-3.5 text-[16px] leading-[1.45] font-medium text-rpk-ink">
                {copy.question}
              </p>
              <span className="mb-1 font-rpk-mono text-[12px] text-white/60">{copy.code}</span>
            </div>

            <Eyebrow index={copy.code} surface="ink" className="mt-12">
              {OPEN_COPY.notFound.status}
            </Eyebrow>
            <h1 className={cx(DISPLAY, "mt-5 max-w-[12ch] text-balance")}>{copy.title}</h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-white/72 sm:text-[19px]">
              {copy.body}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ActionLink to={copy.back.to} variant="primary" size="lg">
                {copy.back.label}
              </ActionLink>
              <ActionLink to={copy.secondary.to} variant="secondary" surface="ink" size="lg">
                {copy.secondary.label}
              </ActionLink>
            </div>
          </div>

          <div className="relative ml-auto w-full max-w-[240px] sm:max-w-[360px] lg:col-span-6 lg:mx-auto lg:max-w-[520px]">
            <div className="relative">
              <BubbleGlyph dot="away" className="w-full text-rpk-ink-raised" />
              <span
                aria-hidden="true"
                className="absolute top-[38%] left-[38%] -translate-x-1/2 -translate-y-1/2 font-rpk-mono text-[clamp(52px,11vw,132px)] leading-none font-medium tracking-[-0.04em] text-white"
              >
                {copy.code}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
