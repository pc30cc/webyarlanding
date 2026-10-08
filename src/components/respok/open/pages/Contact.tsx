import { useEffect, useRef } from "react";
import { Check, RefreshCw } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { RespokLogo } from "../../RespokLogo";
import { useContent } from "../../content";
import { getContactContent } from "../../content/contact";
import { useContactForm, type ContactField } from "../../shared/contact";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import type { ContactPageData } from "../../types";
import { OPEN_COPY } from "../copy";
import { ActionLink, Card, ChapterHero, Container, CornerDot, Dot, Eyebrow, Field } from "../ui";
import { buttonClass, cx, inputClass, textLinkClass } from "../tokens";

const FIELD_ORDER: ContactField[] = ["name", "email", "subject", "message", "answer"];

export function ContactPage(_: ContactPageData) {
  const { settings, brand, siteUrl } = useRespok();
  const copy = useContent(getContactContent);
  const form = useContactForm();
  const focusFirstError = useRef(false);

  // After a submit that fails validation, move focus to the first invalid field.
  useEffect(() => {
    if (!focusFirstError.current) return;
    focusFirstError.current = false;
    const first = FIELD_ORDER.find((field) => form.errors[field]);
    if (first) document.getElementById(`c-${first}`)?.focus();
  }, [form.errors]);
  const email = settings.brand.email?.trim() || "";
  const phone = settings.brand.phone?.trim() || "";
  const address = settings.brand.address?.trim() || "";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: `Contact ${brand}`,
      url: siteUrl ? `${siteUrl}/contact` : undefined,
      ...(email || phone
        ? {
            mainEntity: {
              "@type": "Organization",
              name: brand,
              ...(email ? { email } : {}),
              ...(phone ? { telephone: phone } : {}),
            },
          }
        : {}),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: copy.title, path: "/contact" },
    ]),
  ];

  /** aria wiring for one control. */
  const a11y = (field: ContactField, extra?: string) => {
    const described = [form.errors[field] ? `c-${field}-error` : "", extra ?? ""]
      .filter(Boolean)
      .join(" ");
    return {
      id: `c-${field}`,
      name: field,
      "aria-invalid": form.errors[field] ? true : undefined,
      "aria-describedby": described || undefined,
      "aria-required": true,
      value: form.values[field],
    } as const;
  };

  const details = [
    email ? { label: copy.cards.email, value: email, href: `mailto:${email}`, ltr: false } : null,
    phone
      ? {
          label: copy.cards.phone,
          value: phone,
          href: `tel:${phone.replace(/[^\d+]/g, "")}`,
          ltr: true,
        }
      : null,
    address ? { label: copy.cards.address, value: address, href: "", ltr: false } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <>
      <JsonLd data={jsonLd} />
      <ChapterHero
        running={`${brand} · ${copy.eyebrow}`}
        path="/contact"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
        className="lg:pb-28"
        contentClassName="lg:max-w-[38%]"
      />

      <Container className="relative pb-24 sm:pb-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* The form is the chat panel: square corner at the bottom-right, the dot just outside. */}
          <div className="relative -mt-10 mr-6 min-w-0 sm:-mt-14 sm:mr-8 lg:order-2 lg:col-span-7 lg:col-start-6 lg:-mt-72">
            <div className="rpk-o-grow-br relative">
              <Card size="lg" className="overflow-hidden shadow-rpk-panel">
                <div className="flex items-center gap-3 border-b border-rpk-mist px-6 py-5 sm:px-8">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-rpk-ink"
                  >
                    <RespokLogo
                      concept="open"
                      variant="symbol"
                      colorway="reversed"
                      height={20}
                      title=""
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] leading-[1.25] font-bold">{brand}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[13px] text-rpk-slate">
                      <Dot size={8} className="rpk-o-live" />
                      {OPEN_COPY.contact.panelSub}
                    </span>
                  </span>
                </div>

                <form
                  noValidate
                  onSubmit={(event) => {
                    focusFirstError.current = true;
                    void form.submit(event);
                  }}
                  className="grid gap-6 px-6 py-7 sm:px-8 sm:py-8"
                  aria-labelledby="contact-form-title"
                >
                  <h2 id="contact-form-title" className="sr-only">
                    {copy.title}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field id="c-name" label={copy.form.name} error={form.errors.name}>
                      <input
                        {...a11y("name")}
                        type="text"
                        autoComplete="name"
                        onChange={(e) => form.setField("name", e.target.value)}
                        className={inputClass(!!form.errors.name, "h-[52px]")}
                      />
                    </Field>
                    <Field id="c-email" label={copy.form.email} error={form.errors.email}>
                      <input
                        {...a11y("email")}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        dir="ltr"
                        onChange={(e) => form.setField("email", e.target.value)}
                        className={inputClass(!!form.errors.email, "h-[52px]")}
                      />
                    </Field>
                  </div>
                  <Field id="c-subject" label={copy.form.subject} error={form.errors.subject}>
                    <input
                      {...a11y("subject")}
                      type="text"
                      onChange={(e) => form.setField("subject", e.target.value)}
                      className={inputClass(!!form.errors.subject, "h-[52px]")}
                    />
                  </Field>
                  <Field id="c-message" label={copy.form.message} error={form.errors.message}>
                    <textarea
                      {...a11y("message")}
                      rows={6}
                      placeholder={copy.form.messagePlaceholder}
                      onChange={(e) => form.setField("message", e.target.value)}
                      className={inputClass(
                        !!form.errors.message,
                        "min-h-[160px] resize-y py-3.5 leading-[1.55]",
                      )}
                    />
                  </Field>

                  <Field id="c-answer" label={copy.form.security} error={form.errors.answer}>
                    <div className="flex items-stretch gap-2">
                      <span
                        id="c-question"
                        className="inline-flex min-w-[96px] shrink-0 items-center justify-center rounded-[16px] rounded-br-[4px] bg-rpk-ink px-4 font-rpk-mono text-[16px] tracking-[0.04em] text-white"
                      >
                        {form.captchaQuestion ? (
                          <>
                            {form.captchaQuestion}
                            <span aria-hidden="true">&nbsp;=</span>
                          </>
                        ) : (
                          <span className="text-[13px] text-white/70">
                            {OPEN_COPY.contact.loading}
                          </span>
                        )}
                      </span>
                      <input
                        {...a11y("answer", "c-question")}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        dir="ltr"
                        placeholder={copy.form.answer}
                        onChange={(e) => form.setField("answer", e.target.value)}
                        className={inputClass(!!form.errors.answer, "h-[52px] min-w-0 flex-1")}
                      />
                      <button
                        type="button"
                        onClick={form.refreshCaptcha}
                        aria-label={copy.form.refresh}
                        title={copy.form.refresh}
                        className="grid size-[52px] shrink-0 place-items-center rounded-[16px] rounded-br-[4px] border border-rpk-ink/15 text-rpk-ink transition-colors hover:border-rpk-ink/40 hover:bg-rpk-paper"
                      >
                        <RefreshCw aria-hidden="true" className="size-[18px]" />
                      </button>
                    </div>
                  </Field>

                  <div className="flex flex-col-reverse gap-4 border-t border-rpk-mist pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p
                      role="status"
                      aria-live="polite"
                      className={cx(
                        "text-[15px] leading-[1.5] sm:min-h-6",
                        form.status === "error" && "font-medium text-rpk-signal-deep",
                        form.status === "sent" && "font-semibold text-rpk-ink",
                      )}
                    >
                      {form.message ? (
                        <span className="inline-flex items-start gap-2">
                          {form.status === "sent" ? (
                            <span
                              aria-hidden="true"
                              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rpk-ink text-white"
                            >
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          ) : null}
                          {form.message}
                        </span>
                      ) : null}
                    </p>
                    <button
                      type="submit"
                      disabled={form.sending}
                      className={cx(buttonClass("primary", "paper", "lg"), "w-full sm:w-auto")}
                    >
                      <span>{form.sending ? copy.form.sending : copy.form.submit}</span>
                      <span
                        aria-hidden="true"
                        className={cx(
                          "size-2 rounded-full bg-rpk-ink transition-transform duration-300 ease-rpk-pop group-hover/btn:scale-[1.35]",
                          form.sending && "animate-pulse",
                        )}
                      />
                    </button>
                  </div>
                </form>
              </Card>
              {/* The panel grows out of its corner, then the dot pops (kit motion). */}
              <CornerDot size={22} pop={240} />
            </div>
          </div>

          <div className="min-w-0 lg:order-1 lg:col-span-4 lg:pt-20">
            {details.length > 0 ? (
              <section aria-labelledby="contact-details">
                <h2 id="contact-details" className="border-b-2 border-rpk-ink pb-2">
                  <Eyebrow as="span" index="02">
                    {OPEN_COPY.contact.details}
                  </Eyebrow>
                </h2>
                <dl>
                  {details.map((item) => (
                    <div key={item.label} className="border-b border-rpk-mist py-5">
                      <dt className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                        {item.label}
                      </dt>
                      <dd className="mt-1.5 text-[18px] font-semibold wrap-anywhere text-rpk-ink">
                        {item.href ? (
                          <a
                            href={item.href}
                            dir={item.ltr ? "ltr" : undefined}
                            className={textLinkClass()}
                          >
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <aside aria-labelledby="contact-aside" className="relative mt-12 mr-6">
              <Card tone="ink" className="p-7 sm:p-8">
                <Eyebrow index="03" surface="ink">
                  {OPEN_COPY.contact.support}
                </Eyebrow>
                <h2
                  id="contact-aside"
                  className="mt-4 text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-white"
                >
                  {copy.aside.title}
                </h2>
                <p className="mt-3 text-[16px] leading-[1.6] text-white/72">{copy.aside.body}</p>
                <ActionLink to="/help" variant="primary" className="mt-7">
                  {copy.aside.cta}
                </ActionLink>
              </Card>
              <CornerDot size={16} />
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}
