import { useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Settings,
  Search,
  FileText,
  FolderTree,
  Tags,
  Images,
  LayoutGrid,
  MessageSquare,
  ShieldAlert,
  MessageCircle,
  PhoneCall,
  Sparkles,
  Bot,
  DatabaseBackup,
  KeyRound,
  LogOut,
  Menu,
} from "lucide-react";
import { getSessionUser, logoutAdmin } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async () => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({ to: "/admin-login" });
    }
    return { user };
  },
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { to: "/admin/general", label: "تنظیمات عمومی", icon: Settings },
  { to: "/admin/seo", label: "سئو", icon: Search },
  { to: "/admin/catalog", label: "محصولات و راه‌کارها", icon: LayoutGrid },
  { to: "/admin/blog", label: "مقالات", icon: FileText },
  { to: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { to: "/admin/tags", label: "برچسب‌ها", icon: Tags },
  { to: "/admin/media", label: "رسانه‌ها", icon: Images },
  { to: "/admin/messages", label: "پیام‌ها", icon: MessageSquare },
  { to: "/admin/logins", label: "گزارش ورودها", icon: ShieldAlert },
  { to: "/admin/chat", label: "ویجت چت", icon: MessageCircle },
  { to: "/admin/callcenter", label: "ویجت مرکز تماس", icon: PhoneCall },
  { to: "/admin/ai", label: "هوش مصنوعی", icon: Sparkles },
  { to: "/admin/autoblog", label: "تولید خودکار مقاله", icon: Bot },
  { to: "/admin/backup", label: "پشتیبان‌گیری", icon: DatabaseBackup },
  { to: "/admin/security", label: "امنیت حساب", icon: KeyRound },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const doLogout = useServerFn(logoutAdmin);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await doLogout();
      toast.success("با موفقیت خارج شدید");
      navigate({ to: "/admin-login" });
    } catch {
      toast.error("خطا در خروج از حساب");
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-64 shrink-0 border-l border-border bg-card transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            و
          </div>
          <span className="text-base font-bold text-foreground">پنل مدیریت وب‌یار</span>
        </div>
        <nav
          className="flex flex-col gap-1 overflow-y-auto p-3"
          style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
          {NAV_ITEMS.map((item) => {
            const active =
              "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden text-sm text-muted-foreground lg:block">پنل مدیریت</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{user.displayName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
