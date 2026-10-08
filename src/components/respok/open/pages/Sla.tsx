import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { useContent } from "../../content";
import { getSlaContent } from "../../content/legal";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { Reveal } from "../../shared/Reveal";
import type { LegalPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { Card, ChapterHero, Container, CornerDot, SectionHeader } from "../ui";
import { pad } from "../tokens";

export function SlaPage(_: LegalPageData) {
  const { settings, brand, siteUrl } = useRespok();
  const copy = useContent(getSlaContent);
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
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path="/sla"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
      >
        <h2 className="sr-only">{OPEN_COPY.sla.commitments}</h2>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[28px] rounded-br-[6px] border border-rpk-ink-line bg-rpk-ink-line sm:mt-20 sm:grid-cols-2 xl:grid-cols-4">
          {copy.stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <li
                key={stat.title}
                className="flex min-w-0 flex-col bg-rpk-ink p-6 wrap-anywhere sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-signal">
                    {pad(index + 1)}
                  </span>
                  {Icon ? (
                    <Icon aria-hidden="true" className="size-5 text-white/60" strokeWidth={1.75} />
                  ) : null}
                </div>
                <p className="mt-6 text-[36px] leading-none font-extrabold tracking-[-0.03em] text-white tabular-nums sm:mt-10 sm:text-[40px] xl:text-[34px]">
                  {stat.value}
                </p>
                <h3 className="mt-4 text-[16px] font-semibold text-white">{stat.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-white/65">{stat.body}</p>
              </li>
            );
          })}
        </ul>
      </ChapterHero>

      <Container className="py-16 sm:py-24">
        <SectionHeader
          index="02"
          eyebrow={OPEN_COPY.sla.credits}
          title={copy.credits.title}
          lede={copy.credits.lede}
        />
        <div className="mt-10 grid gap-x-10 sm:mt-12 md:grid-cols-12">
          <Reveal
            effect="corner"
            className="mr-6 min-w-0 sm:mr-8 md:col-span-8 md:col-start-5 lg:col-span-9 lg:col-start-4"
          >
            <div className="relative">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <caption className="sr-only">{copy.credits.title}</caption>
                    <thead>
                      <tr className="border-b-2 border-rpk-ink">
                        {copy.credits.columns.map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className="px-4 pt-6 pb-3 font-rpk-mono text-[12px] font-normal tracking-[0.08em] text-rpk-slate uppercase sm:px-8"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {copy.credits.rows.map(([uptime, credit]) => {
                        const share = Number(/^(\d+)%/.exec(credit)?.[1] ?? 0);
                        return (
                          <tr key={uptime} className="border-b border-rpk-mist last:border-b-0">
                            <th
                              scope="row"
                              className="px-4 py-6 font-rpk-mono text-[14px] font-medium whitespace-nowrap text-rpk-ink sm:px-8 sm:text-[16px]"
                            >
                              {uptime}
                            </th>
                            <td className="px-4 py-6 sm:px-8">
                              <span className="block text-[15px] leading-[1.35] font-semibold text-rpk-ink sm:text-[17px]">
                                {credit}
                              </span>
                              {share > 0 ? (
                                <span
                                  aria-hidden="true"
                                  className="mt-3 block h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-rpk-paper"
                                >
                                  <span
                                    className="block h-full rounded-full bg-rpk-signal"
                                    style={{ width: `${share * 2}%` }}
                                  />
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
              <CornerDot size={20} />
            </div>
          </Reveal>
        </div>
      </Container>
    </>
  );
}
