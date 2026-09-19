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
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { productCatalog, solutionCatalog } = rootRoute.useLoaderData();
  const brandName = english ? getBrandNameEn(settings) : settings.brand.name;
  const brandInitial = brandName?.charAt(0) || "و";
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
        { type: "mega", to: "/products", label: "Products", categories: productCatalog },
        { type: "mega", to: "/solutions", label: "Solutions", categories: solutionCatalog },
        { type: "link", to: "/pricing", label: "Pricing" },
        { type: "link", to: "/", hash: "features", label: "Features" },
        { type: "link", to: "/blog", label: "Blog" },
        { type: "link", to: "/api-docs", label: "API Docs" },
      ]
    : [
        { type: "mega", to: "/products", label: "محصولات", categories: productCatalog },
        { type: "mega", to: "/solutions", label: "راه‌کارها", categories: solutionCatalog },
        { type: "link", to: "/pricing", label: "قیمت‌گذاری" },
        { type: "link", to: "/", hash: "features", label: "امکانات" },
        { type: "link", to: "/blog", label: "بلاگ" },
        { type: "link", to: "/api-docs", label: "مستندات API" },
      ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-primary-foreground">
            <span className="text-lg font-black">{brandInitial}</span>
          </div>
          <span className="text-lg font-bold text-foreground">{settings.brand.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => {
            if (link.type === "mega") {
              return (
                <MegaMenu
                  key={link.label}
                  label={link.label}
                  basePath={link.to}
                  categories={link.categories}
                  viewAllLabel={
                    link.to === "/products" ? "مشاهده همه محصولات" : "مشاهده همه راه‌کارها"
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
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {auth.enabled && isLoggedIn && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{welcomeText}</span>
              {auth.panelUrl && (
                <a href={auth.panelUrl}>
                  <Button className="h-10 px-5 text-sm font-medium shadow-sm shadow-primary/20">
                    {auth.panelLabel || "پنل"}
                  </Button>
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 text-sm font-medium"
                onClick={handleLogout}
              >
                {auth.logoutLabel || "خروج"}
              </Button>
            </div>
          )}
          {auth.enabled && !isLoggedIn && (
            <div className="hidden sm:flex items-center gap-2">
              {auth.loginUrl && (
                <a href={auth.loginUrl}>
                  <Button variant="ghost" className="h-10 px-4 text-sm font-medium">
                    {auth.loginLabel || "ورود"}
                  </Button>
                </a>
              )}
              {auth.signupUrl && (
                <a href={auth.signupUrl}>
                  <Button className="h-10 px-5 text-sm font-medium shadow-sm shadow-primary/20">
                    {auth.signupLabel || "شروع رایگان"}
                  </Button>
                </a>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="باز کردن منو"
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
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="max-h-[70vh] space-y-1 overflow-y-auto px-4 py-4">
              {NAV_LINKS.map((link) => {
                if (link.type === "mega") {
                  const expanded = mobileExpanded === link.label;
                  return (
                    <div key={link.label} className="rounded-lg">
                      <button
                        type="button"
                        onClick={() => setMobileExpanded(expanded ? null : link.label)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-expanded={expanded}
                      >
                        {link.label}
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
                                    {category.title}
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
                                        {item.title}
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
                                مشاهده همه {link.label}
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
                    {link.label}
                  </Link>
                );
              })}
              {auth.enabled && isLoggedIn && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="px-1 text-sm text-muted-foreground">{welcomeText}</p>
                  {auth.panelUrl && (
                    <a href={auth.panelUrl} className="block">
                      <Button className="h-10 w-full">{auth.panelLabel || "پنل"}</Button>
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={handleLogout}
                  >
                    {auth.logoutLabel || "خروج"}
                  </Button>
                </div>
              )}
              {auth.enabled && !isLoggedIn && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {auth.signupUrl && (
                    <a href={auth.signupUrl} className="block">
                      <Button className="h-10 w-full">{auth.signupLabel || "شروع رایگان"}</Button>
                    </a>
                  )}
                  {auth.loginUrl && (
                    <a href={auth.loginUrl} className="block">
                      <Button variant="outline" className="h-10 w-full">
                        {auth.loginLabel || "ورود"}
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
