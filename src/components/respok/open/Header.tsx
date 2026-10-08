import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { getIcon } from "@/lib/icon-registry";
import { RespokLogo } from "../RespokLogo";
import { useRespok } from "../shared/context";
import { useRespokAuth } from "../shared/auth";
import { useRespokFooter } from "../shared/footer";
import {
  PRIMARY_NAV,
  useRespokCatalogNav,
  type NavCategory,
  type NavLinkItem,
} from "../shared/nav";
import { OPEN_COPY } from "./copy";
import { ActionLink, Dot } from "./ui";
import { buttonClass, cx, pad } from "./tokens";

type MenuKey = "products" | "solutions";

const MENU_BASE: Record<MenuKey, "/products" | "/solutions"> = {
  products: "/products",
  solutions: "/solutions",
};

function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (link: NavLinkItem) => {
    if (link.hash) return false;
    const clean = pathname.replace(/\/+$/, "") || "/";
    if (link.to === "/") return clean === "/";
    // Tag pages are part of the blog.
    if (link.to === "/blog" && clean.startsWith("/tag/")) return true;
    return clean === link.to || clean.startsWith(`${link.to}/`);
  };
}

/* ─── Mega panel ────────────────────────────────────────────────────────── */

function MegaPanel({
  id,
  kind,
  categories,
  anchor,
  container,
  onNavigate,
  onPointerEnter,
  onPointerLeave,
}: {
  id: string;
  kind: MenuKey;
  categories: NavCategory[];
  anchor: HTMLButtonElement | null;
  container: RefObject<HTMLDivElement | null>;
  onNavigate: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const base = MENU_BASE[kind];

  useLayoutEffect(() => {
    function place() {
      const trigger = anchor;
      const frame = container.current;
      if (!trigger || !frame) return;
      const t = trigger.getBoundingClientRect();
      const c = frame.getBoundingClientRect();
      const viewport = window.innerWidth;
      // The square corner sits under the trigger: shrink the panel to fit beside it,
      // and only slide it left when even the narrowest panel would not fit.
      const wanted = t.left - 14;
      const width = Math.min(780, Math.max(560, viewport - wanted - 16), viewport - 32);
      const left = Math.min(Math.max(16, wanted), viewport - width - 16);
      setBox({ left: left - c.left, width });
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchor, container]);

  return (
    <div
      ref={panelRef}
      id={id}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        left: box?.left ?? 0,
        width: box?.width ?? 780,
        visibility: box ? "visible" : "hidden",
      }}
      className="rpk-o-grow-tl absolute top-[calc(100%+10px)] z-50 rounded-[28px] rounded-tl-[6px] bg-white p-7 text-rpk-ink shadow-rpk-panel"
    >
      <div className="columns-2 gap-x-10">
        {categories.map((category) => (
          <div
            key={category.id}
            role="group"
            aria-labelledby={`${id}-${category.id}`}
            className="mb-7 break-inside-avoid"
          >
            <p
              id={`${id}-${category.id}`}
              className="border-b-2 border-rpk-ink pb-2 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase"
            >
              {category.title}
            </p>
            <ul>
              {category.items.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <li key={item.id} className="border-b border-rpk-mist last:border-b-0">
                    <Link
                      to={`${base}/$slug`}
                      params={{ slug: item.slug }}
                      onClick={onNavigate}
                      className="group/item -mx-2 flex items-start gap-3 rounded-[14px] rounded-br-[4px] px-2 py-3 transition-colors hover:bg-rpk-paper"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[12px] rounded-br-[3px] bg-rpk-paper text-rpk-ink transition-colors group-hover/item:bg-rpk-ink group-hover/item:text-white"
                      >
                        <Icon className="size-[18px]" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[15px] leading-[1.3] font-semibold">
                          {item.title}
                          <Dot
                            size={6}
                            className="scale-0 transition-transform duration-300 ease-rpk-pop group-hover/item:scale-100"
                          />
                        </span>
                        {item.shortDesc ? (
                          <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.45] text-rpk-slate">
                            {item.shortDesc}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="-mx-7 -mb-7 flex items-center justify-between gap-4 rounded-br-[28px] rounded-bl-[28px] border-t border-rpk-mist bg-rpk-paper px-7 py-4">
        <Link
          to={base}
          onClick={onNavigate}
          className="group/all inline-flex items-center gap-2 rounded-[4px] text-[15px] font-semibold text-rpk-ink"
        >
          {OPEN_COPY.nav.viewAll[kind]}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover/all:translate-x-1"
          />
        </Link>
        <span className="font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
          {pad(categories.reduce((sum, c) => sum + c.items.length, 0))} ·{" "}
          {kind === "products" ? "Products" : "Solutions"}
        </span>
      </div>
    </div>
  );
}

/* ─── Desktop navigation ────────────────────────────────────────────────── */

function DesktopNav({ container }: { container: RefObject<HTMLDivElement | null> }) {
  const catalog = useRespokCatalogNav();
  const isActive = useIsActive();
  const [open, setOpen] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const triggers = useRef<Record<MenuKey, HTMLButtonElement | null>>({
    products: null,
    solutions: null,
  });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseId = useId();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 180);
  };

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && navRef.current?.contains(target)) return;
      if (target && container.current?.contains(target)) {
        const panel = document.getElementById(`${baseId}-${open}`);
        if (panel?.contains(target)) return;
      }
      setOpen(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        const trigger = triggers.current[open];
        setOpen(null);
        trigger?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, baseId, container]);

  const onTriggerKey = (key: MenuKey) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(key);
      requestAnimationFrame(() => {
        document.getElementById(`${baseId}-${key}`)?.querySelector<HTMLElement>("a")?.focus();
      });
    }
  };

  const onBlurWithin = (event: ReactFocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (!next) return;
    const panel = open ? document.getElementById(`${baseId}-${open}`) : null;
    if (navRef.current?.contains(next) || panel?.contains(next)) return;
    setOpen(null);
  };

  const linkClass = (active: boolean) =>
    cx(
      "relative inline-flex h-10 items-center gap-2 rounded-[12px] rounded-br-[3px] px-3 text-[15px] font-medium transition-colors",
      active ? "text-white" : "text-white/70 hover:text-white",
    );

  return (
    <nav
      ref={navRef}
      aria-label={OPEN_COPY.nav.main}
      className="hidden lg:block"
      onBlur={onBlurWithin}
    >
      <ul className="flex items-center gap-1">
        {PRIMARY_NAV.map((link) => {
          const menu = link.menu;
          const categories = menu ? catalog[menu] : [];
          if (menu && categories.length > 0) {
            const expanded = open === menu;
            const panelId = `${baseId}-${menu}`;
            const active = isActive(link);
            return (
              <li
                key={link.label}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  cancelClose();
                  setOpen(menu);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType !== "mouse") return;
                  closeSoon();
                }}
              >
                <button
                  ref={(node) => {
                    triggers.current[menu] = node;
                  }}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={expanded ? panelId : undefined}
                  onClick={() => setOpen(expanded ? null : menu)}
                  onKeyDown={onTriggerKey(menu)}
                  className={linkClass(expanded || active)}
                >
                  <Dot
                    size={6}
                    className={cx(
                      "transition-transform duration-300 ease-rpk-pop",
                      expanded || active ? "scale-100" : "scale-0",
                    )}
                  />
                  {link.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={cx(
                      "size-3.5 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                {expanded ? (
                  <MegaPanel
                    id={panelId}
                    kind={menu}
                    categories={categories}
                    anchor={triggers.current[menu]}
                    container={container}
                    onNavigate={() => setOpen(null)}
                    onPointerEnter={cancelClose}
                    onPointerLeave={closeSoon}
                  />
                ) : null}
              </li>
            );
          }
          const active = isActive(link);
          return (
            <li key={link.label}>
              <Link
                to={link.to}
                {...(link.hash ? { hash: link.hash } : {})}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                <Dot
                  size={6}
                  className={cx(
                    "transition-transform duration-300 ease-rpk-pop",
                    active ? "scale-100" : "-ml-2 scale-0",
                  )}
                />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Auth ──────────────────────────────────────────────────────────────── */

function AuthActions({ layout }: { layout: "bar" | "sheet" }) {
  const auth = useRespokAuth();
  if (!auth.enabled) return null;
  const sheet = layout === "sheet";
  if (auth.isLoggedIn) {
    return (
      <div className={sheet ? "grid gap-3" : "flex items-center gap-3"}>
        <span
          className={cx(
            "truncate text-[14px]",
            sheet ? "font-semibold text-rpk-ink" : "hidden max-w-[180px] text-white/70 xl:inline",
          )}
        >
          {auth.welcome}
        </span>
        {auth.panelUrl ? (
          <ActionLink
            to={auth.panelUrl}
            variant="primary"
            size={sheet ? "lg" : "sm"}
            className={sheet ? "w-full" : undefined}
          >
            {auth.labels.panel}
          </ActionLink>
        ) : null}
        <button
          type="button"
          onClick={auth.logout}
          className={cx(
            buttonClass("secondary", sheet ? "paper" : "ink", sheet ? "lg" : "sm"),
            sheet && "w-full",
          )}
        >
          {auth.labels.logout}
        </button>
      </div>
    );
  }
  if (!auth.loginUrl && !auth.signupUrl) return null;
  return (
    <div className={sheet ? "grid gap-3" : "flex items-center gap-2"}>
      {sheet && auth.signupUrl ? (
        <ActionLink to={auth.signupUrl} variant="primary" size="lg" className="w-full">
          {auth.labels.signup}
        </ActionLink>
      ) : null}
      {auth.loginUrl ? (
        sheet ? (
          <ActionLink to={auth.loginUrl} variant="secondary" size="lg" className="w-full">
            {auth.labels.login}
          </ActionLink>
        ) : (
          <a
            href={auth.loginUrl}
            className="inline-flex h-11 items-center rounded-[12px] rounded-br-[3px] px-3 text-[15px] font-medium text-white/80 transition-colors hover:text-white"
          >
            {auth.labels.login}
          </a>
        )
      ) : null}
      {!sheet && auth.signupUrl ? (
        <ActionLink to={auth.signupUrl} variant="primary" size="sm">
          {auth.labels.signup}
        </ActionLink>
      ) : null}
    </div>
  );
}

/* ─── Mobile sheet ──────────────────────────────────────────────────────── */

function MobileSheet({
  id,
  onClose,
  toggle,
}: {
  id: string;
  onClose: () => void;
  toggle: RefObject<HTMLButtonElement | null>;
}) {
  const catalog = useRespokCatalogNav();
  const isActive = useIsActive();
  const { email } = useRespokFooter();
  const [expanded, setExpanded] = useState<MenuKey | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        toggle.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      // Keep focus inside the sheet and the toggle that closes it.
      const nodes = [
        toggle.current,
        ...sheetRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"),
      ].filter((node): node is HTMLElement => !!node);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, toggle]);

  const rowClass =
    "flex min-h-[60px] w-full items-center gap-4 py-3 text-left text-[22px] font-bold tracking-[-0.01em] text-rpk-ink";

  return (
    <div className="fixed inset-x-0 top-[64px] bottom-0 z-40 lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-rpk-ink/70 backdrop-blur-sm"
      />
      <div
        ref={sheetRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={OPEN_COPY.nav.sheet}
        className="rpk-o-grow-tr absolute inset-x-2 top-2 bottom-2 flex flex-col overflow-hidden rounded-[28px] rounded-tr-[6px] bg-white shadow-rpk-panel"
      >
        <nav
          aria-label={OPEN_COPY.nav.main}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-6"
        >
          <ul>
            {PRIMARY_NAV.map((link, index) => {
              const menu = link.menu;
              const categories = menu ? catalog[menu] : [];
              const number = (
                <span className="w-7 shrink-0 font-rpk-mono text-[12px] font-normal tracking-[0.06em] text-rpk-slate">
                  {pad(index + 1)}
                </span>
              );
              if (menu && categories.length > 0) {
                const open = expanded === menu;
                const regionId = `${baseId}-${menu}`;
                return (
                  <li key={link.label} className="border-b border-rpk-mist">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={regionId}
                      onClick={() => setExpanded(open ? null : menu)}
                      className={rowClass}
                    >
                      {number}
                      <span className="flex-1">{link.label}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cx(
                          "size-5 text-rpk-slate transition-transform duration-200",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    <div id={regionId} hidden={!open} className="pb-4 pl-11">
                      {categories.map((category) => (
                        <div key={category.id} className="mb-4">
                          <p className="mb-1 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
                            {category.title}
                          </p>
                          <ul>
                            {category.items.map((item) => {
                              const Icon = getIcon(item.icon);
                              return (
                                <li key={item.id}>
                                  <Link
                                    to={`${MENU_BASE[menu]}/$slug`}
                                    params={{ slug: item.slug }}
                                    onClick={onClose}
                                    className="flex min-h-11 items-center gap-3 rounded-[12px] rounded-br-[3px] py-2 text-[16px] font-medium text-rpk-ink"
                                  >
                                    <Icon
                                      aria-hidden="true"
                                      className="size-[18px] shrink-0 text-rpk-slate"
                                      strokeWidth={1.75}
                                    />
                                    {item.title}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                      <Link
                        to={MENU_BASE[menu]}
                        onClick={onClose}
                        className="inline-flex min-h-11 items-center gap-2 rounded-[4px] text-[15px] font-semibold text-rpk-signal-deep"
                      >
                        {OPEN_COPY.nav.viewAll[menu]}
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </div>
                  </li>
                );
              }
              const active = isActive(link);
              return (
                <li key={link.label} className="border-b border-rpk-mist">
                  <Link
                    to={link.to}
                    {...(link.hash ? { hash: link.hash } : {})}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={rowClass}
                  >
                    {number}
                    <span className="flex-1">{link.label}</span>
                    {active ? <Dot size={10} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          {email ? (
            <p className="mt-8 font-rpk-mono text-[12px] tracking-[0.08em] text-rpk-slate uppercase">
              {OPEN_COPY.footer.email}
              <a
                href={`mailto:${email}`}
                className="mt-1 block rounded-[4px] font-rpk text-[16px] font-semibold tracking-normal text-rpk-ink normal-case underline decoration-rpk-signal decoration-2 underline-offset-[5px]"
              >
                {email}
              </a>
            </p>
          ) : null}
        </nav>
        <div className="border-t border-rpk-mist bg-rpk-paper px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <AuthActions layout="sheet" />
        </div>
      </div>
    </div>
  );
}

/* ─── Header ────────────────────────────────────────────────────────────── */

export function OpenHeader() {
  const { brand } = useRespok();
  const [sheetOpen, setSheetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const sheetId = useId();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const close = useCallback(() => setSheetOpen(false), []);

  useEffect(() => setSheetOpen(false), [pathname]);
  useEffect(() => {
    if (!sheetOpen) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => media.matches && setSheetOpen(false);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [sheetOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-rpk-ink text-white">
        <div
          ref={containerRef}
          className="relative mx-auto flex h-16 w-full max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-10"
        >
          <Link
            to="/"
            aria-label={OPEN_COPY.home(brand)}
            className="-m-1 inline-flex shrink-0 items-center rounded-[10px] p-1"
          >
            <RespokLogo concept="open" colorway="reversed" height={28} title="" />
          </Link>
          <div className="flex flex-1 items-center">
            <DesktopNav container={containerRef} />
          </div>
          <div className="hidden lg:block">
            <AuthActions layout="bar" />
          </div>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={sheetOpen}
            aria-controls={sheetId}
            aria-label={sheetOpen ? OPEN_COPY.nav.close : OPEN_COPY.nav.open}
            onClick={() => setSheetOpen((value) => !value)}
            className={cx(
              "grid size-11 place-items-center rounded-[16px] rounded-tr-[4px] transition-colors lg:hidden",
              sheetOpen ? "bg-white text-rpk-ink" : "bg-white/[0.08] text-white hover:bg-white/15",
            )}
          >
            {sheetOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </header>
      {sheetOpen ? <MobileSheet id={sheetId} onClose={close} toggle={toggleRef} /> : null}
    </>
  );
}
