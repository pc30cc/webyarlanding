import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Phone, MapPin, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { submitContactMessage } from "@/lib/contact.functions";
import { getCaptchaChallenge } from "@/lib/captcha.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const [settings, seoOverride] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/contact" } }),
    ]);
    return { settings, seoOverride };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/contact",
      override: loaderData.seoOverride,
      fallbackTitle: "تماس با ما | وب‌یار",
      fallbackDescription: "سوالی دارید؟ ما آماده پاسخ‌گویی هستیم. با تیم وب‌یار در ارتباط باشید.",
    });
  },
  component: ContactPage,
});

function ContactPage() {
  const { settings } = Route.useLoaderData();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const captchaFn = useServerFn(getCaptchaChallenge);
  const queryClient = useQueryClient();
  const { data: captcha } = useQuery({
    queryKey: ["contact-captcha"],
    queryFn: () => captchaFn(),
    staleTime: 0,
  });

  const contactInfo = [
    { icon: Phone, label: "تلفن", value: settings.brand.phone },
    { icon: MapPin, label: "آدرس", value: settings.brand.address },
  ].filter((c) => c.value && c.value.trim().length > 0);

  function refreshCaptcha() {
    setCaptchaAnswer("");
    queryClient.invalidateQueries({ queryKey: ["contact-captcha"] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("نام باید حداقل ۲ کاراکتر باشد");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("ایمیل معتبر نیست");
      return;
    }
    if (form.subject.trim().length < 2) {
      toast.error("موضوع الزامی است");
      return;
    }
    if (form.message.trim().length < 5) {
      toast.error("پیام باید حداقل ۵ کاراکتر باشد");
      return;
    }
    if (!captcha || !captchaAnswer.trim()) {
      toast.error("لطفاً پاسخ کد امنیتی را وارد کنید");
      return;
    }

    setSending(true);
    try {
      await submitContactMessage({
        data: { ...form, captchaToken: captcha.token, captchaAnswer },
      });
      toast.success("پیام شما با موفقیت ارسال شد.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      refreshCaptcha();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.",
      );
      refreshCaptcha();
    } finally {
      setSending(false);
    }
  }

  const base = (settings.brand.siteUrl || "").replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: `تماس با ${settings.brand.name}`,
      url: base ? `${base}/contact` : undefined,
      ...(settings.brand.phone
        ? {
            mainEntity: {
              "@type": "Organization",
              name: settings.brand.name,
              telephone: settings.brand.phone,
            },
          }
        : {}),
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "تماس با ما", path: "/contact" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />
      <div className="container-page max-w-5xl py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="mb-4 text-3xl font-extrabold text-foreground sm:text-5xl">تماس با ما</h1>
          <p className="text-base text-muted-foreground">سوالی دارید؟ ما آماده پاسخ‌گویی هستیم</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">نام و نام خانوادگی</Label>
                  <Input
                    className="mt-1"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">ایمیل</Label>
                  <Input
                    type="email"
                    className="mt-1"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">موضوع</Label>
                <Input
                  className="mt-1"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">پیام</Label>
                <Textarea
                  className="mt-1"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  کد امنیتی: حاصل جمع زیر چند می‌شود؟
                </Label>
                <div className="mt-1 flex items-center gap-3">
                  <div
                    dir="ltr"
                    className="flex h-11 min-w-20 items-center justify-center rounded-md border border-border bg-muted px-4 text-lg font-bold tracking-wider text-foreground"
                  >
                    {captcha ? captcha.question : "…"}
                  </div>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="پاسخ"
                    className="max-w-32"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={sending} className="h-11 w-full">
                <Send className="me-2 h-4 w-4" />
                {sending ? "در حال ارسال..." : "ارسال پیام"}
              </Button>
            </form>
          </div>

          <div className="space-y-4 md:col-span-2">
            {contactInfo.map((c) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{c.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
