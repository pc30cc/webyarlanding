import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, MailOpen, Mail } from "lucide-react";
import { listContactMessages, markMessageRead, deleteMessage, type ContactMessageDto } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return iso;
  }
}

export default function MessagesSection() {
  const listFn = useServerFn(listContactMessages);
  const markFn = useServerFn(markMessageRead);
  const deleteFn = useServerFn(deleteMessage);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["messages"], queryFn: () => listFn() });
  const [toDelete, setToDelete] = useState<ContactMessageDto | null>(null);

  const markMutation = useMutation({
    mutationFn: (id: string) => markFn({ data: { id, status: "read" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: () => toast.error("خطا در بروزرسانی وضعیت"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("پیام حذف شد");
      qc.invalidateQueries({ queryKey: ["messages"] });
      setToDelete(null);
    },
    onError: () => toast.error("خطا در حذف پیام"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پیام‌های تماس</h1>
        <p className="text-sm text-muted-foreground">پیام‌های ارسالی از فرم تماس با ما</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">هیچ پیامی دریافت نشده است</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-2 rounded-xl border p-4 shadow-sm ${msg.status === "read" ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{msg.name}</h3>
                  {msg.status !== "read" ? (
                    <Badge variant="default">جدید</Badge>
                  ) : (
                    <Badge variant="outline">خوانده‌شده</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground" dir="ltr">
                {msg.email && <span>{msg.email}</span>}
                {msg.phone && <span>{msg.phone}</span>}
                {msg.ipAddress && <span>{msg.ipAddress}</span>}
              </div>
              {msg.subject && <p className="text-sm font-medium text-foreground">{msg.subject}</p>}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
              <div className="mt-1 flex gap-2">
                {msg.status !== "read" && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => markMutation.mutate(msg.id)}>
                    <MailOpen className="h-3.5 w-3.5" /> علامت‌گذاری خوانده‌شده
                  </Button>
                )}
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => setToDelete(msg)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف پیام</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف پیام «{toDelete?.name}» مطمئن هستید؟</AlertDialogDescription>
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
