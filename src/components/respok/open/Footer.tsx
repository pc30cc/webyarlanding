import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { TrustBadge } from "@/components/site/SiteFooter";
import { RespokLogo } from "../RespokLogo";
import { useRespok } from "../shared/context";
import { useRespokFooter } from "../shared/footer";
import { FOOTER_COLUMNS, useSocialLinks } from "../shared/nav";
import { OPEN_COPY } from "./copy";
import { Container, Dot } from "./ui";
import { pad } from "./tokens";

/** Ink footer: the last chapter. A giant cropped wordmark bleeds off the bottom. */
export function OpenFooter() {
  const { brand } = useRespok();
  const footer = useRespokFooter();
  const social = useSocialLinks();

  return (
    <footer
      aria-label={OPEN_COPY.footer.label}
      className="relative isolate overflow-hidden border-t border-rpk-ink-line bg-rpk-ink text-white"
    >
      <Container className="relative pt-16 pb-10 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Link
              to="/"
              aria-label={OPEN_COPY.home(brand)}
              className="-m-1 inline-flex rounded-[10px] p-1"
            >
              <RespokLogo concept="open" colorway="reversed" height={34} title="" />
            </Link>
            <p className="mt-6 max-w-[30ch] text-[22px] leading-[1.3] font-bold tracking-[-0.01em] text-white sm:text-[26px]">
              {OPEN_COPY.tagline}
            </p>
            {footer.email || footer.phone ? (
              <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {footer.email ? (
                  <div>
                    <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
                      {OPEN_COPY.footer.email}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${footer.email}`}
                        className="rounded-[4px] text-[16px] font-medium text-white underline decoration-white/30 underline-offset-[5px] transition-colors hover:decoration-rpk-signal"
                      >
                        {footer.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {footer.phone ? (
                  <div>
                    <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
                      {OPEN_COPY.footer.phone}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`tel:${footer.phone.replace(/[^\d+]/g, "")}`}
                        dir="ltr"
                        className="rounded-[4px] text-[16px] font-medium text-white underline decoration-white/30 underline-offset-[5px] transition-colors hover:decoration-rpk-signal"
                      >
                        {footer.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7">
            {FOOTER_COLUMNS.map((column, index) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="border-b border-rpk-ink-line pb-3 font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
                  <span className="text-rpk-signal">{pad(index + 1)}</span>
                  <span aria-hidden="true"> · </span>
                  {column.title}
                </h2>
                <ul className="mt-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group/f flex min-h-11 items-center gap-2 rounded-[6px] text-[15px] text-white/75 transition-colors hover:text-white"
                      >
                        <Dot
                          size={6}
                          className="-ml-3.5 scale-0 transition-transform duration-300 ease-rpk-pop group-hover/f:ml-0 group-hover/f:scale-100"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {social.length > 0 ? (
          <div className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rpk-ink-line pt-6">
            <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
              {OPEN_COPY.footer.follow}
            </span>
            <ul className="flex flex-wrap gap-2">
              {social.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={OPEN_COPY.footer.social(item.name)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-[14px] rounded-br-[4px] border border-white/15 px-4 text-[14px] font-medium text-white/85 transition-colors hover:border-white/50 hover:text-white"
                  >
                    {item.name}
                    <ArrowUpRight aria-hidden="true" className="size-3.5 text-white/60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {footer.trustBadgeHtml ? (
          <div className="mt-10 flex justify-start">
            <div className="rounded-[20px] rounded-br-[6px] bg-white p-3">
              <TrustBadge html={footer.trustBadgeHtml} />
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 border-t border-rpk-ink-line pt-6 font-rpk-mono text-[12px] tracking-[0.04em] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.copyright}</p>
          <a
            href="#top"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-[6px] uppercase transition-colors hover:text-white sm:self-auto"
          >
            <Dot size={7} />
            {OPEN_COPY.footer.top}
          </a>
        </div>
      </Container>

      {/* Giant cropped wordmark, like the bottom of a book cover. */}
      <div aria-hidden="true" className="pointer-events-none relative -mb-[7vw] select-none">
        <Container>
          <RespokLogo
            concept="open"
            variant="wordmark"
            colorway="mono"
            title=""
            width="100%"
            className="block text-white/[0.07]"
          />
        </Container>
      </div>
    </footer>
  );
}
