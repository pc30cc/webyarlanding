import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, KeyRound, Trash2, Send, Bot } from "lucide-react";
import { fetchSettings, updateSettings } from "@/lib/settings.functions";
import { adminGetAiKeysStatus, adminSaveAiKeys } from "@/lib/ai.functions";
import { adminGetMediaKeysStatus, adminSaveMediaKeys } from "@/lib/media.functions";
import {
  adminGetTelegramKeysStatus,
  adminSaveTelegramBotToken,
  adminConnectTelegramWebhook,
  adminGetTelegramWebhookInfo,
} from "@/lib/telegram.functions";
import type { SiteSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <p className="text-sm text-muted-foreground">
          برند، شبکه‌های اجتماعی، هوش مصنوعی، ذخیره‌سازی رسانه و اسکریپت‌های سایت
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="flex flex-col gap-6"
      >
        <Tabs defaultValue="brand">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="brand">برند</TabsTrigger>
            <TabsTrigger value="auth">ورود و ثبت‌نام</TabsTrigger>
            <TabsTrigger value="social">شبکه‌های اجتماعی</TabsTrigger>
            <TabsTrigger value="ai">هوش مصنوعی</TabsTrigger>
            <TabsTrigger value="media">ذخیره‌سازی رسانه</TabsTrigger>
            <TabsTrigger value="telegram">ربات تلگرام</TabsTrigger>
            <TabsTrigger value="analytics">تحلیل و اسکریپت‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="mt-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-foreground">برند</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="نام برند">
                  <Input
                    value={form.brand.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, name: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="شعار / تگ‌لاین">
                  <Input
                    value={form.brand.tagline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, tagline: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="آدرس لوگو">
                  <Input
                    dir="ltr"
                    value={form.brand.logoUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, logoUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="آدرس فاوآیکون">
                  <Input
                    dir="ltr"
                    value={form.brand.faviconUrl}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        brand: { ...f.brand, faviconUrl: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="آدرس سایت">
                  <Input
                    dir="ltr"
                    value={form.brand.siteUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, siteUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="تلفن">
                  <Input
                    dir="ltr"
                    value={form.brand.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, phone: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="ایمیل">
                  <Input
                    dir="ltr"
                    value={form.brand.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, email: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="آدرس">
                  <Input
                    value={form.brand.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, address: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="منطقه زمانی (ساعت نمایش در پنل و اعلان‌های تلگرام)">
                  <Select
                    value={form.brand.timezone}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, brand: { ...f.brand, timezone: v } }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Istanbul">استانبول (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Tehran">تهران (UTC+3:30)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبی (UTC+4)</SelectItem>
                      <SelectItem value="Europe/London">لندن (UTC+0/+1)</SelectItem>
                      <SelectItem value="Europe/Berlin">برلین (UTC+1/+2)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="متن کپی‌رایت" full>
                  <Input
                    value={form.brand.copyright}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        brand: { ...f.brand, copyright: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">تماس تصویری و صوتی</h2>
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer text-xs">نمایش در سایت</Label>
                  <Switch
                    checked={form.videoCall.enabled}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, videoCall: { ...f.videoCall, enabled: v } }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                وقتی خاموش باشد، همه‌ی بخش‌ها، امکانات پلن‌ها، ردیف‌های جدول مقایسه، Endpoint
                مستندات API و متن‌های سئوی مربوط به تماس تصویری/صوتی در کل سایت (صفحه اصلی،
                قیمت‌گذاری، محصولات، درباره ما، مستندات API) پنهان می‌شوند — بدون حذف کد، تا هر وقت
                مجوز لازم را گرفتید دوباره روشنش کنید.
              </p>
            </section>
          </TabsContent>

          <TabsContent value="auth" className="mt-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">دکمه‌های ورود و ثبت‌نام</h2>
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer text-xs">نمایش در سایت</Label>
                  <Switch
                    checked={form.auth.enabled}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, enabled: v } }))
                    }
                  />
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                آدرس اپلیکیشن/پنل کاربری خودتان را وارد کنید — دکمه‌های «ورود» و «شروع رایگان» در
                هدر سایت و صفحات محصولات و قیمت‌گذاری به همین آدرس لینک می‌شوند. اگر خالی بماند، آن
                دکمه نمایش داده نمی‌شود.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="آدرس صفحه ورود">
                  <Input
                    dir="ltr"
                    placeholder="https://app.example.com/login"
                    value={form.auth.loginUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, loginUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="متن دکمه ورود">
                  <Input
                    value={form.auth.loginLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, loginLabel: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="آدرس ثبت‌نام / شروع رایگان">
                  <Input
                    dir="ltr"
                    placeholder="https://app.example.com/signup"
                    value={form.auth.signupUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, signupUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="متن دکمه شروع رایگان">
                  <Input
                    value={form.auth.signupLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, signupLabel: e.target.value } }))
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                تشخیص ورود کاربر (اختیاری)
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                اگر پر شود، سایت هنگام بارگذاری با یک درخواست اعتبارسنجی‌شده وضعیت لاگین کاربر را از
                اپلیکیشن‌تان می‌پرسد؛ اگر لاگین باشد، به‌جای دکمه‌های ورود/ثبت‌نام، «خوش‌آمدید» +
                دکمه پنل + دکمه خروج نمایش داده می‌شود. این نیازمند یک API روی همان دامنه‌ی اپلیکیشن
                است که کوکی نشست را با CORS مناسب برگرداند — اگر پیاده‌سازی نشده یا خالی بماند، سایت
                مثل قبل رفتار می‌کند.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="آدرس بررسی نشست (Session Check API)" full>
                  <Input
                    dir="ltr"
                    placeholder="https://app.example.com/api/session"
                    value={form.auth.sessionCheckUrl}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        auth: { ...f.auth, sessionCheckUrl: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="آدرس خروج از حساب (POST)">
                  <Input
                    dir="ltr"
                    placeholder="https://app.example.com/api/logout"
                    value={form.auth.logoutUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, logoutUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="متن دکمه خروج">
                  <Input
                    value={form.auth.logoutLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, logoutLabel: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="آدرس پنل کاربری">
                  <Input
                    dir="ltr"
                    placeholder="https://app.example.com/dashboard"
                    value={form.auth.panelUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, panelUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="متن دکمه پنل">
                  <Input
                    value={form.auth.panelLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, auth: { ...f.auth, panelLabel: e.target.value } }))
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label>همگام‌سازی پلن‌ها با اپلیکیشن</Label>
                  <span className="text-xs text-muted-foreground">
                    پلن‌های صفحه قیمت‌گذاری مستقیماً از اپلیکیشن خوانده می‌شوند؛ هر تغییری آنجا
                    بدهید، اینجا هم اعمال می‌شود.
                  </span>
                </div>
                <Switch
                  checked={form.plans.enabled}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, plans: { ...f.plans, enabled: v } }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label>نمایش قیمت سالانه</Label>
                  <span className="text-xs text-muted-foreground">
                    خاموش یعنی فقط قیمت ماهانه در صفحه قیمت‌گذاری نمایش داده می‌شود.
                  </span>
                </div>
                <Switch
                  checked={form.plans.showYearly === true}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, plans: { ...f.plans, showYearly: v } }))
                  }
                />
              </div>
              <Field label="آدرس API پلن‌ها">
                <Input
                  dir="ltr"
                  placeholder="https://api.webyar.ai/api/plans"
                  value={form.plans.apiUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plans: { ...f.plans, apiUrl: e.target.value } }))
                  }
                />
              </Field>
            </section>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-foreground">شبکه‌های اجتماعی</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(Object.keys(form.social) as (keyof typeof form.social)[]).map((key) => (
                  <Field key={key} label={socialLabels[key] ?? key}>
                    <Input
                      dir="ltr"
                      value={form.social[key] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, social: { ...f.social, [key]: e.target.value } }))
                      }
                    />
                  </Field>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ai" className="mt-6 flex flex-col gap-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">هوش مصنوعی</h2>
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer text-xs">فعال</Label>
                  <Switch
                    checked={form.ai.enabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, ai: { ...f.ai, enabled: v } }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="سرویس تولید متن مقاله (دستی و خودکار)">
                    <Select
                      value={form.ai.textProvider}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          ai: { ...f.ai, textProvider: v as "openai" | "gemini" },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="سرویس تولید تصویر کاور">
                    <Select
                      value={form.ai.imageProvider}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          ai: { ...f.ai, imageProvider: v as "openai" | "gemini" },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <p className="text-xs text-muted-foreground">
                  تنظیمات دو سرویس کاملاً از هم جدا هستند و هر دو نگه داشته می‌شوند؛ تولید متن و
                  تولید تصویر می‌توانند از دو سرویس متفاوت استفاده کنند.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className={`flex flex-col gap-3 rounded-lg border p-3 ${form.ai.textProvider === "openai" || form.ai.imageProvider === "openai" ? "border-primary/40 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">OpenAI</h3>
                      <div className="flex gap-1">
                        {form.ai.textProvider === "openai" && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            متن
                          </span>
                        )}
                        {form.ai.imageProvider === "openai" && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            تصویر
                          </span>
                        )}
                      </div>
                    </div>
                    <Field label="مدل تولید متن">
                      <Input
                        dir="ltr"
                        placeholder="gpt-4o-mini"
                        value={form.ai.openai.textModel}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            ai: { ...f.ai, openai: { ...f.ai.openai, textModel: e.target.value } },
                          }))
                        }
                      />
                    </Field>
                    <Field label="مدل تولید تصویر">
                      <Input
                        dir="ltr"
                        placeholder="gpt-image-1-mini"
                        value={form.ai.openai.imageModel}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            ai: {
                              ...f.ai,
                              openai: { ...f.ai.openai, imageModel: e.target.value },
                            },
                          }))
                        }
                      />
                    </Field>
                  </div>

                  <div
                    className={`flex flex-col gap-3 rounded-lg border p-3 ${form.ai.textProvider === "gemini" || form.ai.imageProvider === "gemini" ? "border-primary/40 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Google Gemini</h3>
                      <div className="flex gap-1">
                        {form.ai.textProvider === "gemini" && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            متن
                          </span>
                        )}
                        {form.ai.imageProvider === "gemini" && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            تصویر
                          </span>
                        )}
                      </div>
                    </div>
                    <Field label="مدل تولید متن">
                      <Input
                        dir="ltr"
                        placeholder="gemini-3.1-flash-lite"
                        value={form.ai.gemini.textModel}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            ai: { ...f.ai, gemini: { ...f.ai.gemini, textModel: e.target.value } },
                          }))
                        }
                      />
                    </Field>
                    <Field label="مدل تولید تصویر">
                      <Input
                        dir="ltr"
                        placeholder="gemini-3.1-flash-lite-image"
                        value={form.ai.gemini.imageModel}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            ai: {
                              ...f.ai,
                              gemini: { ...f.ai.gemini, imageModel: e.target.value },
                            },
                          }))
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="خلاقیت پاسخ (Temperature ۰ تا ۱)">
                    <Input
                      dir="ltr"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={form.ai.temperature}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          ai: { ...f.ai, temperature: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </Field>
                  <Field label="سبک و لحن نوشتار">
                    <Textarea
                      rows={2}
                      value={form.ai.systemPrompt}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ai: { ...f.ai, systemPrompt: e.target.value } }))
                      }
                    />
                  </Field>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                کلید API این سرویس‌ها را در بخش «کلیدهای API هوش مصنوعی» زیر همین کارت وارد کنید.
              </p>
            </section>

            <AiKeysSection />
          </TabsContent>

          <TabsContent value="media" className="mt-6 flex flex-col gap-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-foreground">ذخیره‌سازی رسانه</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                تصاویری که با هوش مصنوعی تولید می‌شوند (کاور مقالات) در دیتابیس ذخیره نمی‌شوند و
                باید به یک محل ذخیره‌سازی خارجی آپلود شوند. یکی از دو سرویس زیر را وصل کنید.
              </p>
              <Field label="محل ذخیره‌سازی فعال">
                <Select
                  value={form.media.provider}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      media: { ...f.media, provider: v as "none" | "bunny" | "arvan" },
                    }))
                  }
                >
                  <SelectTrigger className="sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">هیچ‌کدام (متصل نیست)</SelectItem>
                    <SelectItem value="bunny">بانی سی‌دی‌ان (Bunny CDN)</SelectItem>
                    <SelectItem value="arvan">ابر آروان (ArvanCloud)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={`flex flex-col gap-3 rounded-lg border p-3 ${form.media.provider === "bunny" ? "border-primary/40 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Bunny CDN</h3>
                    {form.media.provider === "bunny" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        فعال
                      </span>
                    )}
                  </div>
                  <Field label="نام Storage Zone">
                    <Input
                      dir="ltr"
                      placeholder="my-storage-zone"
                      value={form.media.bunny.storageZone}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            bunny: { ...f.media.bunny, storageZone: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="کد ناحیه (اختیاری — خالی = پیش‌فرض)">
                    <Input
                      dir="ltr"
                      placeholder="ny / la / sg / syd / uk"
                      value={form.media.bunny.region}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            bunny: { ...f.media.bunny, region: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="آدرس Pull Zone">
                    <Input
                      dir="ltr"
                      placeholder="https://xxxx.b-cdn.net"
                      value={form.media.bunny.pullZoneUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            bunny: { ...f.media.bunny, pullZoneUrl: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                </div>

                <div
                  className={`flex flex-col gap-3 rounded-lg border p-3 ${form.media.provider === "arvan" ? "border-primary/40 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      ابر آروان (ArvanCloud)
                    </h3>
                    {form.media.provider === "arvan" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        فعال
                      </span>
                    )}
                  </div>
                  <Field label="نام باکت (Bucket)">
                    <Input
                      dir="ltr"
                      placeholder="my-bucket"
                      value={form.media.arvan.bucket}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            arvan: { ...f.media.arvan, bucket: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="آدرس Endpoint">
                    <Input
                      dir="ltr"
                      placeholder="https://s3.ir-thr-at1.arvanstorage.ir"
                      value={form.media.arvan.endpoint}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            arvan: { ...f.media.arvan, endpoint: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="کد ناحیه">
                    <Input
                      dir="ltr"
                      placeholder="ir-thr-at1"
                      value={form.media.arvan.region}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            arvan: { ...f.media.arvan, region: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="آدرس عمومی (اختیاری — خالی = ساخته‌شده از endpoint)">
                    <Input
                      dir="ltr"
                      placeholder="https://my-bucket.s3.ir-thr-at1.arvanstorage.ir"
                      value={form.media.arvan.publicUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          media: {
                            ...f.media,
                            arvan: { ...f.media.arvan, publicUrl: e.target.value },
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                کلید دسترسی این سرویس‌ها را در بخش «کلیدهای اتصال ذخیره‌سازی» زیر همین کارت وارد
                کنید.
              </p>
            </section>

            <MediaKeysSection />
          </TabsContent>

          <TabsContent value="telegram" className="mt-6 flex flex-col gap-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">ربات مدیریتی تلگرام</h2>
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer text-xs">فعال</Label>
                  <Switch
                    checked={form.telegram.enabled}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, telegram: { ...f.telegram, enabled: v } }))
                    }
                  />
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                این ربات از طریق پیام‌رسان تلگرام آمار بازدید، وضعیت مقالات و پیام‌های تماس را نشان
                می‌دهد، امکان تولید مقاله جدید با یک دکمه را فراهم می‌کند و می‌تواند مقالات تازه
                منتشرشده را در کانال تلگرام شما پست کند.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="شناسه کانال تلگرام (برای پست خودکار مقالات)">
                  <Input
                    dir="ltr"
                    placeholder="@your_channel یا -100xxxxxxxxxx"
                    value={form.telegram.channelId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        telegram: { ...f.telegram, channelId: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="شناسه‌های چت ادمین (با کاما جدا کنید)">
                  <Input
                    dir="ltr"
                    placeholder="123456789, 987654321"
                    value={form.telegram.adminChatIds}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        telegram: { ...f.telegram, adminChatIds: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                برای پیدا کردن شناسه چت خودتان، یک پیام به ربات بفرستید؛ اگر شناسه شما هنوز اضافه
                نشده باشد، ربات همان شناسه را برایتان پیام می‌دهد.
              </p>

              {form.telegram.lastChannelPostError && (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  <p className="font-medium text-destructive">
                    آخرین خطای پست در کانال
                    {form.telegram.lastChannelPostErrorAt &&
                      ` · ${new Date(form.telegram.lastChannelPostErrorAt).toLocaleString("fa-IR")}`}
                  </p>
                  <p dir="ltr" className="mt-1 break-all text-muted-foreground">
                    {form.telegram.lastChannelPostError}
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    معمولاً یعنی ربات هنوز به‌عنوان ادمین با دسترسی ارسال پیام به کانال بالا اضافه
                    نشده است.
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    اعلان لحظه‌ای ورود بازدیدکننده جدید
                  </p>
                  <p className="text-xs text-muted-foreground">
                    به همه‌ی شناسه‌های چت ادمین بالا پیام می‌دهد
                  </p>
                </div>
                <Switch
                  checked={form.telegram.notifyOnVisit}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, telegram: { ...f.telegram, notifyOnVisit: v } }))
                  }
                />
              </div>

              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    پست خودکار مقاله جدید در کانال
                  </p>
                  <p className="text-xs text-muted-foreground">
                    وقتی مقاله‌ای (دستی یا خودکار) منتشر می‌شود، در کانال بالا پست می‌شود
                  </p>
                </div>
                <Switch
                  checked={form.telegram.notifyOnPublish}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, telegram: { ...f.telegram, notifyOnPublish: v } }))
                  }
                />
              </div>
            </section>

            <TelegramKeysSection />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-foreground">تحلیل و اسکریپت‌ها</h2>
              <div className="grid grid-cols-1 gap-4">
                <Field label="شناسه گوگل آنالیتیکس">
                  <Input
                    dir="ltr"
                    value={form.analytics.googleAnalyticsId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        analytics: { ...f.analytics, googleAnalyticsId: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="اسکریپت‌های head">
                  <Textarea
                    dir="ltr"
                    rows={3}
                    value={form.analytics.headScripts}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        analytics: { ...f.analytics, headScripts: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="اسکریپت‌های body">
                  <Textarea
                    dir="ltr"
                    rows={3}
                    value={form.analytics.bodyScripts}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        analytics: { ...f.analytics, bodyScripts: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            </section>
          </TabsContent>
        </Tabs>

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

function AiKeysSection() {
  const statusFn = useServerFn(adminGetAiKeysStatus);
  const saveFn = useServerFn(adminSaveAiKeys);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ai-keys-status"], queryFn: () => statusFn() });
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: {
      openaiApiKey?: string;
      geminiApiKey?: string;
      clearOpenai?: boolean;
      clearGemini?: boolean;
    }) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("کلید API ذخیره شد");
      qc.invalidateQueries({ queryKey: ["ai-keys-status"] });
      setOpenaiApiKey("");
      setGeminiApiKey("");
    },
    onError: () => toast.error("خطا در ذخیره کلید API"),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">کلیدهای API هوش مصنوعی</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        این کلیدها مستقیماً و فقط سمت سرور استفاده می‌شوند و هرگز به مرورگر ارسال نمی‌شوند. برای
        تولید مقاله و تصویر بلاگ با هوش مصنوعی، حداقل کلید سرویسی که در بالا انتخاب کرده‌اید را وارد
        کنید.
      </p>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center justify-between">
              <span>کلید API اوپن‌ای‌آی (OpenAI)</span>
              {data?.openaiKeySet && (
                <span dir="ltr" className="text-xs text-success">
                  تنظیم شده · {data.openaiKeyPreview}
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                type="password"
                placeholder={data?.openaiKeySet ? "برای تغییر، کلید جدید وارد کنید" : "sk-..."}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
              />
              {data?.openaiKeySet && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ clearOpenai: true })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!openaiApiKey.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ openaiApiKey })}
              className="w-fit gap-1.5"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              ذخیره کلید اوپن‌ای‌آی
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center justify-between">
              <span>کلید API جمینای (Google Gemini)</span>
              {data?.geminiKeySet && (
                <span dir="ltr" className="text-xs text-success">
                  تنظیم شده · {data.geminiKeyPreview}
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                type="password"
                placeholder={data?.geminiKeySet ? "برای تغییر، کلید جدید وارد کنید" : "AIza..."}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
              {data?.geminiKeySet && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ clearGemini: true })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!geminiApiKey.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ geminiApiKey })}
              className="w-fit gap-1.5"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              ذخیره کلید جمینای
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function MediaKeysSection() {
  const statusFn = useServerFn(adminGetMediaKeysStatus);
  const saveFn = useServerFn(adminSaveMediaKeys);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["media-keys-status"],
    queryFn: () => statusFn(),
  });
  const [bunnyAccessKey, setBunnyAccessKey] = useState("");
  const [arvanAccessKey, setArvanAccessKey] = useState("");
  const [arvanSecretKey, setArvanSecretKey] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: {
      bunnyAccessKey?: string;
      arvanAccessKey?: string;
      arvanSecretKey?: string;
      clearBunny?: boolean;
      clearArvan?: boolean;
    }) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("کلید ذخیره شد");
      qc.invalidateQueries({ queryKey: ["media-keys-status"] });
      setBunnyAccessKey("");
      setArvanAccessKey("");
      setArvanSecretKey("");
    },
    onError: () => toast.error("خطا در ذخیره کلید"),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">کلیدهای اتصال ذخیره‌سازی</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        این کلیدها مستقیماً و فقط سمت سرور استفاده می‌شوند و هرگز به مرورگر ارسال نمی‌شوند.
      </p>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center justify-between">
              <span>کلید دسترسی بانی سی‌دی‌ان (Access Key)</span>
              {data?.bunnyKeySet && (
                <span dir="ltr" className="text-xs text-success">
                  تنظیم شده · {data.bunnyKeyPreview}
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                type="password"
                placeholder={data?.bunnyKeySet ? "برای تغییر، کلید جدید وارد کنید" : "Access Key"}
                value={bunnyAccessKey}
                onChange={(e) => setBunnyAccessKey(e.target.value)}
              />
              {data?.bunnyKeySet && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ clearBunny: true })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!bunnyAccessKey.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ bunnyAccessKey })}
              className="w-fit gap-1.5"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              ذخیره کلید بانی
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center justify-between">
              <span>کلیدهای دسترسی ابر آروان (Access / Secret Key)</span>
              {data?.arvanAccessKeySet && data?.arvanSecretKeySet && (
                <span dir="ltr" className="text-xs text-success">
                  تنظیم شده
                </span>
              )}
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                dir="ltr"
                type="password"
                placeholder={
                  data?.arvanAccessKeySet
                    ? `Access Key تنظیم شده · ${data.arvanAccessKeyPreview}`
                    : "Access Key"
                }
                value={arvanAccessKey}
                onChange={(e) => setArvanAccessKey(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  dir="ltr"
                  type="password"
                  placeholder={
                    data?.arvanSecretKeySet
                      ? `Secret Key تنظیم شده · ${data.arvanSecretKeyPreview}`
                      : "Secret Key"
                  }
                  value={arvanSecretKey}
                  onChange={(e) => setArvanSecretKey(e.target.value)}
                />
                {data?.arvanAccessKeySet && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-destructive"
                    disabled={saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ clearArvan: true })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                (!arvanAccessKey.trim() && !arvanSecretKey.trim()) || saveMutation.isPending
              }
              onClick={() => saveMutation.mutate({ arvanAccessKey, arvanSecretKey })}
              className="w-fit gap-1.5"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              ذخیره کلیدهای آروان
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function TelegramKeysSection() {
  const statusFn = useServerFn(adminGetTelegramKeysStatus);
  const saveFn = useServerFn(adminSaveTelegramBotToken);
  const connectFn = useServerFn(adminConnectTelegramWebhook);
  const webhookInfoFn = useServerFn(adminGetTelegramWebhookInfo);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["telegram-keys-status"],
    queryFn: () => statusFn(),
  });
  const { data: webhookInfo, isLoading: webhookLoading } = useQuery({
    queryKey: ["telegram-webhook-info"],
    queryFn: () => webhookInfoFn(),
    enabled: !!data?.botTokenSet,
  });
  const [botToken, setBotToken] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: { botToken?: string; clearBotToken?: boolean }) =>
      saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("توکن ربات ذخیره شد");
      qc.invalidateQueries({ queryKey: ["telegram-keys-status"] });
      qc.invalidateQueries({ queryKey: ["telegram-webhook-info"] });
      setBotToken("");
    },
    onError: () => toast.error("خطا در ذخیره توکن ربات"),
  });

  const connectMutation = useMutation({
    mutationFn: () => connectFn(),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        qc.invalidateQueries({ queryKey: ["telegram-webhook-info"] });
      } else {
        toast.error(res.message);
      }
    },
    onError: () => toast.error("خطا در اتصال ربات"),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">اتصال ربات تلگرام</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        ابتدا با @BotFather یک ربات بسازید و توکن آن را اینجا وارد کنید، سپس روی «اتصال ربات» بزنید
        تا وبهوک ثبت شود. توکن مستقیماً و فقط سمت سرور استفاده می‌شود.
      </p>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center justify-between">
              <span>توکن ربات (Bot Token)</span>
              {data?.botTokenSet && (
                <span dir="ltr" className="text-xs text-success">
                  تنظیم شده · {data.botTokenPreview}
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                type="password"
                placeholder={
                  data?.botTokenSet ? "برای تغییر، توکن جدید وارد کنید" : "123456:ABC-..."
                }
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              {data?.botTokenSet && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ clearBotToken: true })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!botToken.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate({ botToken })}
                className="w-fit gap-1.5"
              >
                {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                ذخیره توکن
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!data?.botTokenSet || connectMutation.isPending}
                onClick={() => connectMutation.mutate()}
                className="w-fit gap-1.5"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                اتصال ربات (ثبت وبهوک)
              </Button>
            </div>
          </div>

          {data?.botTokenSet && (
            <div className="rounded-lg border border-border p-3 text-xs">
              {webhookLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : webhookInfo?.url ? (
                <div className="flex flex-col gap-1">
                  <span className="text-success">وبهوک متصل است</span>
                  <span dir="ltr" className="break-all text-muted-foreground">
                    {webhookInfo.url}
                  </span>
                  {webhookInfo.last_error_message && (
                    <span className="text-destructive">
                      آخرین خطا: {webhookInfo.last_error_message}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  وبهوک هنوز ثبت نشده — روی «اتصال ربات» بزنید.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
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

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
