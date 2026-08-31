import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { CatalogCategory } from "@/lib/catalog";

const TINTS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-success/10", text: "text-success" },
];

export function MegaMenu({
  label,
  basePath,
  categories,
  viewAllLabel,
}: {
  label: string;
  basePath: "/products" | "/solutions";
  categories: readonly CatalogCategory[];
  viewAllLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 transition-colors hover:text-foreground ${open ? "text-foreground" : ""}`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background/98 shadow-xl backdrop-blur-xl"
          >
            <div className="container-page py-8">
              <div
                className={`grid gap-x-8 gap-y-6 sm:grid-cols-2 ${categories.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}
              >
                {categories.map((category) => (
                  <div key={category.title}>
                    <h3 className="mb-3 text-xs font-bold text-muted-foreground">
                      {category.title}
                    </h3>
                    <ul className="space-y-1">
                      {category.items.map((item, i) => {
                        const tint = TINTS[i % TINTS.length]!;
                        return (
                          <li key={item.slug}>
                            <Link
                              to={basePath}
                              hash={item.slug}
                              onClick={() => setOpen(false)}
                              className="flex items-start gap-3 rounded-xl p-2 text-start transition-colors hover:bg-secondary"
                            >
                              <span
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint.bg}`}
                              >
                                <item.icon className={`h-4 w-4 ${tint.text}`} />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-foreground">
                                  {item.title}
                                </span>
                                <span className="block text-xs leading-relaxed text-muted-foreground">
                                  {item.shortDesc}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border pt-4">
                <Link
                  to={basePath}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {viewAllLabel} <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
