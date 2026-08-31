import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/settings";

const NAV_LINKS = [
  { to: "/products", label: "محصولات" },
  { to: "/solutions", label: "راه‌کارها" },
  { to: "/pricing", label: "قیمت‌گذاری" },
] as const;

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const brandInitial = settings.brand.name?.charAt(0) || "و";
  const auth = settings.auth;

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
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                className={`transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {auth.enabled && (
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
            <div className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {auth.enabled && (
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
