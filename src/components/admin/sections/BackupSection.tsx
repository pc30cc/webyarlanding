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
  Plus,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import {
  getDatabaseInfo,
  exportBackup,
  importBackup,
  getDestinationDbStatus,
  saveDestinationDbSettings,
  listDestinationDatabases,
  createDestinationDatabase,
  inspectDestinationDatabase,
  backupToDestinationDb,
  restoreFromDestinationDb,
} from "@/lib/backup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const listFn = useServerFn(listDestinationDatabases);
  const createDbFn = useServerFn(createDestinationDatabase);
  const inspectFn = useServerFn(inspectDestinationDatabase);
  const backupFn = useServerFn(backupToDestinationDb);
  const restoreFn = useServerFn(restoreFromDestinationDb);
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["destination-db-status"],
    queryFn: () => statusFn(),
  });

  const [form, setForm] = useState({
    dbHost: "",
    dbPort: 5432,
    dbUser: "",
    dbPassword: "",
    dbSsl: true,
  });
  const [databases, setDatabases] = useState<string[] | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [newDbName, setNewDbName] = useState("");
  const [confirmAction, setConfirmAction] = useState<"backup" | "restore" | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("مشخصات اتصال ذخیره شد");
      setForm((f) => ({ ...f, dbPassword: "" }));
      qc.invalidateQueries({ queryKey: ["destination-db-status"] });
    },
    onError: () => toast.error("خطا در ذخیره مشخصات اتصال"),
  });

  const listMutation = useMutation({
    mutationFn: () => listFn(),
    onSuccess: (res) => {
      setDatabases(res);
      if (res.length === 0) toast.info("هیچ دیتابیسی روی سرور مقصد پیدا نشد");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "خطا در اتصال به سرور مقصد"),
  });

  const createDbMutation = useMutation({
    mutationFn: () => createDbFn({ data: { name: newDbName.trim() } }),
    onSuccess: () => {
      toast.success("دیتابیس جدید ساخته شد");
      setNewDbName("");
      listMutation.mutate();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "خطا در ساخت دیتابیس"),
  });

  const inspectQuery = useQuery({
    queryKey: ["destination-db-inspect", selectedDb],
    queryFn: () => inspectFn({ data: { name: selectedDb ?? "" } }),
    enabled: !!selectedDb,
  });

  const backupMutation = useMutation({
    mutationFn: (name: string) => backupFn({ data: { name } }),
    onSuccess: (res) => {
      const total = res.tables.reduce((sum, t) => sum + t.rowCount, 0);
      toast.success(`بک‌آپ در دیتابیس مقصد نوشته شد — ${total} رکورد`);
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ["destination-db-inspect", selectedDb] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در بک‌آپ به دیتابیس مقصد");
      setConfirmAction(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (name: string) => restoreFn({ data: { name } }),
    onSuccess: (res) => {
      toast.success(`بازیابی انجام شد — ${res.totalInserted} رکورد درج شد`);
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ["backup-info"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطا در بازیابی از دیتابیس مقصد");
      setConfirmAction(null);
    },
  });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">ترانسفر مستقیم به دیتابیس مقصد</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        مشخصات اتصال یک سرور PostgreSQL دیگر را وارد کنید — بدون فایل واسط، مستقیم از همین‌جا در
        دیتابیس آن سرور بک‌آپ می‌گیرید یا از آن بازیابی می‌کنید.
      </p>

      {statusLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>آدرس سرور (Host)</Label>
            <Input
              dir="ltr"
              placeholder={status?.dbHost || "db.example.com"}
              value={form.dbHost}
              onChange={(e) => setForm((f) => ({ ...f, dbHost: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>پورت</Label>
            <Input
              dir="ltr"
              type="number"
              placeholder="5432"
              value={form.dbPort || ""}
              onChange={(e) => setForm((f) => ({ ...f, dbPort: Number(e.target.value) || 5432 }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>نام کاربری</Label>
            <Input
              dir="ltr"
              placeholder={status?.dbUser || "postgres"}
              value={form.dbUser}
              onChange={(e) => setForm((f) => ({ ...f, dbUser: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>رمز عبور</Label>
            <Input
              dir="ltr"
              type="password"
              placeholder={status?.passwordSet ? "برای تغییر، رمز جدید وارد کنید" : "رمز عبور"}
              value={form.dbPassword}
              onChange={(e) => setForm((f) => ({ ...f, dbPassword: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={form.dbSsl}
              onCheckedChange={(v) => setForm((f) => ({ ...f, dbSsl: v }))}
            />
            <Label className="cursor-pointer text-xs">
              اتصال با SSL (برای اکثر سرویس‌های ابری لازم است)
            </Label>
          </div>
        </div>
      )}

      {status?.configured && (
        <p dir="ltr" className="text-xs text-success">
          اتصال فعلی: {status.dbUser}@{status.dbHost}:{status.dbPort}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={saveMutation.isPending || !form.dbHost || !form.dbUser}
          onClick={() => saveMutation.mutate()}
          className="gap-2"
        >
          {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          ذخیره اتصال
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={listMutation.isPending || !status?.configured}
          onClick={() => listMutation.mutate()}
          className="gap-2"
        >
          {listMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          دریافت لیست دیتابیس‌ها
        </Button>
      </div>

      {databases && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              dir="ltr"
              placeholder="نام دیتابیس جدید"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              className="max-w-[220px]"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={createDbMutation.isPending || !newDbName.trim()}
              onClick={() => createDbMutation.mutate()}
              className="gap-1.5"
            >
              {createDbMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              ساخت دیتابیس خالی
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {databases.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedDb(name === selectedDb ? null : name)}
                dir="ltr"
                className={`w-full rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
                  selectedDb === name
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Database className="me-2 inline h-3.5 w-3.5" />
                {name}
              </button>
            ))}
          </div>

          {selectedDb && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3">
              {inspectQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : inspectQuery.data ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {inspectQuery.data.generatedAt
                      ? `آخرین بک‌آپ در این دیتابیس: ${new Date(inspectQuery.data.generatedAt).toLocaleString("fa-IR")}`
                      : "هنوز با این ابزار در این دیتابیس بک‌آپی نوشته نشده"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {inspectQuery.data.tables.map((t) => (
                      <div
                        key={t.name}
                        className="rounded-md border border-border bg-background p-1.5 text-center"
                      >
                        <p dir="ltr" className="text-[11px] text-muted-foreground">
                          {t.name}
                        </p>
                        <p className="text-sm font-bold text-foreground">{t.rowCount}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  disabled={backupMutation.isPending}
                  onClick={() => setConfirmAction("backup")}
                  className="gap-2"
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  بک‌آپ در این دیتابیس
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restoreMutation.isPending}
                  onClick={() => setConfirmAction("restore")}
                  className="gap-2"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  بازیابی از این دیتابیس به سایت
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "backup" ? "بک‌آپ در دیتابیس مقصد" : "بازیابی از دیتابیس مقصد"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "backup"
                ? `تمام جدول‌های دیتابیس «${selectedDb}» روی سرور مقصد حذف و با داده‌های فعلی سایت جایگزین می‌شوند.`
                : `تمام داده‌های فعلی سایت حذف و با داده‌های دیتابیس «${selectedDb}» روی سرور مقصد جایگزین می‌شوند.`}{" "}
              این عملیات بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={backupMutation.isPending || restoreMutation.isPending}
              onClick={() => {
                if (!selectedDb) return;
                if (confirmAction === "backup") backupMutation.mutate(selectedDb);
                else if (confirmAction === "restore") restoreMutation.mutate(selectedDb);
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
