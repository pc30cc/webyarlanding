import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "@/lib/auth.functions";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const doLogin = useServerFn(loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doLogin({ data: { email, password } });
      if (!res.ok) {
        setError(res.error ?? "ورود ناموفق بود");
        toast.error(res.error ?? "ورود ناموفق بود");
        return;
      }
      toast.success("خوش آمدید");
      navigate({ to: "/admin" });
    } catch {
      setError("خطایی رخ داد، دوباره تلاش کنید");
      toast.error("خطایی رخ داد، دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 px-4">
      <div aria-hidden className="pointer-events-none absolute -top-32 -start-40 h-[480px] w-[480px] rounded-full bg-accent/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -end-40 h-[420px] w-[420px] rounded-full bg-primary/25 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand">
            <span className="text-2xl font-black text-primary-foreground">و</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">ورود به پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground">دسترسی محدود — فقط برای مدیران وب‌یار</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">ایمیل</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                dir="ltr"
                className="pr-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">رمز عبور</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                dir="ltr"
                className="pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ورود"}
          </Button>
        </form>
      </div>
    </div>
  );
}
