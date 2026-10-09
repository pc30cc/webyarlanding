import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { useState } from "react";
import { Link, getRouteApi, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MegaMenu } from "@/components/site/MegaMenu";
import { getIcon } from "@/lib/icon-registry";
import { useAppSession } from "@/lib/useAppSession";
import type { CatalogCategoryDto } from "@/lib/catalog.functions";
import { getBrandNameEn, type SiteSettings } from "@/lib/settings";

const rootRoute = getRouteApi("__root__");

type NavLink =
  | { type: "link"; to: string; hash?: string; label: string }
  | {
      type: "mega";
      to: "/products" | "/solutions";
      label: string;
      categories: CatalogCategoryDto[];
    };

export function SiteHeader({
  settings,
  english = false,
}: {
  settings: SiteSettings;
  english?: boolean;
}) {
  const translateText = useSiteTranslation();

  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { productCatalog, solutionCatalog } = rootRoute.useLoaderData();
  const brandName = english ? getBrandNameEn(settings) : settings.brand.name;
  const auth = settings.auth;
  const session = useAppSession(auth.sessionCheckUrl, auth.logoutUrl);
  const isLoggedIn = session.status === "loggedIn" && session.user !== null;
  // اگر fullName خالی بود، یک خوش‌آمدگویی عمومی نشان می‌دهیم — ایمیل کاربر هرگز به‌جای
  // نام نمایش داده نمی‌شود.
  const welcomeText = english
    ? session.user?.fullName
      ? `Welcome, ${session.user.fullName}`
      : "Welcome"
    : session.user?.fullName
      ? `خوش آمدید، ${session.user.fullName}`
      : "خوش آمدید";
  const label = {
    panel: english ? "Dashboard" : auth.panelLabel || "پنل",
    logout: english ? "Log out" : auth.logoutLabel || "خروج",
    login: english ? "Log in" : auth.loginLabel || "ورود",
    signup: english ? "Get started" : auth.signupLabel || "شروع رایگان",
    menu: english ? "Open menu" : "باز کردن منو",
    viewAllProducts: english ? "View all products" : "مشاهده همه محصولات",
    viewAllSolutions: english ? "View all solutions" : "مشاهده همه راه‌کارها",
    viewAll: english ? "View all" : "مشاهده همه",
  };

  const handleLogout = () => {
    void session.logout();
  };

  const NAV_LINKS: NavLink[] = english
    ? [
        {
          type: "mega",
          to: "/products",
          label: "Products",
          categories: productCatalog,
        },
        {
          type: "mega",
          to: "/solutions",
          label: "Solutions",
          categories: solutionCatalog,
        },
        { type: "link", to: "/pricing", label: "Pricing" },
        { type: "link", to: "/", hash: "features", label: "Features" },
        { type: "link", to: "/blog", label: "Blog" },
        { type: "link", to: "/download", label: "Download" },
      ]
    : [
        {
          type: "mega",
          to: "/products",
          label: "محصولات",
          categories: productCatalog,
        },
        {
          type: "mega",
          to: "/solutions",
          label: "راه‌کارها",
          categories: solutionCatalog,
        },
        { type: "link", to: "/pricing", label: "قیمت‌گذاری" },
        { type: "link", to: "/", hash: "features", label: "امکانات" },
        { type: "link", to: "/blog", label: "بلاگ" },
        { type: "link", to: "/download", label: "دانلود برنامه" },
      ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3"
    >
      <div className="glass mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl px-3 shadow-[0_10px_40px_-20px_oklch(0_0_0/0.8)] sm:h-16 sm:px-5">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={settings.brand.logoUrl || "/webyar-logo.png?v=2"}
            alt={translateText(brandName || "وب‌یار")}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="text-lg font-bold text-foreground">
            {translateText(brandName)}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => {
            if (link.type === "mega") {
              return (
                <MegaMenu
                  key={link.label}
                  label={translateText(link.label)}
                  basePath={link.to}
                  categories={link.categories}
                  viewAllLabel={
                    link.to === "/products"
                      ? label.viewAllProducts
                      : label.viewAllSolutions
                  }
                />
              );
            }
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                {...(link.hash ? { hash: link.hash } : {})}
                className={`transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`}
              >
                {translateText(link.label)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {auth.enabled && isLoggedIn && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {translateText(welcomeText)}
              </span>
              {auth.panelUrl && (
                <a href={auth.panelUrl}>
                  <Button className="h-10 px-5 text-sm font-medium shadow-sm shadow-primary/20">
                    {translateText(label.panel)}
                  </Button>
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 text-sm font-medium"
                onClick={handleLogout}
              >
                {translateText(label.logout)}
              </Button>
            </div>
          )}
          {auth.enabled && !isLoggedIn && (
            <div className="hidden sm:flex items-center gap-2">
              {auth.loginUrl && (
                <a href={auth.loginUrl}>
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-sm font-medium"
                  >
                    {translateText(label.login)}
                  </Button>
                </a>
              )}
              {auth.signupUrl && (
                <a href={auth.signupUrl}>
                  <Button className="h-10 px-5 text-sm font-medium btn-shimmer">
                    {translateText(label.signup)}
                  </Button>
                </a>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label={translateText(label.menu)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl md:hidden"
          >
            <div className="max-h-[calc(100dvh-6rem)] space-y-1 overflow-y-auto overscroll-contain px-3 py-3">
              {NAV_LINKS.map((link) => {
                if (link.type === "mega") {
                  const expanded = mobileExpanded === link.label;
                  return (
                    <div key={link.label} className="rounded-lg">
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpanded(expanded ? null : link.label)
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-expanded={expanded}
                      >
                        {translateText(link.label)}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ps-3"
                          >
                            <div className="space-y-3 py-2">
                              {link.categories.map((category) => (
                                <div key={category.id}>
                                  <div className="mb-1 px-3 text-[11px] font-bold text-muted-foreground">
                                    {translateText(category.title)}
                                  </div>
                                  {category.items.map((item) => {
                                    const Icon = getIcon(item.icon);
                                    return (
                                      <Link
                                        key={item.id}
                                        to={`${link.to}/$slug`}
                                        params={{ slug: item.slug }}
                                        onClick={() => {
                                          setOpen(false);
                                          setMobileExpanded(null);
                                        }}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                      >
                                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                                        {translateText(item.title)}
                                      </Link>
                                    );
                                  })}
                                </div>
                              ))}
                              <Link
                                to={link.to}
                                onClick={() => {
                                  setOpen(false);
                                  setMobileExpanded(null);
                                }}
                                className="block px-3 py-1.5 text-sm font-semibold text-primary"
                              >
                                {translateText(label.viewAll)}{" "}
                                {translateText(link.label)}
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    {...(link.hash ? { hash: link.hash } : {})}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {translateText(link.label)}
                  </Link>
                );
              })}
              {auth.enabled && isLoggedIn && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="px-1 text-sm text-muted-foreground">
                    {translateText(welcomeText)}
                  </p>
                  {auth.panelUrl && (
                    <a href={auth.panelUrl} className="block">
                      <Button className="h-10 w-full">
                        {translateText(label.panel)}
                      </Button>
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={handleLogout}
                  >
                    {translateText(label.logout)}
                  </Button>
                </div>
              )}
              {auth.enabled && !isLoggedIn && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {auth.signupUrl && (
                    <a href={auth.signupUrl} className="block">
                      <Button className="h-10 w-full">
                        {translateText(label.signup)}
                      </Button>
                    </a>
                  )}
                  {auth.loginUrl && (
                    <a href={auth.loginUrl} className="block">
                      <Button variant="outline" className="h-10 w-full">
                        {translateText(label.login)}
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
