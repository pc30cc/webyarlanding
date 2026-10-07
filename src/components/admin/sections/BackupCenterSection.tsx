import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CloudUpload,
  Download,
  Loader2,
  RotateCcw,
  Trash2,
  CalendarClock,
  Database,
  AlertTriangle,
} from "lucide-react";
import {
  getBackupCenter,
  runManualBackup,
  saveBackupScheduleFn,
  downloadBackupFn,
  restoreBackupFn,
  deleteBackupFn,
} from "@/lib/backups.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const PROVIDER_LABEL: Record<string, string> = { bunny: "بانی سی‌دی‌ان", arvan: "ابر آروان" };

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(value: string): string {
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  return new Date(iso).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function BackupCenterSection() {
  const centerFn = useServerFn(getBackupCenter);
  const runFn = useServerFn(runManualBackup);
  const saveFn = useServerFn(saveBackupScheduleFn);
  const downloadFn = useServerFn(downloadBackupFn);
  const restoreFn = useServerFn(restoreBackupFn);
  const deleteFn = useServerFn(deleteBackupFn);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["backup-center"],
    queryFn: () => centerFn(),
    refetchInterval: (q) => (q.state.data?.runs.some((r) => r.status === "running") ? 4000 : false),
  });

  const [schedule, setSchedule] = useState({
    dailyEnabled: false,
    hourTehran: 3,
    retentionDays: 14,
    keepMin: 3,
  });
  useEffect(() => {
    if (data?.schedule) setSchedule(data.schedule);
  }, [data?.schedule]);

  const [confirm, setConfirm] = useState<{ kind: "restore" | "delete"; id: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["backup-center"] });

  const runMutation = useMutation({
    mutationFn: () => runFn(),
    onSuccess: (run) => {
      toast.success(
        `بک‌آپ ساخته و آپلود شد — ${run.row_count} رکورد، ${formatSize(run.size_bytes)}`,
      );
      refresh();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در ساخت بک‌آپ");
      refresh();
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveFn({ data: schedule }),
    onSuccess: () => {
      toast.success("تنظیمات بک‌آپ روزانه ذخیره شد");
      refresh();
    },
    onError: () => toast.error("خطا در ذخیره تنظیمات"),
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => downloadFn({ data: { id } }),
    onSuccess: ({ filename, base64 }) => {
      const url = URL.createObjectURL(base64ToBlob(base64, "application/gzip"));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "خطا در دانلود"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: (res) => {
      toast.success(`بازیابی انجام شد — ${res.totalInserted} رکورد درج شد`);
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["backup-info"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در بازیابی");
      setConfirm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("نسخه پشتیبان حذف شد");
      setConfirm(null);
      refresh();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف");
      setConfirm(null);
    },
  });

  const noStorage = data && !data.storageProvider;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudUpload className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">بک‌آپ دستی و روزانه روی فضای ذخیره‌سازی</h3>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              <Database className="h-3 w-3" />
              دیتابیس: {data.backend === "postgres" ? "PostgreSQL سلف‌هاست" : "Supabase"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              مقصد: {data.storageProvider ? PROVIDER_LABEL[data.storageProvider] : "متصل نیست"}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        از کل دیتابیس یک فایل فشرده (JSON.gz) ساخته و به‌صورت خصوصی روی همان فضای ذخیره‌سازی که در
        تنظیمات رسانه وصل کرده‌اید آپلود می‌شود. نام فایل‌ها تصادفی و غیرقابل‌حدس است و دانلود فقط
        از همین پنل و با کلید سمت سرور انجام می‌شود.
      </p>

      {error && (
        <p className="text-sm text-destructive">
          خطا در دریافت اطلاعات بک‌آپ — اگر دیتابیس Supabase است، مایگریشن جدول backup_runs باید
          اجرا شده باشد.
        </p>
      )}

      {noStorage && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-foreground">
            هنوز هیچ فضای ذخیره‌سازی وصل نیست. از{" "}
            <Link to="/admin/general" className="font-semibold text-primary underline">
              تنظیمات عمومی ← ذخیره‌سازی رسانه
            </Link>{" "}
            بانی سی‌دی‌ان یا ابر آروان را وصل کنید؛ بک‌آپ‌ها روی همان‌جا ذخیره می‌شوند.
          </p>
        </div>
      )}

      <div>
        <Button
          disabled={runMutation.isPending || !!noStorage || isLoading}
          onClick={() => runMutation.mutate()}
          className="gap-2"
        >
          {runMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="h-4 w-4" />
          )}
          گرفتن بک‌آپ الان
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">بک‌آپ خودکار روزانه</span>
          </div>
          <Switch
            checked={schedule.dailyEnabled}
            onCheckedChange={(v) => setSchedule((s) => ({ ...s, dailyEnabled: v }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>ساعت اجرا (به وقت تهران)</Label>
            <Select
              value={String(schedule.hourTehran)}
              onValueChange={(v) => setSchedule((s) => ({ ...s, hourTehran: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>مدت نگه‌داری (روز، ۰ = همیشه)</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={schedule.retentionDays}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, retentionDays: Number(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>حداقل تعداد نسخه نگه‌داشته‌شده</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={schedule.keepMin}
              onChange={(e) => setSchedule((s) => ({ ...s, keepMin: Number(e.target.value) || 1 }))}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          زمان‌بند داخلی سرور هر ۵ دقیقه بررسی می‌کند؛ اگر سرور سر ساعت خاموش بوده، همان روز بعد از
          روشن شدن بک‌آپ گرفته می‌شود. نسخه‌های قدیمی‌تر از مدت نگه‌داری بعد از هر بک‌آپ روزانه
          خودکار از فضای ذخیره‌سازی حذف می‌شوند.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />}
          ذخیره تنظیمات روزانه
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-foreground">تاریخچه نسخه‌ها</h4>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data?.runs.length ? (
          <p className="text-sm text-muted-foreground">هنوز نسخه‌ای ساخته نشده است.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {data.runs.map((run) => (
              <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {formatDate(run.started_at)}
                    </span>
                    <span className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
                      {run.trigger_source === "daily" ? "روزانه" : "دستی"}
                    </span>
                    {run.status === "success" && (
                      <span className="text-[11px] text-success">موفق</span>
                    )}
                    {run.status === "running" && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> در حال اجرا
                      </span>
                    )}
                    {run.status === "failed" && (
                      <span className="text-[11px] text-destructive">ناموفق</span>
                    )}
                  </div>
                  {run.status === "success" ? (
                    <p className="text-xs text-muted-foreground">
                      {run.row_count} رکورد از {run.table_count} جدول · {formatSize(run.size_bytes)}{" "}
                      · {run.provider ? (PROVIDER_LABEL[run.provider] ?? run.provider) : ""}
                    </p>
                  ) : run.error ? (
                    <p className="break-all text-xs text-destructive">{run.error}</p>
                  ) : null}
                </div>
                <div className="flex gap-1.5">
                  {run.status === "success" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        disabled={downloadMutation.isPending}
                        onClick={() => downloadMutation.mutate(run.id)}
                      >
                        {downloadMutation.isPending && downloadMutation.variables === run.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        دانلود
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        onClick={() => setConfirm({ kind: "restore", id: run.id })}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        بازیابی
                      </Button>
                    </>
                  )}
                  {run.status !== "running" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      aria-label="حذف"
                      onClick={() => setConfirm({ kind: "delete", id: run.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "restore" ? "بازیابی این نسخه" : "حذف این نسخه"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "restore"
                ? "تمام داده‌های فعلی سایت حذف و با داده‌های این نسخه جایگزین می‌شوند. پیشنهاد می‌شود قبلش یک بک‌آپ دستی بگیرید. این عملیات بازگشت‌پذیر نیست."
                : "فایل این نسخه از فضای ذخیره‌سازی و از تاریخچه حذف می‌شود."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={restoreMutation.isPending || deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!confirm) return;
                if (confirm.kind === "restore") restoreMutation.mutate(confirm.id);
                else deleteMutation.mutate(confirm.id);
              }}
            >
              {(restoreMutation.isPending || deleteMutation.isPending) && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              تایید
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
