import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminDeleteApp,
  adminListApps,
  adminSaveApp,
  type AppDto,
  type AppInput,
  type AppLocaleOverride,
  type AppLocaleOverrides,
  type AppStats,
} from "@/lib/apps.functions";
import { fetchSettings } from "@/lib/settings.functions";
import { getActiveLocales, getDefaultLocale, type SiteSettings } from "@/lib/settings";
import { LOCALES, LOCALE_INFO, withLocalePrefix, type Locale } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const PLATFORM_LABEL = { ios: "آیفون (iOS)", android: "اندروید", windows: "ویندوز", mac: "مک (macOS)" } as const;

const empty: AppInput = {
  slug: "",
  platform: "ios",
  name: "",
  subtitle: "",
  iconUrl: "",
  shortDesc: "",
  description: "",
  features: [],
  screenshots: [],
  version: "",
  size: "",
  minOs: "",
  downloadUrl: "",
  sortOrder: 0,
  enabled: true,
  downloadUrlEn: "",
  enabledEn: true,
  locales: {},
};

const NO_OVERRIDE: AppLocaleOverride = { downloadUrl: "", enabled: true };

/** نسخه زبانی که مقدار واقعی دارد (لینک جدا یا خاموش) */
const hasOverride = (entry: AppLocaleOverride | undefined) =>
  !!entry && (!!entry.downloadUrl.trim() || !entry.enabled);

/**
 * نسخه انگلیسی قدیمی (apps_en) با معنای قبلی‌اش: لینک خالی = بدون لینک («به‌زودی») و نمایش
 * مستقل از کلید «نمایش در سایت». تا فیلدهایش ویرایش نشود، ذخیره آن را همان‌طور نگه می‌دارد.
 */
const isLegacy = (entry: AppLocaleOverride | undefined) => entry?.legacy === true;

/**
 * زبان‌هایی که برای یک برنامه فیلد جدا دارند: هر زبان فعال غیرپیش‌فرض، نسخه قدیمی هر زبان
 * فعال (حتی زبان پیش‌فرض، که صفحاتش از آن پیروی می‌کنند)، به‌علاوه هر زبانی که از قبل مقدار
 * ذخیره‌شده دارد تا دیده و ویرایش شود.
 */
function overrideLocales(
  settings: SiteSettings | null,
  locales: AppInput["locales"],
): Locale[] {
  const active = settings ? getActiveLocales(settings) : [];
  const fallback = settings ? getDefaultLocale(settings) : "fa";
  return LOCALES.filter((locale) => {
    const entry = locales?.[locale];
    return (
      (active.includes(locale) && (locale !== fallback || isLegacy(entry))) || hasOverride(entry)
    );
  });
}

export default function AppsSection() {
  const list = useServerFn(adminListApps);
  const save = useServerFn(adminSaveApp);
  const remove = useServerFn(adminDeleteApp);
  const loadSettingsFn = useServerFn(fetchSettings);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [apps, setApps] = useState<AppDto[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [form, setForm] = useState<AppInput | null>(null);
  // زبان‌هایی که هنگام باز شدن فرم فیلد داشتند؛ با پاک کردن لینک، فیلدشان وسط ویرایش پنهان نشود
  const [pinnedLocales, setPinnedLocales] = useState<Locale[]>([]);
  // نسخه‌های قدیمی هنگام باز شدن فرم، برای بازگرداندن اگر مدیر از تبدیلشان منصرف شود
  const [openedLegacy, setOpenedLegacy] = useState<AppLocaleOverrides>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await list();
      setApps(r.apps);
      setStats(r.stats);
    } catch {
      toast.error("خطا در دریافت برنامه‌ها");
    }
  }
  useEffect(() => {
    void load();
    loadSettingsFn()
      .then(setSettings)
      .catch(() => toast.error("خطا در دریافت زبان‌های سایت"));
  }, []);

  const defaultLocale = settings ? getDefaultLocale(settings) : "fa";
  const activeLocales = settings ? getActiveLocales(settings) : [];
  const localeLabel = (locale: Locale) =>
    LOCALE_INFO[locale].adminName +
    (locale === defaultLocale
      ? " (زبان پیش‌فرض)"
      : activeLocales.includes(locale)
        ? ""
        : " (غیرفعال)");

  async function onSave() {
    if (!form) return;
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("ذخیره شد");
      setForm(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("این برنامه و آمار کلیک آن حذف شود؟")) return;
    await remove({ data: { id } });
    toast.success("حذف شد");
    await load();
  }

  const maxDay = Math.max(1, ...(stats?.daily.map((d) => d.count) ?? [1]));
  const set = <K extends keyof AppInput>(k: K, v: AppInput[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const openForm = (next: AppInput) => {
    setPinnedLocales(overrideLocales(settings, next.locales));
    setOpenedLegacy(
      Object.fromEntries(
        Object.entries(next.locales ?? {}).filter(([, entry]) => isLegacy(entry)),
      ) as AppLocaleOverrides,
    );
    setForm(next);
  };
  const formLocales = form
    ? LOCALES.filter(
        (locale) =>
          pinnedLocales.includes(locale) ||
          overrideLocales(settings, form.locales).includes(locale),
      )
    : [];
  // ویرایش نسخه قدیمی آن را به قاعده جدید تبدیل می‌کند (علامت legacy برداشته می‌شود)
  const setLocale = (locale: Locale, patch: Partial<AppLocaleOverride>) =>
    setForm((f) => {
      if (!f) return f;
      const { legacy: _legacy, ...current } = f.locales?.[locale] ?? NO_OVERRIDE;
      return { ...f, locales: { ...f.locales, [locale]: { ...current, ...patch } } };
    });
  const restoreLegacy = (locale: Locale) =>
    setForm((f) => {
      const entry = openedLegacy[locale];
      return f && entry ? { ...f, locales: { ...f.locales, [locale]: entry } } : f;
    });
  /** صفحه فهرست دانلود یک زبان (برای توضیح نسخه قدیمی) */
  const downloadPath = (locale: Locale) =>
    withLocalePrefix("/download", locale === defaultLocale ? null : locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">برنامه‌ها و دانلود</h1>
          <p className="text-sm text-muted-foreground">
            لینک دانلود هر برنامه را تنظیم کنید؛ کلیک‌ها خودکار شمرده می‌شوند.
          </p>
        </div>
        <Button onClick={() => openForm({ ...empty, sortOrder: apps.length + 1 })} className="gap-1">
          <Plus className="h-4 w-4" /> برنامه جدید
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">کل کلیک‌های دانلود</div>
              <div className="mt-1 text-3xl font-bold">{stats.total.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>
          {stats.perApp.map((p) => (
            <Card key={p.appId}>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="mt-1 text-2xl font-bold">{p.total.toLocaleString("fa-IR")}</div>
                <div className="text-xs text-muted-foreground">
                  ۳۰ روز اخیر: {p.last30.toLocaleString("fa-IR")}
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle className="text-base">کلیک‌های ۳۰ روز اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-1">
                {stats.daily.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="flex-1 rounded-t bg-primary/70"
                    style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex gap-4 p-5">
              {a.iconUrl ? (
                <img src={a.iconUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold">{a.name}</span>
                  {!a.enabled && (
                    <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">خاموش</span>
                  )}
                  {overrideLocales(settings, a.locales)
                    .filter((locale) => a.locales?.[locale]?.enabled === false)
                    .map((locale) => (
                      <span
                        key={locale}
                        className="rounded bg-muted px-1.5 text-xs text-muted-foreground"
                      >
                        خاموش در {LOCALE_INFO[locale].adminName}
                      </span>
                    ))}
                  {/* نسخه قدیمی روشن، برنامه خاموش در جدول را در همان زبان نمایش می‌دهد */}
                  {!a.enabled &&
                    overrideLocales(settings, a.locales)
                      .filter((locale) => {
                        const entry = a.locales?.[locale];
                        return isLegacy(entry) && entry?.enabled && activeLocales.includes(locale);
                      })
                      .map((locale) => (
                        <span
                          key={`shown-${locale}`}
                          className="rounded bg-muted px-1.5 text-xs text-muted-foreground"
                        >
                          نمایش در {LOCALE_INFO[locale].adminName}
                        </span>
                      ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {PLATFORM_LABEL[a.platform]} · نسخه {a.version || "—"}
                </div>
                <div dir="ltr" className="mt-1 truncate text-start text-xs text-muted-foreground">
                  {a.downloadUrl || "لینک تنظیم نشده"}
                </div>
                {overrideLocales(settings, a.locales).map((locale) => {
                  const entry = a.locales?.[locale];
                  return (
                    <div
                      key={locale}
                      dir="ltr"
                      className="truncate text-start text-xs text-muted-foreground"
                    >
                      {locale.toUpperCase()}:{" "}
                      {entry?.downloadUrl ||
                        (isLegacy(entry) ? "بدون لینک («به‌زودی»)" : "همان لینک زبان پیش‌فرض")}
                      {isLegacy(entry) && " · تنظیم قدیمی"}
                    </div>
                  );
                })}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openForm({ ...a, locales: { ...a.locales } })}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" /> ویرایش
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                  <a
                    href={`/download/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ms-auto inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> صفحه
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {form && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{form.id ? "ویرایش برنامه" : "برنامه جدید"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>نام</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>پلتفرم</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.platform}
                onChange={(e) => set("platform", e.target.value as AppInput["platform"])}
              >
                <option value="ios">آیفون (iOS)</option>
                <option value="android">اندروید</option>
                <option value="windows">ویندوز</option>
                <option value="mac">مک (macOS)</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>لینک دانلود (App Store / Google Play / فایل نصب)</Label>
              <Input dir="ltr" value={form.downloadUrl} onChange={(e) => set("downloadUrl", e.target.value)} placeholder="https://..." />
            </div>
            {formLocales.map((locale) => {
              const entry = form.locales?.[locale] ?? NO_OVERRIDE;
              const legacy = isLegacy(entry);
              const converted = !legacy && isLegacy(openedLegacy[locale]);
              const name = LOCALE_INFO[locale].adminName;
              return (
                <div
                  key={locale}
                  className="space-y-2 rounded-lg border border-border p-3 md:col-span-2"
                >
                  <Label>لینک دانلود نسخه {localeLabel(locale)}</Label>
                  <Input
                    dir="ltr"
                    value={entry.downloadUrl}
                    onChange={(e) => setLocale(locale, { downloadUrl: e.target.value })}
                    placeholder={legacy ? "https://..." : form.downloadUrl || "https://..."}
                  />
                  <p className="text-xs text-muted-foreground">
                    {legacy
                      ? "خالی بماند، برنامه در این نسخه لینک ندارد و «به‌زودی» نمایش داده می‌شود."
                      : "خالی بماند، همان لینک بالا (زبان پیش‌فرض) استفاده می‌شود."}
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={entry.enabled}
                      onCheckedChange={(v) => setLocale(locale, { enabled: v })}
                    />
                    <Label>نمایش در نسخه {name}</Label>
                  </div>
                  {legacy && (
                    <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      تنظیم قدیمی {name}: لینک خالی یعنی بدون لینک، و نمایش در صفحات{" "}
                      <bdi dir="ltr">{downloadPath(locale)}</bdi> فقط به همین کلید بسته است، نه به
                      «نمایش در سایت (همه زبان‌ها)». ذخیره بقیه فیلدها آن را تغییر نمی‌دهد؛ ویرایش
                      لینک یا کلید این بخش آن را به قاعده جدید تبدیل می‌کند.
                    </p>
                  )}
                  {converted && (
                    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      <span>
                        با ذخیره، تنظیم قدیمی {name} به قاعده جدید تبدیل می‌شود: لینک خالی یعنی همان
                        لینک زبان پیش‌فرض، و خاموش کردن «نمایش در سایت (همه زبان‌ها)» برنامه را در{" "}
                        <bdi dir="ltr">{downloadPath(locale)}</bdi> هم پنهان می‌کند.
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => restoreLegacy(locale)}
                      >
                        بازگرداندن تنظیم قدیمی
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="space-y-1.5">
              <Label>زیرعنوان</Label>
              <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>اسلاگ آدرس</Label>
              <Input dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>نسخه</Label>
              <Input dir="ltr" value={form.version} onChange={(e) => set("version", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>حجم</Label>
              <Input value={form.size} onChange={(e) => set("size", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>حداقل سیستم‌عامل</Label>
              <Input value={form.minOs} onChange={(e) => set("minOs", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>آدرس آیکون</Label>
              <Input dir="ltr" value={form.iconUrl} onChange={(e) => set("iconUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>توضیح کوتاه</Label>
              <Textarea rows={2} value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>توضیحات کامل</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>امکانات (هر خط یک مورد)</Label>
              <Textarea rows={6} value={form.features.join("\n")} onChange={(e) => set("features", e.target.value.split("\n"))} />
            </div>
            <div className="space-y-1.5">
              <Label>تصاویر اسکرین‌شات (هر خط یک آدرس؛ خالی = پیش‌نمایش داخلی)</Label>
              <Textarea dir="ltr" rows={6} value={form.screenshots.join("\n")} onChange={(e) => set("screenshots", e.target.value.split("\n"))} />
            </div>
            <div className="space-y-1.5">
              <Label>ترتیب</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
              <Label>نمایش در سایت (همه زبان‌ها)</Label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={onSave} disabled={busy}>ذخیره</Button>
              <Button variant="outline" onClick={() => setForm(null)}>انصراف</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
