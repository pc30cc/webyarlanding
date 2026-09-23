import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import {
  getGscStatus,
  saveGscKey,
  saveGscSettings,
  listGscProperties,
  runGscAudit,
} from "@/lib/gsc.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "خطای نامشخص";
}

export default function SearchConsoleSection() {
  const queryClient = useQueryClient();
  const statusFn = useServerFn(getGscStatus);
  const saveKeyFn = useServerFn(saveGscKey);
  const saveSettingsFn = useServerFn(saveGscSettings);
  const propertiesFn = useServerFn(listGscProperties);
  const auditFn = useServerFn(runGscAudit);

  const { data: status, isLoading } = useQuery({
    queryKey: ["gsc-status"],
    queryFn: () => statusFn(),
  });

  const [keyJson, setKeyJson] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [autoFix, setAutoFix] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [property, setProperty] = useState("");

  useEffect(() => {
    if (!status) return;
    setEnabled(status.enabled);
    setAutoFix(status.autoFix);
    setNotifyTelegram(status.notifyTelegram);
    setProperty(status.property);
  }, [status]);

  const saveKey = useMutation({
    mutationFn: (clear: boolean) => saveKeyFn({ data: clear ? { clear: true } : { json: keyJson } }),
    onSuccess: () => {
      setKeyJson("");
      toast.success("کلید سرویس‌اکانت ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["gsc-status"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const saveConfig = useMutation({
    mutationFn: () => saveSettingsFn({ data: { enabled, property, autoFix, notifyTelegram } }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["gsc-status"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const properties = useMutation({
    mutationFn: () => propertiesFn(),
    onSuccess: (list) => {
      if (list.length === 0) toast.error("هیچ پراپرتی تأییدشده‌ای پیدا نشد");
      else toast.success(`${list.length} پراپرتی پیدا شد`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const audit = useMutation({
    mutationFn: () => auditFn({ data: { autoFix } }),
    onSuccess: (r) => {
      toast.success(r.summary);
      queryClient.invalidateQueries({ queryKey: ["gsc-status"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const report = audit.data ?? status?.lastReport ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">گوگل سرچ کنسول</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          اتصال به سرچ کنسول، بررسی مشکلات سئو با هوش مصنوعی و رفع خودکار آن‌ها روی سایت.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">۱. اتصال حساب گوگل</CardTitle>
          <CardDescription>
            در Google Cloud یک سرویس‌اکانت بسازید، API «Search Console» را فعال کنید، فایل کلید JSON
            را دانلود و محتوایش را اینجا بگذارید. سپس ایمیل سرویس‌اکانت را در سرچ کنسول (بخش
            Settings → Users and permissions) به‌عنوان کاربر Full اضافه کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.keySet ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>کلید ثبت شده است</span>
              {status.keyEmail && (
                <code className="rounded bg-background px-2 py-1 text-xs" dir="ltr">
                  {status.keyEmail}
                </code>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveKey.mutate(true)}
                disabled={saveKey.isPending}
              >
                حذف کلید
              </Button>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>محتوای فایل کلید JSON</Label>
            <Textarea
              dir="ltr"
              rows={6}
              value={keyJson}
              onChange={(e) => setKeyJson(e.target.value)}
              placeholder='{"type":"service_account","client_email":"...","private_key":"..."}'
              className="font-mono text-xs"
            />
            <Button onClick={() => saveKey.mutate(false)} disabled={saveKey.isPending || !keyJson}>
              {saveKey.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ذخیره کلید
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">۲. تنظیمات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className="text-sm font-medium">اتصال فعال باشد</div>
              <p className="text-xs text-muted-foreground">
                با خاموش بودن، هیچ درخواستی به گوگل ارسال نمی‌شود.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className="text-sm font-medium">رفع خودکار مشکلات</div>
              <p className="text-xs text-muted-foreground">
                عنوان و توضیح سئو، کنونیکال، دستور ایندکس، نقشه سایت و داده ساختاریافته بدون تأیید
                تک‌به‌تک اصلاح می‌شوند.
              </p>
            </div>
            <Switch checked={autoFix} onCheckedChange={setAutoFix} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className="text-sm font-medium">ارسال نتیجه در ربات تلگرام</div>
              <p className="text-xs text-muted-foreground">
                گزارش هر بررسی برای مدیران ربات فرستاده می‌شود. در منوی ربات هم دکمه «بررسی و رفع
                سئو» اضافه شده است.
              </p>
            </div>
            <Switch checked={notifyTelegram} onCheckedChange={setNotifyTelegram} />
          </div>
          <div className="space-y-2">
            <Label>پراپرتی سرچ کنسول (اختیاری — خالی بگذارید تا خودکار انتخاب شود)</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                dir="ltr"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                placeholder="https://webyar.ai/ یا sc-domain:webyar.ai"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => properties.mutate()}
                disabled={properties.isPending}
              >
                {properties.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="mr-2">دریافت فهرست</span>
              </Button>
            </div>
            {properties.data && properties.data.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {properties.data.map((p) => (
                  <Button
                    key={p.siteUrl}
                    size="sm"
                    variant={property === p.siteUrl ? "default" : "outline"}
                    onClick={() => setProperty(p.siteUrl)}
                  >
                    <span dir="ltr">{p.siteUrl}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره تنظیمات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">۳. بررسی و رفع خودکار</CardTitle>
          <CardDescription>
            {status?.lastRunAt
              ? `آخرین بررسی: ${new Date(status.lastRunAt).toLocaleString("fa-IR")}`
              : "هنوز بررسی‌ای انجام نشده است."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => audit.mutate()} disabled={audit.isPending} size="lg">
            {audit.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="ml-2 h-4 w-4" />
            )}
            بررسی و رفع خودکار مشکلات سئو
          </Button>
          {audit.isPending && (
            <p className="text-xs text-muted-foreground">
              در حال گرفتن داده از گوگل و اصلاح مشکلات... ممکن است یک تا دو دقیقه طول بکشد.
            </p>
          )}

          {report && (
            <div className="space-y-4 pt-2">
              {report.error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {report.error}
                </div>
              )}
              {report.connected && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="کلیک (۲۸ روز)" value={report.totals.clicks} />
                  <Stat label="نمایش" value={report.totals.impressions} />
                  <Stat label="نرخ کلیک" value={`${report.totals.ctr}%`} />
                  <Stat label="میانگین رتبه" value={report.totals.position} />
                </div>
              )}
              {report.coverage && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="text-sm font-medium">
                    وضعیت ایندکس صفحات — بررسی‌شده {report.coverage.checked} • ایندکس‌شده{" "}
                    {report.coverage.indexed} • ایندکس‌نشده {report.coverage.notIndexed}
                  </div>
                  {report.coverage.groups.map((g) => (
                    <div key={g.reason} className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span>{g.reason}</span>
                        <span className="text-muted-foreground">{g.count} صفحه</span>
                      </div>
                      {g.examples.length > 0 && (
                        <div className="mt-1 break-all text-[11px] text-muted-foreground" dir="ltr">
                          {g.examples.join(" • ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm font-medium">{report.summary}</div>
              <div className="space-y-2">
                {report.issues.map((issue, idx) => (
                  <div
                    key={`${issue.kind}-${idx}`}
                    className="flex items-start gap-3 rounded-md border border-border p-3"
                  >
                    {issue.fixed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : issue.severity === "error" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{issue.title}</span>
                        <Badge variant={issue.fixed ? "default" : "secondary"}>
                          {issue.fixed ? "رفع شد" : "نیاز به بررسی"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                        {issue.target} — {issue.detail}
                        {issue.fixNote ? ` • ${issue.fixNote}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {report.topQueries.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium">پرجست‌وجوترین عبارت‌ها</div>
                  <div className="space-y-1">
                    {report.topQueries.map((q) => (
                      <div
                        key={q.query}
                        className="flex justify-between rounded-md bg-muted/40 px-3 py-2 text-xs"
                      >
                        <span>{q.query}</span>
                        <span className="text-muted-foreground">
                          کلیک {q.clicks} • نمایش {q.impressions} • رتبه {q.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
