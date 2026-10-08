import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { LegalPageData } from "../../types";
import { useContent } from "../../content";
import { getSlaContent } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { THREAD_COPY } from "../copy";
import { AnswerCard, Container, IconBadge, PageOpener, SHAPE, SectionHeader, cx } from "../ui";

export function SlaPage({ settings }: LegalPageData) {
  const { brand, siteUrl } = useRespok();
  const copy = useContent(getSlaContent);
  const [uptimeLabel = "", creditLabel = ""] = copy.credits.columns;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.title,
      description: copy.lede,
      url: siteUrl ? `${siteUrl}/sla` : undefined,
      isPartOf: { "@type": "WebSite", name: brand, url: siteUrl || undefined },
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: "SLA", path: "/sla" },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener question={copy.question} title={copy.title} lede={copy.lede} />

      <section aria-label={THREAD_COPY.sla.statsLabel} className="bg-rpk-paper py-14 sm:py-20">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
            {copy.stats.map((stat) => (
              <AnswerCard as="li" key={stat.title} className="flex flex-col p-6 sm:p-7">
                {stat.icon && <IconBadge icon={stat.icon} tone="soft" />}
                <p className="mt-8 flex items-end text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-rpk-ink tabular-nums sm:text-[38px] xl:min-h-[2.1em]">
                  {stat.value}
                </p>
                <h2 className="mt-4 text-[17px] leading-[1.3] font-bold text-rpk-ink">
                  {stat.title}
                </h2>
                <p className="mt-2 text-[15px] leading-[1.55] text-rpk-slate">{stat.body}</p>
              </AnswerCard>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="sla-credits" className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeader
            id="sla-credits"
            question={THREAD_COPY.sla.creditsQuestion}
            title={copy.credits.title}
            lede={copy.credits.lede}
          />
          <AnswerCard className="mt-10 overflow-hidden ring-1 ring-rpk-mist sm:mt-12">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <caption className="sr-only">{copy.credits.title}</caption>
                <thead>
                  <tr className="bg-rpk-paper">
                    <th
                      scope="col"
                      className="px-6 py-4 font-rpk-mono text-[12px] font-normal tracking-[0.08em] text-rpk-slate uppercase sm:px-8"
                    >
                      {uptimeLabel}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 font-rpk-mono text-[12px] font-normal tracking-[0.08em] text-rpk-slate uppercase sm:px-8"
                    >
                      {creditLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.credits.rows.map(([uptime, credit]) => {
                    const percent = Number(/(\d+)%/.exec(credit)?.[1] ?? 0);
                    return (
                      <tr key={uptime} className="border-t border-rpk-mist">
                        <th
                          scope="row"
                          className="px-6 py-6 font-rpk-mono text-[15px] font-medium whitespace-nowrap text-rpk-ink tabular-nums sm:px-8 sm:text-[16px]"
                        >
                          {uptime}
                        </th>
                        <td className="px-6 py-6 sm:px-8">
                          <div className="flex items-center gap-5">
                            <span className="text-[16px] font-semibold whitespace-nowrap text-rpk-ink">
                              {credit}
                            </span>
                            <span
                              aria-hidden="true"
                              className="hidden h-3 flex-1 rounded-full bg-rpk-paper ring-1 ring-rpk-mist ring-inset sm:block"
                            >
                              <span
                                className={cx("block h-full bg-rpk-signal", SHAPE.answer)}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AnswerCard>
        </Container>
      </section>
    </>
  );
}
