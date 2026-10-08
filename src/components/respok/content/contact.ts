import type { ContentFlags } from ".";

export function getContactContent({ brand }: ContentFlags) {
  return {
    question: "Can I talk to a human?",
    eyebrow: "Contact",
    title: "Contact us",
    lede: `Have a question? We're here to help. Send the ${brand} team a message and we'll reply by email.`,
    form: {
      name: "Full name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      messagePlaceholder: "How can we help?",
      security: "Security check: what is the result?",
      answer: "Answer",
      refresh: "New question",
      submit: "Send message",
      sending: "Sending…",
    },
    cards: { email: "Email", phone: "Phone", address: "Address" },
    aside: {
      title: "Looking for help with your account?",
      body: "Our support center has answers about accounts, billing, privacy and account deletion.",
      cta: "Visit support",
    },
  };
}
