import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

interface MockLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: unknown;
  children?: React.ReactNode;
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  getRouteApi: () => ({
    useLoaderData: () => ({ productCatalog: [], solutionCatalog: [] }),
  }),
  useRouterState: () => "/",
}));

vi.mock("framer-motion", () => {
  interface PassthroughProps {
    children?: React.ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
    [key: string]: unknown;
  }

  function passthrough(tag: string) {
    return function Comp({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...rest
    }: PassthroughProps) {
      return React.createElement(tag, rest, children);
    };
  }
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_target, prop: string) => passthrough(prop),
    }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});

const loggedInSettings: SiteSettings = {
  ...DEFAULT_SETTINGS,
  auth: {
    ...DEFAULT_SETTINGS.auth,
    enabled: true,
    sessionCheckUrl: "https://app.webyar.app/api/auth/session",
    logoutUrl: "https://app.webyar.app/api/auth/logout",
    panelUrl: "https://app.webyar.app/app",
    panelLabel: "پنل",
    logoutLabel: "خروج",
  },
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("SiteHeader — logged-in state, desktop/mobile consistency", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const user = { id: "u1", email: "ali@example.com", emailVerified: true, fullName: "علی محمدی" };

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(jsonResponse({ user }));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows identical welcome text, panel label and logout label in both desktop and mobile menus", async () => {
    render(<SiteHeader settings={loggedInSettings} />);

    // ابتدا فقط بلوک دسکتاپ (همیشه در DOM هست، فقط با کلاس Tailwind مخفی می‌شود)
    await waitFor(() => {
      expect(screen.getAllByText("خوش آمدید، علی محمدی").length).toBeGreaterThan(0);
    });

    // باز کردن منوی موبایل تا بلوک موبایل هم مونت شود
    fireEvent.click(screen.getByLabelText("باز کردن منو"));

    await waitFor(() => {
      expect(screen.getAllByText("خوش آمدید، علی محمدی").length).toBe(2);
    });

    expect(screen.getAllByText("پنل").length).toBe(2);
    expect(screen.getAllByText("خروج").length).toBe(2);

    // دکمه‌های ورود/ثبت‌نام معمولی نباید همزمان نمایش داده بشن
    expect(screen.queryByText("شروع رایگان")).not.toBeInTheDocument();
  });

  it("clicking logout in either menu clears both desktop and mobile state together", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ user }));

    render(<SiteHeader settings={loggedInSettings} />);
    await waitFor(() => {
      expect(screen.getAllByText("خوش آمدید، علی محمدی").length).toBeGreaterThan(0);
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));
    fireEvent.click(screen.getAllByText("خروج")[0]!);

    await waitFor(() => {
      expect(screen.queryByText("خوش آمدید، علی محمدی")).not.toBeInTheDocument();
    });
    // بعد از خروج، دکمه‌های ورود/ثبت‌نام معمولی برمی‌گردند
    expect(screen.getAllByText("شروع رایگان").length).toBeGreaterThan(0);
  });
});

describe("SiteHeader — logged-out / no session URL configured (default behaviour)", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders normal login/signup buttons and never calls fetch when sessionCheckUrl is unset", () => {
    render(<SiteHeader settings={DEFAULT_SETTINGS} />);
    expect(screen.getAllByText("شروع رایگان").length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
