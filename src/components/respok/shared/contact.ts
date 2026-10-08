import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCaptchaChallenge } from "@/lib/captcha.functions";
import { submitContactMessage } from "@/lib/contact.functions";
import { latinDigits } from "@/lib/site-i18n";
import { useRespok } from "./context";

export type ContactField = "name" | "email" | "subject" | "message" | "answer";

const EMPTY: Record<ContactField, string> = {
  name: "",
  email: "",
  subject: "",
  message: "",
  answer: "",
};

/**
 * The contact form: same server function, payload and math captcha as the Persian
 * site, with English validation messages shown inline next to each field.
 */
export function useContactForm() {
  const { t } = useRespok();
  const queryClient = useQueryClient();
  const captchaFn = useServerFn(getCaptchaChallenge);
  const captcha = useQuery({
    queryKey: ["contact-captcha"],
    queryFn: () => captchaFn(),
    staleTime: 0,
  });
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>(
    {},
  );
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  function refreshCaptcha() {
    setValues((current) => ({ ...current, answer: "" }));
    void queryClient.invalidateQueries({ queryKey: ["contact-captcha"] });
  }

  function validate(): Partial<Record<ContactField, string>> {
    const next: Partial<Record<ContactField, string>> = {};
    if (values.name.trim().length < 2)
      next.name = "Please enter your name (at least 2 characters).";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
      next.email = "Please enter a valid email address.";
    if (values.subject.trim().length < 2) next.subject = "Please add a subject.";
    if (values.message.trim().length < 5)
      next.message = "Your message needs at least 5 characters.";
    if (!values.answer.trim()) next.answer = "Please answer the security check.";
    return next;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !captcha.data) {
      setStatus("error");
      setMessage(
        captcha.data
          ? "Please check the highlighted fields."
          : "The security check is still loading. Please try again.",
      );
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      await submitContactMessage({
        data: {
          name: values.name.trim(),
          email: values.email.trim(),
          phone: "",
          subject: values.subject.trim(),
          message: values.message.trim(),
          captchaToken: captcha.data.token,
          captchaAnswer: values.answer.trim(),
        },
      });
      setValues(EMPTY);
      setStatus("sent");
      setMessage("Thanks! Your message is on its way. We reply by email.");
      void queryClient.invalidateQueries({ queryKey: ["contact-captcha"] });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.message
          ? t(error.message)
          : "We couldn't send your message. Please try again.",
      );
      refreshCaptcha();
    }
  }

  return {
    values,
    errors,
    status,
    /** Result or error text for a polite live region. */
    message,
    sending: status === "sending",
    /** e.g. "3 + 5"; null while loading. */
    captchaQuestion: captcha.data ? latinDigits(captcha.data.question) : null,
    refreshCaptcha,
    setField(field: ContactField, value: string) {
      setValues((current) => ({ ...current, [field]: value }));
      if (errors[field])
        setErrors((current) => {
          const next = { ...current };
          delete next[field];
          return next;
        });
    },
    submit,
  };
}
