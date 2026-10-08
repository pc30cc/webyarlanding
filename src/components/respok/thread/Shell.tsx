import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { TrustBadge } from "@/components/site/TrustBadge";
import { getIcon } from "@/lib/icon-registry";
import type { RespokShellProps } from "../types";
import { RespokLogo } from "../RespokLogo";
import { useRespok } from "../shared/context";
import { useRespokAuth } from "../shared/auth";
import { useRespokFooter } from "../shared/footer";
import {
  FOOTER_COLUMNS,
  PRIMARY_NAV,
  useRespokCatalogNav,
  useSocialLinks,
  type NavCategory,
  type NavLinkItem,
} from "../shared/nav";
import { THREAD_COPY } from "./copy";
import { SHAPE, cx } from "./classes";
import { ActionButton, ActionLink, Container, Eyebrow, Exchange, QuestionPill } from "./ui";
import { Reveal } from "../shared/Reveal";

type MenuKind = "products" | "solutions";

function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname });
}

function isActive(pathname: string, link: NavLinkItem): boolean {
  if (link.hash) return false;
  const clean = pathname.replace(/\/+$/, "") || "/";
  // Tag pages are part of the blog.
  if (link.to === "/blog" && clean.startsWith("/tag/")) return true;
  return clean === link.to || clean.startsWith(`${link.to}/`);
}

/* ── Desktop dropdown ───────────────────────────────────────────────────── */

function NavMenu({
  link,
  kind,
  categories,
  pathname,
}: {
  link: NavLinkItem;
  kind: MenuKind;
  categories: NavCategory[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const hoverOpenedAt = useRef(0);
  const active = isActive(pathname, link);
  const itemCount = categories.reduce((sum, c) => sum + c.items.length, 0);
  const cols = Math.min(categories.length, 4);

  const clearTimer = () => window.clearTimeout(timer.current);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const focusFirstItem = () => {
    window.requestAnimationFrame(() => {
      wrapRef.current?.querySelector<HTMLAnchorElement>("[data-menu-item]")?.focus();
    });
  };

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      focusFirstItem();
    }
  };

  const onPanelKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(
      wrapRef.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-item]") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length];
    next?.focus();
  };

  return (
    <div
      ref={wrapRef}
      className="flex"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        clearTimer();
        timer.current = window.setTimeout(() => {
          hoverOpenedAt.current = Date.now();
          setOpen(true);
        }, 90);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        clearTimer();
        timer.current = window.setTimeout(() => setOpen(false), 200);
      }}
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onKeyDown={onTriggerKey}
        onClick={() => {
          clearTimer();
          // A hover that just opened the menu shouldn't be undone by the same click.
          if (open && Date.now() - hoverOpenedAt.current < 450) return;
          setOpen((value) => !value);
        }}
        className={cx(
          "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors duration-200",
          open || active
            ? "bg-rpk-paper text-rpk-ink"
            : "text-rpk-ink/80 hover:bg-rpk-paper hover:text-rpk-ink",
        )}
      >
        {link.label}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2.4}
          className={cx(
            "size-4 transition-transform duration-200 ease-rpk-spring",
            open && "rotate-180",
          )}
        />
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-full flex justify-center pt-3">
        <div
          id={panelId}
          data-open={open}
          onKeyDown={onPanelKey}
          className={cx(
            "tt-panel w-full origin-top bg-white p-3 shadow-rpk-panel",
            cols >= 4
              ? "max-w-[1120px]"
              : cols === 3
                ? "max-w-[880px]"
                : cols === 2
                  ? "max-w-[640px]"
                  : "max-w-[400px]",
            SHAPE.answerCard,
          )}
        >
          <div
            className={cx(
              "grid gap-1",
              cols >= 4 && "grid-cols-4",
              cols === 3 && "grid-cols-3",
              cols === 2 && "grid-cols-2",
              cols <= 1 && "grid-cols-1",
            )}
          >
            {categories.map((category) => (
              <div key={category.id} className="min-w-0 p-2">
                <Eyebrow as="p" className="px-3 pt-2 pb-3 !text-[12px] !tracking-[0.04em]">
                  {category.title}
                </Eyebrow>
                <ul className="space-y-0.5">
                  {category.items.map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                      <li key={item.id}>
                        <Link
                          data-menu-item=""
                          to={kind === "products" ? "/products/$slug" : "/solutions/$slug"}
                          params={{ slug: item.slug }}
                          onClick={() => setOpen(false)}
                          className="group/item flex items-start gap-3 rounded-[18px] p-3 transition-colors duration-200 hover:bg-rpk-paper focus-visible:bg-rpk-paper"
                        >
                          <span
                            aria-hidden="true"
                            className={cx(
                              "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center bg-rpk-paper text-rpk-ink ring-1 ring-rpk-mist ring-inset transition-colors duration-200 group-hover/item:bg-rpk-ink group-hover/item:text-white group-hover/item:ring-rpk-ink",
                              SHAPE.answer,
                            )}
                          >
                            <Icon className="size-[18px]" strokeWidth={2} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[15px] leading-[1.3] font-semibold text-rpk-ink">
                              {item.title}
                            </span>
                            {item.shortDesc && (
                              <span className="mt-1 block text-[13px] leading-[1.45] text-rpk-slate">
                                {item.shortDesc}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 rounded-[20px] bg-rpk-paper py-2 pr-2 pl-5">
            <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
              {itemCount} {THREAD_COPY.menu.heading[kind].toLowerCase()}
            </span>
            <ActionLink
              href={link.to}
              variant="secondary"
              size="sm"
              arrow
              onClick={() => setOpen(false)}
            >
              {THREAD_COPY.menu.viewAll[kind]}
            </ActionLink>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile sheet ───────────────────────────────────────────────────────── */

function MobileSheet({
  id,
  onClose,
  onNavigate,
  catalog,
  pathname,
}: {
  id: string;
  onClose: () => void;
  onNavigate: () => void;
  catalog: Record<MenuKind, NavCategory[]>;
  pathname: string;
}) {
  const { brand } = useRespok();
  const auth = useRespokAuth();
  const [expanded, setExpanded] = useState<MenuKind | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Keep keyboard focus inside the sheet while it is open.
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const row =
    "flex min-h-14 w-full items-center justify-between gap-3 border-b border-rpk-mist py-3 text-left text-[22px] font-bold tracking-[-0.01em] text-rpk-ink";

  return (
    <div
      ref={sheetRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={THREAD_COPY.menu.label}
      onKeyDown={trapFocus}
      className="fixed inset-0 z-[70] flex flex-col bg-white animate-in fade-in-0 slide-in-from-bottom-4 duration-300 lg:hidden"
    >
      {/* Same positions as the header bar, so logo and button don't jump. */}
      <div className="flex h-[76px] shrink-0 items-center justify-between pt-3 pr-5 pl-3 sm:pr-6 sm:pl-4">
        <Link
          to="/"
          onClick={onNavigate}
          aria-label={`${brand} home`}
          className="ml-5 rounded-md sm:ml-6"
        >
          <RespokLogo concept="thread" height={26} title="" />
        </Link>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={THREAD_COPY.menu.close}
          className="inline-flex size-12 items-center justify-center rounded-full bg-rpk-paper text-rpk-ink transition-colors hover:bg-rpk-mist"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </button>
      </div>

      <nav
        aria-label={THREAD_COPY.menu.primary}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8 sm:px-6"
      >
        <Eyebrow className="mb-2">{THREAD_COPY.menu.label}</Eyebrow>
        <ul>
          {PRIMARY_NAV.map((link) => {
            const kind = link.menu;
            const categories = kind ? catalog[kind] : [];
            if (kind && categories.length > 0) {
              const isOpen = expanded === kind;
              const regionId = `${id}-${kind}`;
              return (
                <li key={link.label}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={regionId}
                    onClick={() => setExpanded(isOpen ? null : kind)}
                    className={row}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "inline-flex size-9 items-center justify-center rounded-full transition-colors",
                        isOpen ? "bg-rpk-ink text-white" : "bg-rpk-paper",
                      )}
                    >
                      <ChevronDown
                        strokeWidth={2.4}
                        className={cx(
                          "size-4 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </span>
                  </button>
                  <div
                    id={regionId}
                    hidden={!isOpen}
                    className="border-b border-rpk-mist pt-2 pb-5"
                  >
                    {categories.map((category) => (
                      <div key={category.id} className="mt-3">
                        <Eyebrow className="mb-1 !text-[12px]">{category.title}</Eyebrow>
                        <ul>
                          {category.items.map((item) => {
                            const Icon = getIcon(item.icon);
                            return (
                              <li key={item.id}>
                                <Link
                                  to={kind === "products" ? "/products/$slug" : "/solutions/$slug"}
                                  params={{ slug: item.slug }}
                                  onClick={onNavigate}
                                  className="-mx-2 flex min-h-12 items-center gap-3 rounded-[16px] px-2 py-2 text-[16px] font-semibold text-rpk-ink hover:bg-rpk-paper"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cx(
                                      "inline-flex size-9 shrink-0 items-center justify-center bg-rpk-paper ring-1 ring-rpk-mist ring-inset",
                                      SHAPE.answer,
                                    )}
                                  >
                                    <Icon className="size-[18px]" strokeWidth={2} />
                                  </span>
                                  {item.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                    <ActionLink
                      href={link.to}
                      variant="text"
                      arrow
                      onClick={onNavigate}
                      className="mt-3"
                    >
                      {THREAD_COPY.menu.viewAll[kind]}
                    </ActionLink>
                  </div>
                </li>
              );
            }
            return (
              <li key={link.label}>
                <Link
                  to={link.to}
                  {...(link.hash ? { hash: link.hash } : {})}
                  onClick={onNavigate}
                  aria-current={isActive(pathname, link) ? "page" : undefined}
                  className={row}
                >
                  {link.label}
                  <ArrowRight aria-hidden="true" className="size-5 text-rpk-slate" />
                </Link>
              </li>
            );
          })}
        </ul>
        <Exchange
          className="mt-10"
          question={<QuestionPill size="md">{THREAD_COPY.footer.question}</QuestionPill>}
          answer={
            <ActionLink href="/contact" arrow onClick={onNavigate}>
              {THREAD_COPY.footer.answer}
            </ActionLink>
          }
        />
      </nav>

      {auth.enabled && (auth.isLoggedIn || auth.loginUrl || auth.signupUrl) && (
        <div className="shrink-0 border-t border-rpk-mist bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {auth.isLoggedIn ? (
            <div className="space-y-3">
              <p className="text-[15px] font-semibold text-rpk-ink">{auth.welcome}</p>
              <div className="grid grid-cols-2 gap-2">
                {auth.panelUrl && (
                  <ActionLink href={auth.panelUrl} className="w-full">
                    {auth.labels.panel}
                  </ActionLink>
                )}
                <ActionButton
                  variant="outline"
                  onClick={auth.logout}
                  className={cx("w-full", !auth.panelUrl && "col-span-2")}
                >
                  {auth.labels.logout}
                </ActionButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {auth.loginUrl && (
                <ActionLink
                  href={auth.loginUrl}
                  variant="outline"
                  className={cx("w-full", !auth.signupUrl && "col-span-2")}
                >
                  {auth.labels.login}
                </ActionLink>
              )}
              {auth.signupUrl && (
                <ActionLink
                  href={auth.signupUrl}
                  className={cx("w-full", !auth.loginUrl && "col-span-2")}
                >
                  {auth.labels.signup}
                </ActionLink>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */

function Header() {
  const { brand } = useRespok();
  const auth = useRespokAuth();
  const { products, solutions } = useRespokCatalogNav();
  const catalog: Record<MenuKind, NavCategory[]> = { products, solutions };
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  const returnFocus = useRef(false);

  /** Close button / Escape: focus goes back to the menu button. */
  const closeMobile = useCallback(() => {
    returnFocus.current = true;
    setMobileOpen(false);
  }, []);
  /** A link was chosen: the router takes over. */
  const navigateMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen || !returnFocus.current) return;
    returnFocus.current = false;
    toggleRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) setMobileOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full bg-white/95 pr-2 pl-5 shadow-[0_1px_2px_rgb(22_20_43/0.06),0_14px_36px_-18px_rgb(22_20_43/0.35)] ring-1 ring-rpk-mist backdrop-blur-md sm:pl-6">
        <Link
          to="/"
          aria-label={`${brand} home`}
          className="mr-2 inline-flex shrink-0 items-center rounded-md"
        >
          <RespokLogo concept="thread" height={26} title="" />
        </Link>

        <nav aria-label={THREAD_COPY.menu.primary} className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {PRIMARY_NAV.map((link) => {
              const kind = link.menu;
              if (kind && catalog[kind].length > 0)
                return (
                  <li key={link.label}>
                    <NavMenu
                      link={link}
                      kind={kind}
                      categories={catalog[kind]}
                      pathname={pathname}
                    />
                  </li>
                );
              const active = isActive(pathname, link);
              return (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    {...(link.hash ? { hash: link.hash } : {})}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "inline-flex h-11 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-200",
                      active
                        ? "bg-rpk-paper text-rpk-ink"
                        : "text-rpk-ink/80 hover:bg-rpk-paper hover:text-rpk-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {auth.isLoggedIn ? (
            <div className="hidden items-center gap-1.5 lg:flex">
              <span className="hidden max-w-[16rem] truncate px-2 text-[14px] font-semibold text-rpk-slate xl:inline">
                {auth.welcome}
              </span>
              {auth.panelUrl && (
                <ActionLink href={auth.panelUrl} size="sm" className="!h-11 !px-5">
                  {auth.labels.panel}
                </ActionLink>
              )}
              <ActionButton variant="ghost" size="sm" onClick={auth.logout} className="!h-11">
                {auth.labels.logout}
              </ActionButton>
            </div>
          ) : (
            <>
              {auth.loginUrl && (
                <ActionLink
                  href={auth.loginUrl}
                  variant="ghost"
                  size="sm"
                  className="!hidden !h-11 lg:!inline-flex"
                >
                  {auth.labels.login}
                </ActionLink>
              )}
              {auth.signupUrl && (
                <ActionLink
                  href={auth.signupUrl}
                  size="sm"
                  className="!hidden !h-11 min-[360px]:!inline-flex sm:!px-5"
                >
                  {auth.labels.signup}
                </ActionLink>
              )}
            </>
          )}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls={mobileOpen ? sheetId : undefined}
            aria-label={THREAD_COPY.menu.open}
            className="inline-flex size-12 items-center justify-center rounded-full bg-rpk-ink text-white transition-transform duration-200 ease-rpk-spring hover:scale-[1.06] active:scale-[.94] lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <MobileSheet
          id={sheetId}
          onClose={closeMobile}
          onNavigate={navigateMobile}
          catalog={catalog}
          pathname={pathname}
        />
      )}
    </header>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

function Footer() {
  const { brand } = useRespok();
  const footer = useRespokFooter();
  const social = useSocialLinks();

  return (
    <footer className="relative mt-auto overflow-hidden bg-rpk-ink text-white">
      <Container className="pt-20 pb-10 sm:pt-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <Exchange
            question={
              <Reveal effect="from-left">
                <QuestionPill tone="white" size="xl">
                  {THREAD_COPY.footer.question}
                </QuestionPill>
              </Reveal>
            }
            answer={
              <Reveal effect="from-right" delay={120}>
                <ActionLink
                  href="/contact"
                  size="lg"
                  arrow
                  className="!h-14 !px-8 !text-[18px] sm:!h-16 sm:!text-[22px]"
                >
                  {THREAD_COPY.footer.answer}
                </ActionLink>
              </Reveal>
            }
          />
          {(footer.email || social.length > 0) && (
            <div className="flex flex-col gap-4 lg:items-end">
              {footer.email && (
                <p>
                  <span className="sr-only">{THREAD_COPY.footer.email}: </span>
                  <a
                    href={`mailto:${footer.email}`}
                    className="rounded-md font-rpk-mono text-[15px] text-white underline decoration-white/30 underline-offset-[6px] transition-colors hover:decoration-rpk-signal"
                  >
                    {footer.email}
                  </a>
                </p>
              )}
              {social.length > 0 && (
                <ul aria-label={THREAD_COPY.footer.follow} className="flex flex-wrap gap-2">
                  {social.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.name} (opens in a new tab)`}
                        className={cx(
                          "inline-flex h-11 min-w-11 items-center justify-center px-4 text-[14px] font-semibold text-white ring-1 ring-white/25 ring-inset transition-colors duration-200 hover:bg-rpk-ink-raised",
                          SHAPE.answer,
                        )}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="mt-16 grid gap-14 border-t border-rpk-ink-line pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div>
            <Link to="/" aria-label={`${brand} home`} className="inline-block rounded-md">
              <RespokLogo
                concept="thread"
                variant="stacked"
                colorway="reversed"
                height={92}
                title=""
              />
            </Link>
            <p className="mt-6 max-w-[22rem] text-[16px] leading-[1.55] text-white/70">
              {THREAD_COPY.footer.tagline}
            </p>
          </div>

          <nav
            aria-label={THREAD_COPY.footer.nav}
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="font-rpk-mono text-[12px] tracking-[0.08em] text-white/60 uppercase">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-0.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="inline-flex min-h-10 items-center rounded-md text-[15px] font-medium text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-rpk-ink-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-rpk-mono text-[12px] tracking-[0.04em] text-white/60">
            {footer.copyright}
          </p>
          {footer.trustBadgeHtml && (
            <div className="rounded-[18px] bg-white p-2">
              <TrustBadge html={footer.trustBadgeHtml} />
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}

export function ThreadShell({ children }: RespokShellProps) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <a
        href="#main"
        className={cx(
          "fixed top-3 left-3 z-[100] -translate-y-24 bg-rpk-ink px-5 py-3 text-[15px] font-semibold text-white transition-transform focus:translate-y-0",
          SHAPE.question,
        )}
      >
        {THREAD_COPY.skip}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
