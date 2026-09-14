import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRightLeft, GitCompare, Loader2, PlugZap } from "lucide-react";
import {
  testTargetDatabase,
  compareTargetDatabase,
  runDatabaseTransfer,
} from "@/lib/dbtransfer.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export default function DbTransferSection() {
  const testFn = useServerFn(testTargetDatabase);
  const compareFn = useServerFn(compareTargetDatabase);
  const runFn = useServerFn(runDatabaseTransfer);

  const [connectionString, setConnectionString] = useState("");
  const [includeSchema, setIncludeSchema] = useState(true);
  const [truncateTarget, setTruncateTarget] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const testMutation = useMutation({
    mutationFn: () => testFn({ data: { connectionString } }),
    onSuccess: () => toast.success("اتصال به دیتابیس مقصد برقرار شد"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "خطا در اتصال"),
  });

  const compareMutation = useMutation({
    mutationFn: () => compareFn({ data: { connectionString } }),
    onSuccess: (res) =>
      res.identical
        ? toast.success("ساختار و تعداد رکوردهای دو دیتابیس یکسان است")
        : toast.warning("بین دو دیتابیس تفاوت وجود دارد — جزئیات را ببینید"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "خطا در مقایسه"),
  });

  const runMutation = useMutation({
    mutationFn: () =>
      runFn({ data: { connectionString, includeSchema, truncateTarget } }),
    onSuccess: (res) => {
      setConfirmOpen(false);
      const failed = res.tables.filter((t) => t.error).length;
      if (failed > 0) toast.error(`${failed} جدول با خطا مواجه شد`);
      else toast.success(`انتقال کامل شد — ${res.totalRows} رکورد منتقل شد`);
      compareMutation.mutate();
    },
    onError: (e: unknown) => {
      setConfirmOpen(false);
      toast.error(e instanceof Error ? e.message : "خطا در انتقال");
    },
  });

  const busy = testMutation.isPending || compareMutation.isPending || runMutation.isPending;
  const info = testMutation.data;
  const compare = compareMutation.data;
  const run = runMutation.data;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">انتقال دیتابیس به دیتابیس</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        رشته اتصال مستقیم PostgreSQL دیتابیس مقصد (سرور شخصی، Supabase سلف‌هاست یا هر
        PostgreSQL دیگری) را وارد کنید. ساختار جدول‌ها و تمام داده‌ها با یک کلیک به مقصد منتقل
        می‌شود.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label>رشته اتصال مقصد</Label>
        <Input
          dir="ltr"
          type="password"
          placeholder="postgresql://user:password@host:5432/postgres"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          برای اتصال بدون TLS، انتهای رشته <code dir="ltr">?sslmode=disable</code> را اضافه کنید.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="include-schema" checked={includeSchema} onCheckedChange={setIncludeSchema} />
          <Label htmlFor="include-schema" className="cursor-pointer">
            ساخت خودکار جدول‌های ناموجود در مقصد
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="truncate-target"
            checked={truncateTarget}
            onCheckedChange={setTruncateTarget}
          />
          <Label htmlFor="truncate-target" className="cursor-pointer">
            پاک‌کردن داده‌های فعلی مقصد پیش از انتقال
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || connectionString.length < 10}
          onClick={() => testMutation.mutate()}
          className="gap-2"
        >
          {testMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlugZap className="h-3.5 w-3.5" />
          )}
          تست اتصال
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || connectionString.length < 10}
          onClick={() => compareMutation.mutate()}
          className="gap-2"
        >
          {compareMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GitCompare className="h-3.5 w-3.5" />
          )}
          مقایسه با مقصد
        </Button>
        <Button
          size="sm"
          disabled={busy || connectionString.length < 10}
          onClick={() => setConfirmOpen(true)}
          className="gap-2"
        >
          {runMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRightLeft className="h-3.5 w-3.5" />
          )}
          شروع انتقال
        </Button>
      </div>

      {info && (
        <div dir="ltr" className="rounded-lg border border-success/40 bg-success/5 p-3 text-xs">
          <p className="text-foreground">
            {info.database} · {info.user} · {info.tableCount} tables
          </p>
          <p className="text-muted-foreground">{info.version}</p>
        </div>
      )}

      {compare && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            {compare.identical
              ? "دو دیتابیس کاملاً یکسان هستند."
              : "تفاوت‌های زیر بین دیتابیس سایت و مقصد وجود دارد:"}{" "}
            (تعداد کل جدول‌های مقصد: {compare.targetTableCount})
          </p>
          <div className="overflow-x-auto">
            <table dir="rtl" className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-1 text-right">جدول</th>
                  <th className="p-1">سایت</th>
                  <th className="p-1">مقصد</th>
                  <th className="p-1 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {compare.tables.map((t) => (
                  <tr key={t.name} className="border-t border-border">
                    <td dir="ltr" className="p-1 text-right">
                      {t.name}
                    </td>
                    <td className="p-1 text-center">{t.sourceRows}</td>
                    <td className="p-1 text-center">
                      {t.targetRows === null ? "—" : t.targetRows}
                    </td>
                    <td className="p-1">
                      {t.missingOnTarget ? (
                        <span className="text-destructive">جدول در مقصد نیست</span>
                      ) : t.missingColumns.length > 0 ? (
                        <span className="text-destructive">
                          ستون کم: {t.missingColumns.join("، ")}
                        </span>
                      ) : t.targetRows !== t.sourceRows ? (
                        <span className="text-warning">اختلاف تعداد رکورد</span>
                      ) : (
                        <span className="text-success">یکسان</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {run && (run.warnings.length > 0 || run.tables.some((t) => t.error || t.skipped)) && (
        <div className="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/5 p-3 text-[11px]">
          {run.tables
            .filter((t) => t.error || t.skipped)
            .map((t) => (
              <p key={t.name} dir="ltr" className="text-muted-foreground">
                <span className="font-bold text-foreground">{t.name}</span>:{" "}
                {t.error ?? t.skipped}
              </p>
            ))}
          {run.warnings.map((w, i) => (
            <p key={i} dir="ltr" className="text-muted-foreground">
              {w}
            </p>
          ))}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>شروع انتقال دیتابیس</AlertDialogTitle>
            <AlertDialogDescription>
              تمام داده‌های دیتابیس فعلی سایت به دیتابیس مقصد نوشته می‌شود
              {truncateTarget && " و داده‌های فعلی مقصد ابتدا حذف می‌شوند"}. این عملیات
              بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={runMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                runMutation.mutate();
              }}
            >
              {runMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تایید و انتقال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
