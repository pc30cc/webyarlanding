import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  Upload,
  Database,
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import {
  getDatabaseInfo,
  exportBackup,
  importBackup,
  getDestinationDbStatus,
  saveDestinationDbSettings,
  inspectDestinationDatabase,
  backupToDestinationDb,
  restoreFromDestinationDb,
} from "@/lib/backup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BackupSection() {
  const infoFn = useServerFn(getDatabaseInfo);
  const exportFn = useServerFn(exportBackup);
  const importFn = useServerFn(importBackup);
  const qc = useQueryClient();

  const { data: info, isLoading } = useQuery({
    queryKey: ["backup-info"],
    queryFn: () => infoFn(),
  });
  const [pendingRestore, setPendingRestore] = useState<Record<string, unknown[]> | null>(null);

  const exportMutation = useMutation({
    mutationFn: (kind: "json" | "sql") => exportFn().then((res) => ({ kind, res })),
    onSuccess: ({ kind, res }) => {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      if (kind === "json") {
        downloadFile(
          `webyar-backup-${stamp}.json`,
          JSON.stringify({ generatedAt: res.generatedAt, data: res.data }, null, 2),
          "application/json",
        );
      } else {
        downloadFile(`webyar-backup-${stamp}.sql`, res.sql, "application/sql");
      }
      toast.success("فایل نسخه‌پشتیبان دانلود شد");
    },
    onError: () => toast.error("خطا در تهیه نسخه‌پشتیبان"),
  });

  const importMutation = useMutation({
    mutationFn: (data: Record<string, unknown[]>) => importFn({ data: { data } }),
    onSuccess: (res) => {
      toast.success(`بازیابی انجام شد — ${res.totalInserted} رکورد درج شد`);
      qc.invalidateQueries({ queryKey: ["backup-info"] });
      setPendingRestore(null);
    },
    onError: () => toast.error("خطا در بازیابی نسخه‌پشتیبان"),
  });

  const onFileSelected = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed?.data ?? parsed;
      if (!data || typeof data !== "object") throw new Error("invalid");
      setPendingRestore(data);
    } catch {
      toast.error("فایل JSON نامعتبر است");
    }
  };

  const cronUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/autoblog-cron`
      : "/api/public/autoblog-cron";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پشتیبان‌گیری و بازیابی</h1>
        <p className="text-sm text-muted-foreground">
          دانلود نسخه‌پشتیبان کامل دیتابیس یا بازیابی از فایل
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">آمار جدول‌ها</h3>
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {info?.tables.map((t) => (
              <div
                key={t.name}
                className="rounded-lg border border-border bg-background p-2 text-center"
              >
                <p dir="ltr" className="text-xs text-muted-foreground">
                  {t.name}
                </p>
                <p className="font-bold text-foreground">{t.rowCount}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate("json")}
          className="gap-2"
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          دانلود نسخه JSON
        </Button>
        <Button
          variant="outline"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate("sql")}
          className="gap-2"
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          دانلود نسخه SQL (سازگار با phpMyAdmin)
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted">
          <Upload className="h-4 w-4" />
          بازیابی از فایل JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">تنظیم اجرای زمان‌بندی‌شده (Cron)</h3>
        <p className="text-sm text-muted-foreground">
          برای اجرای خودکار تولید مقاله، یک سرویس زمان‌بندی خارجی (مانند cron-job.org) را طوری تنظیم
          کنید که هر ساعت یک درخواست POST به آدرس زیر ارسال کند:
        </p>
        <code dir="ltr" className="rounded-md bg-muted p-2 text-xs">
          {cronUrl}
        </code>
        <p className="text-sm text-muted-foreground">
          هدر زیر را به درخواست اضافه کنید (مقدار آن باید برابر با متغیر محیطی{" "}
          <code dir="ltr">LOVABLE_CRON_SECRET</code> در سرور باشد):
        </p>
        <code dir="ltr" className="rounded-md bg-muted p-2 text-xs">
          Authorization: Bearer YOUR_SECRET
        </code>
        <p className="text-xs text-muted-foreground">
          توجه: این آدرس فقط زمانی مقاله تولید می‌کند که ساعت جاری (UTC) در تنظیمات «تولید خودکار
          مقاله» فعال باشد.
        </p>
      </div>

      <DestinationDbSection />

      <AlertDialog open={!!pendingRestore} onOpenChange={(v) => !v && setPendingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازیابی نسخه‌پشتیبان</AlertDialogTitle>
            <AlertDialogDescription>
              با ادامه، تمام داده‌های فعلی جدول‌های موجود در فایل حذف و با داده‌های فایل جایگزین
              می‌شوند. این عملیات بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={importMutation.isPending}
              onClick={() =>
                pendingRestore && importMutation.mutate(pendingRestore as Record<string, unknown[]>)
              }
            >
              {importMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} تایید
              و بازیابی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DestinationDbSection() {
  const statusFn = useServerFn(getDestinationDbStatus);
  const saveFn = useServerFn(saveDestinationDbSettings);
  const inspectFn = useServerFn(inspectDestinationDatabase);
  const backupFn = useServerFn(backupToDestinationDb);
  const restoreFn = useServerFn(restoreFromDestinationDb);
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["destination-db-status"],
    queryFn: () => statusFn(),
  });

  const [form, setForm] = useState({ url: "", serviceRoleKey: "" });
  const [confirmAction, setConfirmAction] = useState<"backup" | "restore" | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("مشخصات اتصال ذخیره شد");
      setForm((f) => ({ ...f, serviceRoleKey: "" }));
      qc.invalidateQueries({ queryKey: ["destination-db-status"] });
    },
    onError: () => toast.error("خطا در ذخیره مشخصات اتصال"),
  });

  const inspectQuery = useQuery({
    queryKey: ["destination-db-inspect"],
    queryFn: () => inspectFn(),
    enabled: !!status?.configured,
  });

  const [backupResult, setBackupResult] = useState<
    { name: string; rowCount: number; error: string | null }[] | null
  >(null);
  const [bootstrapSql, setBootstrapSql] = useState<string | null>(null);

  const backupMutation = useMutation({
    mutationFn: () => backupFn(),
    onSuccess: (res) => {
      if (res.bootstrapRequired) {
        setBootstrapSql(res.bootstrapSql ?? null);
        setBackupResult(null);
        toast.error("برای ساخت خودکار جدول‌ها، اول یک اسکریپت را یک‌بار اجرا کنید");
        setConfirmAction(null);
        return;
      }
      setBootstrapSql(null);
      setBackupResult(res.tables);
      const failed = res.tables.filter((t) => t.error);
      const total = res.tables.reduce((sum, t) => sum + t.rowCount, 0);
      if (failed.length > 0) {
        toast.error(`${failed.length} جدول با خطا مواجه شد — جزئیات را پایین صفحه ببینید`);
      } else {
        toast.success(`بک‌آپ در Supabase مقصد نوشته شد — ${total} رکورد`);
      }
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ["destination-db-inspect"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در بک‌آپ به Supabase مقصد");
      setConfirmAction(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreFn(),
    onSuccess: (res) => {
      toast.success(`بازیابی انجام شد — ${res.totalInserted} رکورد درج شد`);
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ["backup-info"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در بازیابی از Supabase مقصد");
      setConfirmAction(null);
    },
  });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">ترانسفر مستقیم به Supabase مقصد</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        آدرس پروژه و کلید Service Role یک پروژه Supabase دیگر (مثلاً یک نمونه دیگر از همین سایت) را
        وارد کنید — دقیقاً همان روشی که این سایت با دیتابیس خودش صحبت می‌کند، بدون فایل واسط.
        جدول‌های دیتابیس مقصد باید از قبل با همین ساختار وجود داشته باشند.
      </p>

      {statusLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>آدرس پروژه Supabase (URL)</Label>
            <Input
              dir="ltr"
              placeholder={status?.url || "https://xxxx.supabase.co"}
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>کلید Service Role</Label>
            <Input
              dir="ltr"
              type="password"
              placeholder={
                status?.serviceRoleKeySet ? "برای تغییر، کلید جدید وارد کنید" : "کلید Service Role"
              }
              value={form.serviceRoleKey}
              onChange={(e) => setForm((f) => ({ ...f, serviceRoleKey: e.target.value }))}
            />
          </div>
        </div>
      )}

      {status?.configured && (
        <p dir="ltr" className="text-xs text-success">
          اتصال فعلی: {status.url}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={saveMutation.isPending || !form.url}
          onClick={() => saveMutation.mutate()}
          className="gap-2"
        >
          {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          ذخیره اتصال
        </Button>
      </div>

      {status?.configured && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {inspectQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : inspectQuery.data ? (
            <>
              <p className="text-xs text-muted-foreground">
                {inspectQuery.data.generatedAt
                  ? `آخرین بک‌آپ در این Supabase: ${new Date(inspectQuery.data.generatedAt).toLocaleString("fa-IR")}`
                  : "هنوز با این ابزار در این Supabase بک‌آپی نوشته نشده"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {inspectQuery.data.tables.map((t) => (
                  <div
                    key={t.name}
                    title={t.error ?? undefined}
                    className={`rounded-md border p-1.5 text-center ${
                      t.error
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <p dir="ltr" className="text-[11px] text-muted-foreground">
                      {t.name}
                    </p>
                    {t.error ? (
                      <p className="text-[11px] text-destructive">خطا</p>
                    ) : (
                      <p className="text-sm font-bold text-foreground">{t.rowCount}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {backupResult?.some((t) => t.error) && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-bold text-destructive">
                این جدول‌ها روی Supabase مقصد نوشته نشدند:
              </p>
              {backupResult
                .filter((t) => t.error)
                .map((t) => (
                  <p key={t.name} dir="ltr" className="text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">{t.name}</span>: {t.error}
                  </p>
                ))}
            </div>
          )}

          {bootstrapSql && (
            <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
              <p className="text-xs font-bold text-foreground">
                یک‌بار برای همیشه: این اسکریپت را در SQL Editor پروژه Supabase مقصد اجرا کنید تا
                بک‌آپ بتواند جدول‌های ناموجود را خودش بسازد. بعد از اجرا، دوباره روی «بک‌آپ در این
                Supabase» بزنید — از این به بعد همیشه با همین یک کلیک کار می‌کند.
              </p>
              <pre
                dir="ltr"
                className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] text-foreground"
              >
                {bootstrapSql}
              </pre>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(bootstrapSql);
                  toast.success("کپی شد");
                }}
                className="w-fit gap-1.5"
              >
                کپی اسکریپت
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              disabled={backupMutation.isPending}
              onClick={() => setConfirmAction("backup")}
              className="gap-2"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              بک‌آپ در این Supabase
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={restoreMutation.isPending}
              onClick={() => setConfirmAction("restore")}
              className="gap-2"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              بازیابی از این Supabase به سایت
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "backup" ? "بک‌آپ در Supabase مقصد" : "بازیابی از Supabase مقصد"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "backup"
                ? "تمام جدول‌های Supabase مقصد حذف و با داده‌های فعلی سایت جایگزین می‌شوند."
                : "تمام داده‌های فعلی سایت حذف و با داده‌های Supabase مقصد جایگزین می‌شوند."}{" "}
              این عملیات بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={backupMutation.isPending || restoreMutation.isPending}
              onClick={() => {
                if (confirmAction === "backup") backupMutation.mutate();
                else if (confirmAction === "restore") restoreMutation.mutate();
              }}
            >
              {(backupMutation.isPending || restoreMutation.isPending) && (
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
