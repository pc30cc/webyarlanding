import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { fetchSettings, updateSettings } from "@/lib/settings.functions";
import type { SiteSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import {
  listSeoPages,
  saveSeoPage,
  deleteSeoPage,
  checkSeoHealth,
  checkCatalogSeoHealth,
  adminFixSeoIssue,
  type SeoPageDto,
} from "@/lib/seo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

const emptyPage = {
  id: undefined as string | undefined,
  pageKey: "",
  path: "",
  title: "",
  description: "",
  ogImage: "",
  canonicalUrl: "",
  robots: "index,follow",
  schemaJson: "",
};

export default function SeoSection() {
  const fetchSettingsFn = useServerFn(fetchSettings);
  const updateSettingsFn = useServerFn(updateSettings);
  const listPagesFn = useServerFn(listSeoPages);
  const savePageFn = useServerFn(saveSeoPage);
  const deletePageFn = useServerFn(deleteSeoPage);
  const healthFn = useServerFn(checkSeoHealth);
  const catalogHealthFn = useServerFn(checkCatalogSeoHealth);
  const fixSeoFn = useServerFn(adminFixSeoIssue);
  const qc = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettingsFn(),
  });
  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ["seo-pages"],
    queryFn: () => listPagesFn(),
  });
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["seo-health"],
    queryFn: () => healthFn(),
  });
  const { data: catalogHealth, isLoading: catalogHealthLoading } = useQuery({
    queryKey: ["catalog-seo-health"],
    queryFn: () => catalogHealthFn(),
  });

  const [settingsForm, setSettingsForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyPage);
  const [toDelete, setToDelete] = useState<SeoPageDto | null>(null);

  useEffect(() => {
    if (settingsData) setSettingsForm(settingsData);
  }, [settingsData]);

  const settingsMutation = useMutation({
    mutationFn: (payload: SiteSettings) => updateSettingsFn({ data: payload }),
    onSuccess: () => {
      toast.success("تنظیمات سئو ذخیره شد");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("خطا در ذخیره تنظیمات سئو"),
  });

  const pageSaveMutation = useMutation({
    mutationFn: () => savePageFn({ data: form }),
    onSuccess: () => {
      toast.success("صفحه سئو ذخیره شد");
      qc.invalidateQueries({ queryKey: ["seo-pages"] });
      setOpen(false);
    },
    onError: () => toast.error("خطا در ذخیره صفحه سئو"),
  });

  const pageDeleteMutation = useMutation({
    mutationFn: (id: string) => deletePageFn({ data: { id } }),
    onSuccess: () => {
      toast.success("صفحه سئو حذف شد");
      qc.invalidateQueries({ queryKey: ["seo-pages"] });
      setToDelete(null);
    },
    onError: () => toast.error("خطا در حذف"),
  });

  const fixSeoMutation = useMutation({
    mutationFn: (postId: string) => fixSeoFn({ data: { postId } }),
    onSuccess: (result) => {
      if (result.fixed.length > 0) {
        toast.success(`رفع شد: ${result.fixed.join("، ")}`);
      } else {
        toast.success("مشکلی برای رفع پیدا نشد");
      }
      qc.invalidateQueries({ queryKey: ["seo-health"] });
    },
    onError: (e: Error) => toast.error(e.message || "خطا در رفع مشکل سئو با هوش مصنوعی"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">سئو</h1>
        <p className="text-sm text-muted-foreground">
          تنظیمات کلی سئو، صفحات سئو و بررسی سلامت مقالات
        </p>
      </div>

      {/* تنظیمات کلی سئو */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">تنظیمات کلی سئو</h2>
        {settingsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>عنوان پیش‌فرض سئو</Label>
                <Input
                  value={settingsForm.seo?.metaTitle ?? ""}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>تصویر پیش‌فرض OG</Label>
                <Input
                  dir="ltr"
                  value={settingsForm.seo?.ogImage ?? ""}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, seo: { ...f.seo, ogImage: e.target.value } }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>توضیحات پیش‌فرض سئو</Label>
                <Textarea
                  value={settingsForm.seo?.metaDescription ?? ""}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      seo: { ...f.seo, metaDescription: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>کد وریفای گوگل سرچ کنسول</Label>
                <Input
                  dir="ltr"
                  value={settingsForm.seo?.googleVerification ?? ""}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      seo: { ...f.seo, googleVerification: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>متن robots.txt</Label>
                <Input
                  dir="ltr"
                  value={settingsForm.seo?.robots ?? ""}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, seo: { ...f.seo, robots: e.target.value } }))
                  }
                />
              </div>
            </div>
            <div>
              <Button
                disabled={settingsMutation.isPending}
                onClick={() => settingsMutation.mutate(settingsForm)}
                className="gap-2"
              >
                {settingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره
                تنظیمات
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* گزارش سلامت سئو مقالات */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">گزارش سلامت سئو مقالات</h2>
        {healthLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !health || health.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5" /> همه مقالات منتشرشده اطلاعات سئو کامل دارند
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {health.map((issue) => {
              const isFixing =
                fixSeoMutation.isPending && fixSeoMutation.variables === issue.postId;
              return (
                <div
                  key={issue.postId}
                  className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="font-medium text-foreground">{issue.title}</span>
                    <span dir="ltr" className="text-xs text-muted-foreground">
                      /{issue.slug}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {issue.missing.map((m) => (
                      <Badge
                        key={m}
                        variant="outline"
                        className="border-amber-500/40 text-amber-700"
                      >
                        {m}
                      </Badge>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={isFixing}
                      onClick={() => fixSeoMutation.mutate(issue.postId)}
                    >
                      {isFixing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      رفع مشکل سئو با هوش مصنوعی
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* گزارش سلامت سئو محصولات و راه‌کارها */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          گزارش سلامت سئو محصولات و راه‌کارها
        </h2>
        {catalogHealthLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !catalogHealth || catalogHealth.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5" /> همه محصولات و راه‌کارهای منتشرشده اطلاعات سئو کامل
            دارند
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {catalogHealth.map((issue) => (
              <div
                key={issue.itemId}
                className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="font-medium text-foreground">{issue.title}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    /{issue.type === "solution" ? "solutions" : "products"}/{issue.slug}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {issue.missing.map((m) => (
                    <Badge key={m} variant="outline" className="border-amber-500/40 text-amber-700">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* صفحات سئو */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">صفحات سئو</h2>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setForm(emptyPage);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> صفحه جدید
          </Button>
        </div>

        {pagesLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !pages || pages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            هیچ صفحه سئویی ثبت نشده است
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{p.title || p.pageKey}</h3>
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    {p.path}
                  </p>
                </div>
                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setForm({
                        id: p.id,
                        pageKey: p.pageKey,
                        path: p.path,
                        title: p.title ?? "",
                        description: p.description ?? "",
                        ogImage: p.ogImage ?? "",
                        canonicalUrl: p.canonicalUrl ?? "",
                        robots: p.robots,
                        schemaJson: p.schemaJson ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => setToDelete(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "ویرایش صفحه سئو" : "صفحه سئو جدید"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>کلید صفحه</Label>
              <Input
                dir="ltr"
                value={form.pageKey}
                onChange={(e) => setForm((f) => ({ ...f, pageKey: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>مسیر صفحه</Label>
              <Input
                dir="ltr"
                value={form.path}
                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>عنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>توضیحات</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>تصویر OG</Label>
              <Input
                dir="ltr"
                value={form.ogImage}
                onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>آدرس کانونیکال</Label>
              <Input
                dir="ltr"
                value={form.canonicalUrl}
                onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Robots</Label>
              <Input
                dir="ltr"
                value={form.robots}
                onChange={(e) => setForm((f) => ({ ...f, robots: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>اسکیمای JSON-LD</Label>
              <Textarea
                dir="ltr"
                rows={4}
                value={form.schemaJson}
                onChange={(e) => setForm((f) => ({ ...f, schemaJson: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!form.pageKey || !form.path || pageSaveMutation.isPending}
              onClick={() => pageSaveMutation.mutate()}
              className="gap-2"
            >
              {pageSaveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف صفحه سئو</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{toDelete?.title || toDelete?.pageKey}» مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && pageDeleteMutation.mutate(toDelete.id)}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
