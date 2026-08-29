import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, FolderTree, Tags, Images, MessageSquare, ShieldCheck, CheckCircle2, FileClock } from "lucide-react";
import { getAdminDashboard } from "@/lib/admin.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fn() });

  const cards = [
    { label: "کل مقالات", value: data?.totalPosts, icon: FileText },
    { label: "منتشرشده", value: data?.publishedPosts, icon: CheckCircle2 },
    { label: "پیش‌نویس", value: data?.draftPosts, icon: FileClock },
    { label: "دسته‌بندی‌ها", value: data?.categories, icon: FolderTree },
    { label: "برچسب‌ها", value: data?.tags, icon: Tags },
    { label: "رسانه‌ها", value: data?.media, icon: Images },
    { label: "پیام‌ها", value: data?.messages, icon: MessageSquare },
    { label: "پیام‌های خوانده‌نشده", value: data?.unreadMessages, icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
        <p className="text-sm text-muted-foreground">نمای کلی از وضعیت وب‌سایت</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <card.icon className="h-5 w-5 text-primary" />
              {isLoading ? <Skeleton className="h-6 w-10" /> : <span className="text-2xl font-bold text-foreground">{card.value ?? 0}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-foreground">آخرین تلاش‌های ورود</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : data && data.recentLogins.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {data.recentLogins.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{log.email}</span>
                <span className="text-muted-foreground" dir="ltr">{log.ipAddress ?? "-"}</span>
                <span className={log.success ? "text-emerald-600" : "text-destructive"}>
                  {log.success ? "موفق" : "ناموفق"}
                </span>
                <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">هیچ گزارشی ثبت نشده است</p>
        )}
      </div>
    </div>
  );
}
