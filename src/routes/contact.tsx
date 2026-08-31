import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { buildPageMeta, buildBreadcrumbJsonLd } from "@/lib/seo-meta";
import { submitContactMessage } from "@/lib/contact.functions";
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

  const contactInfo = [
    { icon: Mail, label: "ایمیل", value: settings.brand.email },
    { icon: Phone, label: "تلفن", value: settings.brand.phone },
    { icon: MapPin, label: "آدرس", value: settings.brand.address },
  ].filter((c) => c.value && c.value.trim().length > 0);

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

    setSending(true);
    try {
      await submitContactMessage({ data: form });
      toast.success("پیام شما با موفقیت ارسال شد.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
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
      ...(settings.brand.email || settings.brand.phone
        ? {
            mainEntity: {
              "@type": "Organization",
              name: settings.brand.name,
              ...(settings.brand.email ? { email: settings.brand.email } : {}),
              ...(settings.brand.phone ? { telephone: settings.brand.phone } : {}),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
