import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { SiteLanguageProvider } from "./SiteLanguage";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { Locale } from "@/lib/locales";
import englishMessages from "@/lib/site-translations.en.json";
import turkishMessages from "@/lib/site-translations.tr.json";
import arabicMessages from "@/lib/site-translations.ar.json";
import { LEGAL_AR } from "@/lib/legal-ar";
import { LEGAL_TR } from "@/lib/legal-tr";

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
    ...props
  }: {
    children: ReactNode;
    to: string;
    params?: unknown;
    hash?: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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
  language: Locale,
  data: Record<string, unknown> = {},
) {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
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
  // دیکشنری همان زبان، مثل loader ریشه
  const dictionaries: Partial<Record<Locale, Record<string, string>>> = {
    en: englishMessages,
    tr: turkishMessages,
    ar: arabicMessages,
  };
  const messages: Record<string, string> = dictionaries[language] ?? {};
  state.pathname = path;
  state.data["root"] = {
    settings,
    productCatalog: [],
    solutionCatalog: [],
    locale: language,
    messages,
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
    ...data,
    page: { posts: [post], page: 1, total: 1, pageSize: 9 },
    post,
    posts: [post],
    slug: "CRM",
  };
  const Component = route.options.component as ComponentType;
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SiteLanguageProvider settings={settings} locale={language} messages={messages}>
        <Component />
      </SiteLanguageProvider>
    </QueryClientProvider>,
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("script,style").forEach((node) => node.remove());
  return { container, post, html };
}

describe("public pages in English", () => {
  for (const entry of routes) {
    const path = entry[0];
    it("renders " + path + " without Persian UI text", () => {
      const { container, post } = renderRoute(entry, "en");
      if (path.startsWith("/blog") || path.startsWith("/tag")) {
        expect(container.textContent).toContain(post.title);
        if (path === "/blog/$slug") expect(container.textContent).toContain("متن مقاله آزمایشی");
        for (const element of container.querySelectorAll("*")) {
          for (const attr of ["alt", "aria-label"]) {
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
      const persian = container.textContent?.match(/[\u0600-\u06ff][\u0600-\u06ff\s،]*/g);
      expect(persian, path + ": " + persian?.join(" | ")).toBeNull();
      for (const element of container.querySelectorAll(
        "[alt],[title],[placeholder],[aria-label]",
      )) {
        for (const attribute of ["alt", "title", "placeholder", "aria-label"]) {
          expect(element.getAttribute(attribute) || "", path + " " + attribute).not.toMatch(
            /[\u0600-\u06ff]/,
          );
        }
      }
      expect(container.querySelector(".site-theme")?.getAttribute("dir")).toBe("ltr");
      expect(container.querySelector(".site-theme")?.getAttribute("lang")).toBe("en");
    });
  }
});

describe("public pages in Persian", () => {
  for (const entry of routes) {
    it("keeps the Persian design for " + entry[0], () => {
      const { container } = renderRoute(entry, "fa");
      expect(container.querySelector(".site-theme")?.getAttribute("dir")).toBe("rtl");
      expect(container.querySelector(".site-theme")?.getAttribute("lang")).toBe("fa");
    });
  }
});

describe("public pages in other languages", () => {
  for (const [locale, dir] of [
    ["tr", "ltr"],
    ["ar", "rtl"],
  ] as const) {
    for (const entry of routes) {
      it("uses the " + locale + " direction for " + entry[0], () => {
        const { container } = renderRoute(entry, locale);
        // صفحات حقوقی هم متن همان زبان را دارند
        expect(container.querySelector(".site-theme")?.getAttribute("dir")).toBe(dir);
        expect(container.querySelector(".site-theme")?.getAttribute("lang")).toBe(locale);
      });
    }
  }
});

describe("legal pages in Turkish and Arabic", () => {
  const route = (path: string) => routes.find(([p]) => p === path)!;
  const email = DEFAULT_SETTINGS.brand.email || "support@webyar.ai";
  const cases = [
    ["tr", "ltr", LEGAL_TR],
    ["ar", "rtl", LEGAL_AR],
  ] as const;
  const pages = [
    ["/privacy", "privacyTitle", "privacyMetaTitle"],
    ["/terms", "termsTitle", "termsMetaTitle"],
    ["/help", "helpTitle", "helpMetaTitle"],
  ] as const;

  for (const [locale, dir, pack] of cases) {
    for (const [path, titleKey, metaTitleKey] of pages) {
      it(`renders the ${locale} pack text on ${path}`, () => {
        const { container } = renderRoute(route(path), locale);
        const shell = container.querySelector(".site-theme");
        expect(shell?.getAttribute("dir")).toBe(dir);
        expect(shell?.getAttribute("lang")).toBe(locale);
        // محتوای صفحه هم جهت همان زبان را دارد
        const article = container.querySelector(`[dir="${dir}"] h1`);
        expect(article?.textContent).toBe(pack[titleKey]);
        expect(container.querySelector("h1")?.textContent).toBe(pack[titleKey]);
        const text = container.textContent ?? "";
        // نه متن انگلیسی، نه فارسی
        expect(text).not.toMatch(/Privacy Policy|Terms of Use|Support & Help Center/);
        expect(text).not.toMatch(/سیاست حریم خصوصی|قوانین استفاده|پشتیبانی و مرکز راهنما/);

        // عنوان سربرگ (head) هم از همان بسته می‌آید
        const root = state.data["root"] as { settings: typeof DEFAULT_SETTINGS };
        const settings = root.settings;
        const head = (
          route(path)[1].options as unknown as {
            head: (ctx: unknown) => { meta: { title?: string }[] };
          }
        ).head({
          loaderData: { settings, seoOverride: null },
          matches: [{ routeId: "__root__", loaderData: state.data["root"] }],
          match: {},
        });
        expect(head.meta[0]).toEqual({ title: pack[metaTitleKey] });
        expect(head.meta).toContainEqual({ name: "robots", content: "index,follow" });
      });
    }

    it(`puts spaces around the email link in ${locale} help sentences`, () => {
      const { container } = renderRoute(route("/help"), locale);
      const links = [...container.querySelectorAll(`a[href^="mailto:${email}"]`)];
      const sentences: [string, string][] = [
        [pack.deletionBefore, pack.deletionAfter],
        [pack.stuckBefore, pack.stuckAfter],
      ];
      for (const [before, after] of sentences) {
        expect(before).toMatch(/\s$/);
        expect(after).toMatch(/^\s/);
        const link = links.find((a) => a.parentElement?.textContent?.startsWith(before.trim()));
        expect(link?.textContent).toBe(email);
        expect(link?.getAttribute("dir")).toBe("ltr");
        // در متن نهایی ایمیل از دو طرف با فاصله جدا شده است
        expect(link?.parentElement?.textContent).toBe(before + email + after);
        expect(link?.parentElement?.textContent).toContain(` ${email} `);
      }
      // موضوع ایمیل حذف حساب به زبان همان صفحه است
      expect(
        links.some(
          (a) =>
            a.getAttribute("href") ===
            `mailto:${email}?subject=${encodeURIComponent(pack.deletionSubject)}`,
        ),
      ).toBe(true);
    });

    it(`puts spaces around the email in ${locale} privacy and terms sections`, () => {
      for (const path of ["/privacy", "/terms"]) {
        const { container } = renderRoute(route(path), locale);
        const blocks = [...container.querySelectorAll("p, li")]
          .map((node) => node.textContent ?? "")
          .filter((text) => text.includes(email));
        expect(blocks.length).toBeGreaterThan(0);
        // ایمیل به کلمه‌های کناری نچسبیده است (فاصله پیش از آن؛ پس از آن فاصله، نقطه یا پایان متن)
        for (const text of blocks) {
          let start = text.indexOf(email);
          while (start !== -1) {
            expect(text[start - 1] ?? " ").toMatch(/\s/);
            expect(text[start + email.length] ?? " ").toMatch(/[\s.]/);
            start = text.indexOf(email, start + email.length);
          }
        }
      }
    });
  }
});

describe("pricing with plans from the app API", () => {
  const plan = (slug: string, extra: Record<string, unknown>) => ({
    slug,
    name: slug,
    description: "",
    isFree: false,
    monthly: null,
    yearly: null,
    usdMonthly: null,
    usdYearly: null,
    features: [],
    limits: [],
    popular: false,
    ...extra,
  });
  const remotePlans = {
    plans: [
      plan("free", { isFree: true, monthly: 0, yearly: 0, usdMonthly: 0, usdYearly: 0 }),
      plan("pro", { monthly: 399000, yearly: 3990000, usdMonthly: 29, usdYearly: 290 }),
      // قیمت اعلام نشده: «تماس بگیرید»، نه رایگان
      plan("enterprise", {}),
    ],
    comparison: { columns: [], rows: [] },
  };
  const pricing = routes.find(([path]) => path === "/pricing")!;
  const offers = (html: string) =>
    [...html.matchAll(/"price":"([0-9.]+)","priceCurrency":"([A-Z]+)"/g)].map((m) => [m[1], m[2]]);

  it("shows toman on the Persian site and keeps unannounced prices as contact", () => {
    const { container } = renderRoute(pricing, "fa", { remotePlans });
    const text = container.textContent ?? "";
    expect(text).toContain("۳۹۹٬۰۰۰");
    expect(text).toContain("تومان / ماه");
    expect(text).toContain("تماس بگیرید");
    expect(text).not.toContain("$");
  });

  it("shows dollars in every other language", () => {
    for (const locale of ["en", "tr", "ar"] as const) {
      const { container } = renderRoute(pricing, locale, { remotePlans });
      const text = container.textContent ?? "";
      expect(text, locale).toContain("$29");
      expect(text, locale).not.toContain("399");
    }
    const { container } = renderRoute(pricing, "en", { remotePlans });
    expect(container.textContent).toContain("Contact us");
  });

  it("uses the page currency in the offers structured data", () => {
    const fa = renderRoute(pricing, "fa", { remotePlans });
    const en = renderRoute(pricing, "en", { remotePlans });
    // JSON-LD scripts are removed from container; read them from the raw markup instead
    expect(offers(fa.html)).toEqual([
      ["0", "IRR"],
      ["3990000", "IRR"],
    ]);
    expect(offers(en.html)).toEqual([
      ["0", "USD"],
      ["29", "USD"],
    ]);
  });
});
