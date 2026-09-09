import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchSettings, updateSettings } from "@/lib/settings.functions";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export default function CallCenterWidgetSection() {
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

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ویجت مرکز تماس</h1>
        <p className="text-sm text-muted-foreground">تنظیمات ابزارک تماس تلفنی سایت</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm max-w-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label>فعال‌سازی ویجت مرکز تماس</Label>
            <span className="text-xs text-muted-foreground">
              {form.callCenterWidget.enabled ? "ویجت روشن است" : "ویجت خاموش است"}
            </span>
          </div>
          <Switch
            checked={form.callCenterWidget.enabled}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, callCenterWidget: { ...f.callCenterWidget, enabled: v } }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>آدرس اسکریپت</Label>
          <Input
            dir="ltr"
            value={form.callCenterWidget.scriptUrl}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                callCenterWidget: { ...f.callCenterWidget, scriptUrl: e.target.value },
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>کد نصب ابزارک (HTML / JavaScript)</Label>
          <Textarea
            dir="ltr"
            rows={4}
            value={form.callCenterWidget.inlineScript}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                callCenterWidget: { ...f.callCenterWidget, inlineScript: e.target.value },
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            این کد در همه صفحات سایت، درست قبل از تگ بسته &lt;/body&gt; اجرا می‌شود.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>موقعیت</Label>
          <div className="flex gap-2">
            {(["right", "left"] as const).map((pos) => (
              <Button
                key={pos}
                type="button"
                variant={form.callCenterWidget.position === pos ? "default" : "outline"}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    callCenterWidget: { ...f.callCenterWidget, position: pos },
                  }))
                }
              >
                {pos === "right" ? "راست" : "چپ"}
              </Button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-fit gap-2">
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          ذخیره
        </Button>
      </form>
    </div>
  );
}
