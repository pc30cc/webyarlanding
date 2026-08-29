import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { listCategories, adminSaveCategory, adminDeleteCategory, type CategoryDto } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

const empty = { id: undefined as string | undefined, name: "", slug: "", description: "", seoTitle: "", seoDescription: "" };

export default function CategoriesSection() {
  const listFn = useServerFn(listCategories);
  const saveFn = useServerFn(adminSaveCategory);
  const deleteFn = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["categories"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<CategoryDto | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("دسته‌بندی ذخیره شد");
      qc.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
    },
    onError: () => toast.error("خطا در ذخیره دسته‌بندی"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("حذف شد");
      qc.invalidateQueries({ queryKey: ["categories"] });
      setToDelete(null);
    },
    onError: () => toast.error("خطا در حذف"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">دسته‌بندی‌ها</h1>
          <p className="text-sm text-muted-foreground">مدیریت دسته‌بندی‌های وبلاگ</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(empty); setOpen(true); }}>
          <Plus className="h-4 w-4" /> دسته‌بندی جدید
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">هیچ دسته‌بندی‌ای ثبت نشده است</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p dir="ltr" className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{cat.postCount ?? 0} مقاله</span>
              </div>
              {cat.description && <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, seoTitle: cat.seoTitle, seoDescription: cat.seoDescription }); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" /> ویرایش
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => setToDelete(cat)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>نام</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>اسلاگ (اختیاری)</Label>
              <Input dir="ltr" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>توضیحات</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>عنوان سئو</Label>
              <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>توضیحات سئو</Label>
              <Textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف «{toDelete?.name}» مطمئن هستید؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
