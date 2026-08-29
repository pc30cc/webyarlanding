import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchSettings, updateSettings } from "@/lib/settings.functions";
import type { SiteSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GeneralSection() {
  const fetchFn = useServerFn(fetchSettings);
  const updateFn = useServerFn(updateSettings);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => fetchFn() });
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: SiteSettings) => updateFn({ data: payload }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("خطا در ذخیره تنظیمات"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تنظیمات عمومی</h1>
        <p className="text-sm text-muted-foreground">اطلاعات برند، تماس و شبکه‌های اجتماعی سایت</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="flex flex-col gap-6"
      >
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">برند</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="نام سایت">
              <Input value={form.brand.name} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, name: e.target.value } }))} />
            </Field>
            <Field label="شعار">
              <Input value={form.brand.tagline} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, tagline: e.target.value } }))} />
            </Field>
            <Field label="آدرس لوگو">
              <Input dir="ltr" value={form.brand.logoUrl} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, logoUrl: e.target.value } }))} />
            </Field>
            <Field label="آدرس فاوآیکون">
              <Input dir="ltr" value={form.brand.faviconUrl} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, faviconUrl: e.target.value } }))} />
            </Field>
            <Field label="آدرس سایت">
              <Input dir="ltr" value={form.brand.siteUrl} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, siteUrl: e.target.value } }))} />
            </Field>
            <Field label="تلفن">
              <Input dir="ltr" value={form.brand.phone} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, phone: e.target.value } }))} />
            </Field>
            <Field label="ایمیل">
              <Input dir="ltr" value={form.brand.email} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, email: e.target.value } }))} />
            </Field>
            <Field label="آدرس">
              <Input value={form.brand.address} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, address: e.target.value } }))} />
            </Field>
            <Field label="متن کپی‌رایت" full>
              <Input value={form.brand.copyright} onChange={(e) => setForm((f) => ({ ...f, brand: { ...f.brand, copyright: e.target.value } }))} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">شبکه‌های اجتماعی</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(Object.keys(form.social) as (keyof typeof form.social)[]).map((key) => (
              <Field key={key} label={socialLabels[key]}>
                <Input
                  dir="ltr"
                  value={form.social[key]}
                  onChange={(e) => setForm((f) => ({ ...f, social: { ...f.social, [key]: e.target.value } }))}
                />
              </Field>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">تحلیل و اسکریپت‌ها</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label="شناسه گوگل آنالیتیکس">
              <Input dir="ltr" value={form.analytics.googleAnalyticsId} onChange={(e) => setForm((f) => ({ ...f, analytics: { ...f.analytics, googleAnalyticsId: e.target.value } }))} />
            </Field>
            <Field label="اسکریپت‌های head">
              <Textarea dir="ltr" rows={3} value={form.analytics.headScripts} onChange={(e) => setForm((f) => ({ ...f, analytics: { ...f.analytics, headScripts: e.target.value } }))} />
            </Field>
            <Field label="اسکریپت‌های body">
              <Textarea dir="ltr" rows={3} value={form.analytics.bodyScripts} onChange={(e) => setForm((f) => ({ ...f, analytics: { ...f.analytics, bodyScripts: e.target.value } }))} />
            </Field>
          </div>
        </section>

        <div>
          <Button type="submit" disabled={mutation.isPending} className="gap-2">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            ذخیره تغییرات
          </Button>
        </div>
      </form>
    </div>
  );
}

const socialLabels: Record<string, string> = {
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  linkedin: "لینکدین",
  twitter: "توییتر (ایکس)",
  youtube: "یوتیوب",
  whatsapp: "واتس‌اپ",
};

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

