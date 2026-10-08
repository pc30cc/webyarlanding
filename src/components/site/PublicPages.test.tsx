import { beforeAll, describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { SiteLanguageProvider } from "./SiteLanguage";
import { DEFAULT_SETTINGS, type EnglishTemplate } from "@/lib/settings";
import { loadRespokTemplate } from "@/components/respok/registry";

const state = vi.hoisted(() => ({
  data: {} as Record<string, unknown>,
  pathname: "/",
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: unknown) => ({
    options,
    fullPath: path,
    useLoaderData: () => state.data[path.replace(/\/$/, "") || "/"],
    useSearch: () => ({}),
  }),
  getRouteApi: () => ({ useLoaderData: () => state.data["root"] }),
  Link: ({
    children,
    to,
    params: _params,
    hash: _hash,
    search: _search,
    activeProps: _activeProps,
    inactiveProps: _inactiveProps,
    activeOptions: _activeOptions,
    preload: _preload,
    resetScroll: _resetScroll,
    ...props
  }: {
    children: ReactNode;
    to: string;
    params?: unknown;
    hash?: unknown;
    search?: unknown;
    activeProps?: unknown;
    inactiveProps?: unknown;
    activeOptions?: unknown;
    preload?: unknown;
    resetScroll?: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: state.pathname, hash: "", search: {} }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: state.pathname } }),
  useNavigate: () => vi.fn(),
  notFound: () => new Error("not found"),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/settings.functions", () => ({ fetchSettings: vi.fn() }));
vi.mock("@/lib/seo.functions", () => ({ getPublicSeoPage: vi.fn() }));
vi.mock("@/lib/apps.functions", () => ({
  getPublicApps: vi.fn(),
  getPublicApp: vi.fn(),
}));
vi.mock("@/lib/catalog.functions", () => ({
  getPublicCatalog: vi.fn(),
  getPublicCatalogItem: vi.fn(),
}));
vi.mock("@/lib/plans.functions", () => ({
  getPublicPlans: vi.fn(),
  fetchPublicPlans: vi.fn(),
}));
vi.mock("@/lib/blog.functions", () => ({
  getPublishedPost: vi.fn(),
  listPublishedPosts: vi.fn(),
  listPublishedPostsPage: vi.fn(),
  listCategories: vi.fn(),
  BLOG_PAGE_SIZE: 9,
}));
vi.mock("@/lib/contact.functions", () => ({ submitContactMessage: vi.fn() }));
vi.mock("@/lib/captcha.functions", () => ({ getCaptchaChallenge: vi.fn() }));

import { Route as Home } from "@/routes/index";
import { Route as About } from "@/routes/about";
import { Route as Pricing } from "@/routes/pricing";
import { Route as Products } from "@/routes/products.index";
import { Route as Product } from "@/routes/products.$slug";
import { Route as Solutions } from "@/routes/solutions.index";
import { Route as Solution } from "@/routes/solutions.$slug";
import { Route as Download } from "@/routes/download.index";
import { Route as App } from "@/routes/download.$slug";
import { Route as Contact } from "@/routes/contact";
import { Route as Sla } from "@/routes/sla";
import { Route as Help } from "@/routes/help";
import { Route as Terms } from "@/routes/terms";
import { Route as Privacy } from "@/routes/privacy";
import { Route as Blog } from "@/routes/blog.index";
import { Route as Post } from "@/routes/blog.$slug";
import { Route as Tag } from "@/routes/tag.$slug";

const routes = [
  ["/", Home],
  ["/about", About],
  ["/pricing", Pricing],
  ["/products", Products],
  ["/products/$slug", Product],
  ["/solutions", Solutions],
  ["/solutions/$slug", Solution],
  ["/download", Download],
  ["/download/$slug", App],
  ["/contact", Contact],
  ["/sla", Sla],
  ["/help", Help],
  ["/terms", Terms],
  ["/privacy", Privacy],
  ["/blog", Blog],
  ["/blog/$slug", Post],
  ["/tag/$slug", Tag],
] as const;

type RouteEntry = (typeof routes)[number];

/** Server-renders one public route component with the test fixtures. */
function renderRoute(
  [path, route]: RouteEntry,
  language: "fa" | "en",
  template: EnglishTemplate = "open",
) {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  settings.localization.englishTemplate = template;
  settings.brand.legalEnglishChrome = false;
  settings.localization.english = {
    "عنوان مقاله آزمایشی": "Sample article",
    "# متن مقاله آزمایشی": "# Sample article content",
  };
  const item = {
    id: "1",
    title: "چت زنده",
    shortDesc: "چت زنده",
    description: "چت زنده",
    bullets: ["چت زنده"],
    slug: "chat",
    icon: "MessageSquare",
  };
  const app = {
    id: "1",
    platform: "ios",
    name: "وب‌یار برای آیفون",
    subtitle: "صندوق گفتگو و تماس، در جیب شما",
    shortDesc: "چت زنده",
    description: "چت زنده",
    features: ["چت زنده"],
    screenshots: [],
    downloadUrl: "",
    slug: "ios",
    version: "1.0",
    size: "",
    minOs: "",
  };
  const post = {
    id: "1",
    slug: "sample",
    title: "عنوان مقاله آزمایشی",
    excerpt: "چت زنده",
    content: "# متن مقاله آزمایشی",
    author: "سارا احمدی",
    tags: [],
    publishedAt: "2026-10-04T00:00:00Z",
    createdAt: "2026-10-04T00:00:00Z",
    updatedAt: "2026-10-04T00:00:00Z",
    coverImage: "",
  };
  state.pathname = path;
  state.data["root"] = {
    settings,
    productCatalog: [],
    solutionCatalog: [],
  };
  state.data[path] = {
    settings,
    seoOverride: null,
    apps: [app],
    app,
    others: [],
    categories: [],
    item,
    categoryTitle: "محصولات",
    related: [],
    remotePlans: null,
    page: { posts: [post], page: 1, total: 1, pageSize: 9 },
    post,
    posts: [post],
    slug: "CRM",
  };
  const Component = route.options.component as ComponentType;
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SiteLanguageProvider settings={settings}>
        <Component />
      </SiteLanguageProvider>
    </QueryClientProvider>,
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("script,style").forEach((node) => node.remove());
  return { container, post };
}

/** Blog content keeps its original language; strip it before checking the UI. */
function stripPostContent(
  container: HTMLElement,
  path: string,
  post: { title: string; excerpt: string; author: string },
) {
  if (!path.startsWith("/blog") && !path.startsWith("/tag")) return;
  expect(container.textContent).toContain(post.title);
  if (path === "/blog/$slug")
    expect(container.textContent).toContain("متن مقاله آزمایشی");
  for (const element of container.querySelectorAll("*")) {
    for (const attr of ["alt", "aria-label", "title"]) {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, value.replace(post.title, ""));
    }
  }
  for (const node of container.querySelectorAll("*")) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3)
        child.textContent =
          child.textContent
            ?.replace(post.title, "")
            .replace(post.excerpt, "")
            .replace(post.author, "")
            .replace("متن مقاله آزمایشی", "") ?? "";
    }
  }
}

for (const template of ["open", "thread"] as const) {
  describe(`public pages in English (${template} template)`, () => {
    beforeAll(async () => {
      await loadRespokTemplate(template);
    });
    for (const entry of routes) {
      const [path] = entry;
      it("renders " + path + " without Persian UI text", () => {
        const { container, post } = renderRoute(entry, "en", template);
        const root = container.querySelector(".respok");
        expect(root?.getAttribute("dir")).toBe("ltr");
        expect(root?.getAttribute("data-template")).toBe(template);
        expect(container.querySelector(".site-theme")).toBeNull();
        expect(container.querySelectorAll("h1").length).toBe(1);
        stripPostContent(container, path, post);
        const persian = container.textContent?.match(
          /[\u0600-\u06ff][\u0600-\u06ff\s،]*/g,
        );
        expect(persian, path + ": " + persian?.join(" | ")).toBeNull();
        for (const element of container.querySelectorAll(
          "[alt],[title],[placeholder],[aria-label]",
        )) {
          for (const attribute of ["alt", "title", "placeholder", "aria-label"]) {
            expect(
              element.getAttribute(attribute) || "",
              path + " " + attribute,
            ).not.toMatch(/[\u0600-\u06ff]/);
          }
        }
        expect(container.textContent).not.toMatch(/\bWebyar\b/);
      });
    }
  });
}

describe("public pages in Persian", () => {
  for (const entry of routes) {
    it("keeps the Persian design for " + entry[0], () => {
      const { container } = renderRoute(entry, "fa");
      expect(container.querySelector(".respok")).toBeNull();
      expect(container.querySelector(".site-theme")?.getAttribute("dir")).toBe(
        "rtl",
      );
    });
  }
});
