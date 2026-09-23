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
  type AppStats,
} from "@/lib/apps.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const PLATFORM_LABEL = { ios: "آیفون (iOS)", android: "اندروید", windows: "ویندوز" } as const;

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
};

export default function AppsSection() {
  const list = useServerFn(adminListApps);
  const save = useServerFn(adminSaveApp);
  const remove = useServerFn(adminDeleteApp);
  const [apps, setApps] = useState<AppDto[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [form, setForm] = useState<AppInput | null>(null);
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
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">برنامه‌ها و دانلود</h1>
          <p className="text-sm text-muted-foreground">
            لینک دانلود هر برنامه را تنظیم کنید؛ کلیک‌ها خودکار شمرده می‌شوند.
          </p>
        </div>
        <Button onClick={() => setForm({ ...empty, sortOrder: apps.length + 1 })} className="gap-1">
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
                </div>
                <div className="text-xs text-muted-foreground">
                  {PLATFORM_LABEL[a.platform]} · نسخه {a.version || "—"}
                </div>
                <div dir="ltr" className="mt-1 truncate text-start text-xs text-muted-foreground">
                  {a.downloadUrl || "لینک تنظیم نشده"}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setForm({ ...a })} className="gap-1">
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
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>لینک دانلود (App Store / Google Play / فایل نصب)</Label>
              <Input dir="ltr" value={form.downloadUrl} onChange={(e) => set("downloadUrl", e.target.value)} placeholder="https://..." />
            </div>
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
              <Label>نمایش در سایت</Label>
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
