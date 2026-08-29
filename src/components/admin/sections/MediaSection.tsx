import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Copy, ImageOff } from "lucide-react";
import { listMedia, saveMediaAsset, deleteMedia, type MediaAssetDto } from "@/lib/media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

const empty = { filename: "", url: "", alt: "" };

export default function MediaSection() {
  const listFn = useServerFn(listMedia);
  const saveFn = useServerFn(saveMediaAsset);
  const deleteFn = useServerFn(deleteMedia);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["media"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<MediaAssetDto | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("رسانه اضافه شد");
      qc.invalidateQueries({ queryKey: ["media"] });
      setOpen(false);
      setForm(empty);
    },
    onError: () => toast.error("خطا در افزودن رسانه"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("حذف شد");
      qc.invalidateQueries({ queryKey: ["media"] });
      setToDelete(null);
    },
    onError: () => toast.error("خطا در حذف"),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("آدرس کپی شد");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">رسانه‌ها</h1>
          <p className="text-sm text-muted-foreground">مدیریت تصاویر و فایل‌های سایت</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(empty); setOpen(true); }}>
          <Plus className="h-4 w-4" /> افزودن با آدرس
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">هیچ رسانه‌ای ثبت نشده است</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((m) => (
            <div key={m.id} className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                {m.url ? (
                  <img src={m.url} alt={m.alt ?? m.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="truncate text-xs text-foreground" title={m.filename}>{m.filename}</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => copyUrl(m.url)}>
                  <Copy className="h-3.5 w-3.5" /> کپی
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setToDelete(m)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>افزودن رسانه با آدرس</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>نام فایل</Label>
              <Input value={form.filename} onChange={(e) => setForm((f) => ({ ...f, filename: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>آدرس فایل</Label>
              <Input dir="ltr" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>متن جایگزین (Alt)</Label>
              <Input value={form.alt} onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.filename || !form.url || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف رسانه</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف «{toDelete?.filename}» مطمئن هستید؟</AlertDialogDescription>
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
