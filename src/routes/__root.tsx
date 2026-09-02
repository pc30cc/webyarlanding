import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { fetchSettings } from "../lib/settings.functions";
import { getPublicCatalog } from "../lib/catalog.functions";
import { VisitTracker } from "../components/site/VisitTracker";
import { extractScriptTags } from "../lib/seo-meta";
import type { SiteSettings } from "../lib/settings";

/** اسکریپت‌های گوگل آنالیتیکس (در صورت تنظیم) + اسکریپت‌های سفارشی head از تنظیمات عمومی */
function buildHeadScripts(settings: SiteSettings | undefined): Array<Record<string, unknown>> {
  const scripts: Array<Record<string, unknown>> = [];
  const gaId = settings?.analytics.googleAnalyticsId?.trim();
  if (gaId) {
    scripts.push({ src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true });
    scripts.push({
      children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
    });
  }
  const custom = settings?.analytics.headScripts?.trim();
  if (custom) {
    for (const { attrs, children } of extractScriptTags(custom)) {
      scripts.push({ ...attrs, ...(children ? { children } : {}) });
    }
  }
  return scripts;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    const [settings, productCatalog, solutionCatalog] = await Promise.all([
      fetchSettings(),
      getPublicCatalog({ data: { type: "product" } }),
      getPublicCatalog({ data: { type: "solution" } }),
    ]);
    return { settings, productCatalog, solutionCatalog };
  },
  head: ({ loaderData }) => {
    const settings = loaderData?.settings;
    const base = (settings?.brand.siteUrl || "").replace(/\/$/, "");
    const twitterHandle = settings?.seo.twitterHandle
      ? settings.seo.twitterHandle.startsWith("@")
        ? settings.seo.twitterHandle
        : `@${settings.seo.twitterHandle}`
      : "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: "وب‌یار" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "fa_IR" },
        { property: "og:site_name", content: settings?.brand.name || "وب‌یار" },
        { property: "og:image", content: base ? `${base}/og-image.png` : "/og-image.png" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(twitterHandle ? [{ name: "twitter:site", content: twitterHandle }] : []),
        ...(settings?.seo.googleVerification
          ? [{ name: "google-site-verification", content: settings.seo.googleVerification }]
          : []),
      ],
      links: [
        // پیش‌بارگذاری فونت خودمیزبان‌شده (public/fonts) تا قبل از رندر اول دانلود شود
        // و فلش فونت پیش‌فرض مرورگر (FOUT) به حداقل برسد.
        {
          rel: "preload",
          href: "/fonts/IRANSansWeb.woff2",
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "preload",
          href: "/fonts/IRANSansWeb-Bold.woff2",
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
      scripts: buildHeadScripts(settings),
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const loaderData = Route.useLoaderData();
  const bodyScripts = loaderData?.settings.analytics.bodyScripts?.trim();

  return (
    <html lang="fa" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {bodyScripts && <div dangerouslySetInnerHTML={{ __html: bodyScripts }} />}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors dir="rtl" />
      <VisitTracker />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
