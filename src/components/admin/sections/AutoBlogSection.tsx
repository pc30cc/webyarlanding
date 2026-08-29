import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  getAutoblogSettings,
  saveAutoblogSettings,
  runAutoblogNow,
  listAutoblogRuns,
} from "@/lib/autoblog.functions";
import { listCategories } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface FormState {
  enabled: boolean;
  runHours: number[];
  withImage: boolean;
  masterPrompt: string;
  topicPool: string;
  categoryId: string | null;
  author: string;
  publishStatus: "published" | "draft";
}

export default function AutoBlogSection() {
  const getFn = useServerFn(getAutoblogSettings);
  const saveFn = useServerFn(saveAutoblogSettings);
  const runFn = useServerFn(runAutoblogNow);
  const runsFn = useServerFn(listAutoblogRuns);
  const categoriesFn = useServerFn(listCategories);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["autoblog-settings"], queryFn: () => getFn() });
  const { data: runs, isLoading: runsLoading } = useQuery({ queryKey: ["autoblog-runs"], queryFn: () => runsFn() });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesFn() });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        enabled: data.enabled,
        runHours: data.runHours,
        withImage: data.withImage,
        masterPrompt: data.masterPrompt,
        topicPool: data.topicPool.join("\n"),
        categoryId: data.categoryId,
        author: data.author,
        publishStatus: data.publishStatus,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormState) =>
      saveFn({
        data: {
          ...payload,
          topicPool: payload.topicPool
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("تنظیمات تولید خودکار ذخیره شد");
      qc.invalidateQueries({ queryKey: ["autoblog-settings"] });
    },
    onError: () => toast.error("خطا در ذخیره تنظیمات"),
  });

  const runMutation = useMutation({
    mutationFn: () => runFn(),
    onSuccess: (res) => {
      if (res.ok) toast.success("اجرای دستی با موفقیت انجام شد");
      else toast.error(res.error || "اجرای دستی ناموفق بود");
      qc.invalidateQueries({ queryKey: ["autoblog-runs"] });
      qc.invalidateQueries({ queryKey: ["autoblog-settings"] });
    },
    onError: () => toast.error("خطا در اجرای دستی"),
  });

  const toggleHour = (h: number) => {
    if (!form) return;
    setForm({
      ...form,
      runHours: form.runHours.includes(h) ? form.runHours.filter((x) => x !== h) : [...form.runHours, h].sort((a, b) => a - b),
    });
  };

  if (isLoading || !form) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تولید خودکار مقاله</h1>
        <p className="text-sm text-muted-foreground">زمان‌بندی و تنظیمات تولید هوشمند مقالات وبلاگ</p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm max-w-3xl">
        <div className="flex items-center justify-between">
          <Label>فعال‌سازی تولید خودکار</Label>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>ساعت‌های اجرا (به وقت جهانی UTC)</Label>
          <div className="flex flex-wrap gap-2">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleHour(h)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  form.runHours.includes(h) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>تولید تصویر کاور همراه مقاله</Label>
          <Switch checked={form.withImage} onCheckedChange={(v) => setForm({ ...form, withImage: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>دسته‌بندی</Label>
            <Select value={form.categoryId ?? "none"} onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون دسته‌بندی</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>وضعیت انتشار</Label>
            <Select value={form.publishStatus} onValueChange={(v) => setForm({ ...form, publishStatus: v as "published" | "draft" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">منتشرشده</SelectItem>
                <SelectItem value="draft">پیش‌نویس</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>نویسنده</Label>
          <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>پرامپت اصلی</Label>
          <Textarea rows={3} value={form.masterPrompt} onChange={(e) => setForm({ ...form, masterPrompt: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>موضوعات پیشنهادی (هر خط یک موضوع)</Label>
          <Textarea rows={5} value={form.topicPool} onChange={(e) => setForm({ ...form, topicPool: e.target.value })} />
        </div>

        <div className="flex gap-3">
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)} className="gap-2">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره تنظیمات
          </Button>
          <Button variant="outline" disabled={runMutation.isPending} onClick={() => runMutation.mutate()} className="gap-2">
            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            اجرای دستی الان
          </Button>
        </div>
        {data?.lastRunAt && (
          <p className="text-xs text-muted-foreground">
            آخرین اجرا: {new Date(data.lastRunAt).toLocaleString("fa-IR")} — تعداد کل تولیدشده: {data.totalGenerated}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">تاریخچه اجراها</h2>
        {runsLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !runs || runs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">هنوز اجرایی ثبت نشده است</p>
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                <div className="flex items-center gap-2">
                  {run.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : run.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-foreground">{run.triggerSource === "manual" ? "دستی" : "زمان‌بندی‌شده"}</span>
                  <Badge variant="outline">{run.status}</Badge>
                  {run.error && <span className="text-xs text-destructive">{run.error.slice(0, 80)}</span>}
                </div>
                <span dir="ltr" className="text-xs text-muted-foreground">{new Date(run.startedAt).toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
