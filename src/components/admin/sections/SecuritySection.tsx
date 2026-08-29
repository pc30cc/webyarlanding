import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changeAdminPassword } from "@/lib/auth.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SecuritySection() {
  const fn = useServerFn(changeAdminPassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const mutation = useMutation({
    mutationFn: () => fn({ data: { currentPassword: current, newPassword: next } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("رمز عبور تغییر کرد");
        setCurrent("");
        setNext("");
      } else {
        toast.error(res.error ?? "خطا در تغییر رمز عبور");
      }
    },
    onError: () => toast.error("خطا در تغییر رمز عبور"),
  });

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-foreground">امنیت حساب</h1>
        <p className="text-sm text-muted-foreground">تغییر رمز عبور مدیر</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <Label>رمز فعلی</Label>
          <Input dir="ltr" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>رمز جدید</Label>
          <Input dir="ltr" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="gap-2">
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          تغییر رمز عبور
        </Button>
      </form>
    </div>
  );
}
