import { useEffect, useState, type ReactNode } from "react";
import { Check, Mail, MapPin, Phone, RefreshCw, Send, type LucideIcon } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import type { ContactPageData } from "../../types";
import { RespokLogo } from "../../RespokLogo";
import { useContent } from "../../content";
import { getContactContent } from "../../content/contact";
import { useContactForm, type ContactField } from "../../shared/contact";
import { useRespok } from "../../shared/context";
import { JsonLd } from "../../shared/JsonLd";
import { THREAD_COPY } from "../copy";
import { SHAPE, cx } from "../classes";
import {
  ActionButton,
  ActionLink,
  AnswerCard,
  Container,
  Eyebrow,
  FieldError,
  FieldLabel,
  IconBadge,
  PageOpener,
  QuestionCard,
  TextArea,
  TextInput,
  TypingDots,
} from "../ui";

function ContactCard({
  icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <AnswerCard as="li" className="flex items-center gap-4 p-5">
      <IconBadge icon={icon} tone="soft" />
      <div className="min-w-0">
        <Eyebrow className="!text-[12px]">{label}</Eyebrow>
        <div className="mt-1 text-[16px] font-semibold break-words text-rpk-ink">{children}</div>
      </div>
    </AnswerCard>
  );
}

const FIELD_ORDER: ContactField[] = ["name", "email", "subject", "message", "answer"];

const VALUE_LINK =
  "rounded-sm underline decoration-rpk-mist decoration-2 underline-offset-4 transition-colors hover:decoration-rpk-signal";

export function ContactPage({ settings }: ContactPageData) {
  const { brand, siteUrl } = useRespok();
  const copy = useContent(getContactContent);
  const form = useContactForm();
  const email = settings.brand.email?.trim() || "";
  const phone = settings.brand.phone?.trim() || "";
  const address = settings.brand.address?.trim() || "";
  const hasCards = !!(email || phone || address);

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
      { name: "Contact", path: "/contact" },
    ]),
  ];

  // After a failed submit, move focus to the first field that needs attention.
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!attempt) return;
    const first = FIELD_ORDER.find((name) => form.errors[name]);
    if (first) document.getElementById(`contact-${first}`)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const field = (name: ContactField) => {
    const error = form.errors[name];
    return {
      id: `contact-${name}`,
      name,
      value: form.values[name],
      onChange: (event: { target: { value: string } }) => form.setField(name, event.target.value),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `contact-${name}-error` : undefined,
    };
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageOpener question={copy.question} title={copy.title} lede={copy.lede} />

      <section className="bg-rpk-paper py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 xl:gap-14">
            {/* The form is drawn as the Respok chat panel. */}
            <div
              className={cx(
                "overflow-hidden bg-white shadow-rpk-panel",
                "rounded-[24px] rounded-br-[6px]",
              )}
            >
              <div className="flex items-center gap-3 bg-rpk-ink px-5 py-4 text-white sm:px-7 sm:py-5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
                  <RespokLogo concept="thread" variant="symbol" height={20} title="" />
                </span>
                <div className="min-w-0">
                  <p className="text-[16px] leading-[1.25] font-bold">{brand}</p>
                  <p className="mt-1 flex items-center gap-2 text-[13px] leading-[1.3] text-white/80">
                    <span aria-hidden="true" className="size-2 rounded-full bg-rpk-signal" />
                    {THREAD_COPY.contact.panelStatus}
                  </p>
                </div>
              </div>

              <form
                noValidate
                aria-label={THREAD_COPY.contact.form}
                onSubmit={(event) => {
                  void form.submit(event).then(() => setAttempt((n) => n + 1));
                }}
                className="px-5 pt-7 pb-6 sm:px-8 sm:pt-9 sm:pb-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="contact-name">{copy.form.name}</FieldLabel>
                    <TextInput type="text" autoComplete="name" required {...field("name")} />
                    <FieldError id="contact-name-error">{form.errors.name}</FieldError>
                  </div>
                  <div>
                    <FieldLabel htmlFor="contact-email">{copy.form.email}</FieldLabel>
                    <TextInput
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      {...field("email")}
                    />
                    <FieldError id="contact-email-error">{form.errors.email}</FieldError>
                  </div>
                </div>
                <div className="mt-5">
                  <FieldLabel htmlFor="contact-subject">{copy.form.subject}</FieldLabel>
                  <TextInput type="text" required {...field("subject")} />
                  <FieldError id="contact-subject-error">{form.errors.subject}</FieldError>
                </div>
                <div className="mt-5">
                  <FieldLabel htmlFor="contact-message">{copy.form.message}</FieldLabel>
                  <TextArea
                    rows={6}
                    required
                    placeholder={copy.form.messagePlaceholder}
                    {...field("message")}
                  />
                  <FieldError id="contact-message-error">{form.errors.message}</FieldError>
                </div>

                <div className="mt-6 rounded-[22px] bg-rpk-paper p-4 sm:p-5">
                  <FieldLabel htmlFor="contact-answer">{copy.form.security}</FieldLabel>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cx(
                        "inline-flex h-12 min-w-24 items-center justify-center bg-rpk-ink px-5 font-rpk-mono text-[16px] text-white tabular-nums",
                        SHAPE.question,
                      )}
                    >
                      {form.captchaQuestion ? (
                        <span id="contact-captcha" aria-live="polite">
                          {form.captchaQuestion} = ?
                        </span>
                      ) : (
                        <TypingDots tone="white" className="tt-typing" />
                      )}
                    </span>
                    <TextInput
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder={copy.form.answer}
                      className="!w-32"
                      {...field("answer")}
                      aria-describedby={
                        [
                          form.captchaQuestion ? "contact-captcha" : "",
                          form.errors.answer ? "contact-answer-error" : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                    />
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={form.refreshCaptcha}
                      className="!h-12 gap-2 text-rpk-ink"
                    >
                      <RefreshCw aria-hidden="true" className="size-4" strokeWidth={2.4} />
                      {copy.form.refresh}
                    </ActionButton>
                  </div>
                  <FieldError id="contact-answer-error">{form.errors.answer}</FieldError>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div role="status" aria-live="polite" className="min-h-6 sm:flex-1">
                    {form.message &&
                      (form.status === "sent" ? (
                        <p
                          className={cx(
                            "inline-flex items-start gap-2 bg-rpk-ink px-4 py-3 text-[15px] leading-[1.4] font-semibold text-white",
                            SHAPE.questionSoft,
                          )}
                        >
                          <Check
                            aria-hidden="true"
                            strokeWidth={3}
                            className="mt-0.5 size-4 shrink-0 text-rpk-signal"
                          />
                          {form.message}
                        </p>
                      ) : (
                        <p className="text-[15px] leading-[1.45] font-semibold text-rpk-signal-deep">
                          {form.message}
                        </p>
                      ))}
                  </div>
                  <ActionButton
                    type="submit"
                    size="lg"
                    disabled={form.sending}
                    className="w-full sm:w-auto"
                  >
                    {form.sending ? copy.form.sending : copy.form.submit}
                    <Send aria-hidden="true" className="size-4" strokeWidth={2.4} />
                  </ActionButton>
                </div>
              </form>
            </div>

            <div className="space-y-8">
              {hasCards && (
                <div>
                  <Eyebrow className="mb-4">{THREAD_COPY.contact.reachQuestion}</Eyebrow>
                  <ul className="space-y-3">
                    {email && (
                      <ContactCard icon={Mail} label={copy.cards.email}>
                        <a href={`mailto:${email}`} className={VALUE_LINK}>
                          {email}
                        </a>
                      </ContactCard>
                    )}
                    {phone && (
                      <ContactCard icon={Phone} label={copy.cards.phone}>
                        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={VALUE_LINK}>
                          {phone}
                        </a>
                      </ContactCard>
                    )}
                    {address && (
                      <ContactCard icon={MapPin} label={copy.cards.address}>
                        <span className="font-medium">{address}</span>
                      </ContactCard>
                    )}
                  </ul>
                </div>
              )}

              <QuestionCard as="aside" className="p-7 sm:p-8">
                <h2 className="text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-balance">
                  {copy.aside.title}
                </h2>
                <p className="mt-3 text-[16px] leading-[1.6] text-white/75">{copy.aside.body}</p>
                <ActionLink href="/help" arrow className="mt-6">
                  {copy.aside.cta}
                </ActionLink>
              </QuestionCard>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
