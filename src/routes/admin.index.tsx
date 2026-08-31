import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  FolderTree,
  Tags,
  Images,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FileClock,
  Radio,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { getAdminDashboard } from "@/lib/admin.functions";
import { adminGetVisitStats } from "@/lib/analytics.functions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const visitChartConfig = {
  count: { label: "بازدید", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

function VisitStatsPanel() {
  const fn = useServerFn(adminGetVisitStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-visit-stats"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
  });

  const cards = [
    { label: "بازدید امروز", value: data?.today, icon: CalendarDays },
    { label: "بازدید این هفته", value: data?.thisWeek, icon: CalendarRange },
    { label: "بازدید این ماه", value: data?.thisMonth, icon: Calendar },
  ];

  const chartData = (data?.daily ?? []).map((point) => ({
    date: new Date(point.date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
    count: point.count,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">آمار بازدید سایت</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          {isLoading ? <Skeleton className="h-4 w-6" /> : <span>{data?.onlineNow ?? 0}</span>}
          <span className="text-xs font-normal text-emerald-600/80">آنلاین الان</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between">
              <card.icon className="h-4 w-4 text-primary" />
              {isLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <span className="text-xl font-bold text-foreground">{card.value ?? 0}</span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs text-muted-foreground">روند بازدید ۱۴ روز اخیر</p>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ChartContainer config={visitChartConfig} className="h-40 w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                fill="var(--color-count)"
                fillOpacity={0.2}
                stroke="var(--color-count)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

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

      <VisitStatsPanel />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <card.icon className="h-5 w-5 text-primary" />
              {isLoading ? (
                <Skeleton className="h-6 w-10" />
              ) : (
                <span className="text-2xl font-bold text-foreground">{card.value ?? 0}</span>
              )}
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
                <span className="text-muted-foreground" dir="ltr">
                  {log.ipAddress ?? "-"}
                </span>
                <span className={log.success ? "text-emerald-600" : "text-destructive"}>
                  {log.success ? "موفق" : "ناموفق"}
                </span>
                <span className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("fa-IR")}
                </span>
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
