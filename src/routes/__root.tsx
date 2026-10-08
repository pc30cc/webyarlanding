import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Compass, ChevronLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { fetchSettings } from "../lib/settings.functions";
import { getPublicCatalog } from "../lib/catalog.functions";
import { VisitTracker } from "../components/site/VisitTracker";
import { SiteLayout } from "../components/site/SiteLayout";
import { extractScriptTags } from "../lib/seo-meta";
import { SiteLanguageProvider } from "@/components/site/SiteLanguage";
import { getSiteLanguage } from "@/lib/site-i18n";
import {
  mergeSettings,
  isEnglishChrome,
  getEnglishBrandName,
  getEnglishTemplate,
  type SiteSettings,
} from "../lib/settings";
import { loadRespokTemplate } from "@/components/respok/registry";
import { RespokPage } from "@/components/respok/RespokPage";

/** اسکریپت‌های گوگل آنالیتیکس (در صورت تنظیم) + اسکریپت‌های سفارشی head از تنظیمات عمومی */
function buildHeadScripts(
  settings: SiteSettings | undefined,
): Array<Record<string, unknown>> {
  const scripts: Array<Record<string, unknown>> = [];
  const gaId = settings?.analytics.googleAnalyticsId?.trim();
  if (gaId) {
    scripts.push({
      src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
      async: true,
    });
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
  const translateText = useSiteTranslation();

  const loaderData = Route.useLoaderData();
  const settings = loaderData?.settings;

  const content = (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
      >
        <Compass className="h-10 w-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-7xl font-extrabold text-brand sm:text-8xl"
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-5 text-xl font-bold text-foreground sm:text-2xl"
      >
        {translateText("این صفحه پیدا نشد")}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base"
      >
        {translateText(
          "آدرسی که دنبالش هستید وجود ندارد یا جابه‌جا شده است. می‌توانید به صفحه اصلی برگردید یا از منو مسیر درست را پیدا کنید.",
        )}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-9 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          {translateText("بازگشت به صفحه اصلی ")}
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          {translateText("مشاهده وبلاگ")}
        </Link>
      </motion.div>
    </div>
  );

  if (settings && getSiteLanguage(settings) === "en") {
    return <RespokPage page="notFound" data={{ settings, kind: "page" }} />;
  }
  if (settings) {
    return <SiteLayout settings={settings}>{content}</SiteLayout>;
  }
  return <div className="bg-background">{content}</div>;
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
          Something went wrong on our end. You can try refreshing or head back
          home.
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    loader: async () => {
      const [settings, productCatalog, solutionCatalog] = await Promise.all([
        fetchSettings().catch((error) => {
          console.error("root settings load failed, using defaults:", error);
          return mergeSettings({});
        }),
        getPublicCatalog({ data: { type: "product" } }).catch(() => []),
        getPublicCatalog({ data: { type: "solution" } }).catch(() => []),
      ]);
      // English site: load the active Respok template before rendering so the server
      // HTML is complete and client navigation never waits on the template chunk.
      if (getSiteLanguage(settings) === "en")
        await loadRespokTemplate(getEnglishTemplate(settings)).catch((error) =>
          console.error("english template load failed:", error),
        );
      return { settings, productCatalog, solutionCatalog };
    },
    head: ({ loaderData }) => {
      const settings = loaderData?.settings;
      const base = (settings?.brand.siteUrl || "").replace(/\/$/, "");
      const englishSite = !!settings && getSiteLanguage(settings) === "en";
      // Respok brand assets for the active English template (public/respok/<template>/).
      const respok = settings && englishSite ? `/respok/${getEnglishTemplate(settings)}` : "";
      const twitterHandle = settings?.seo.twitterHandle
        ? settings.seo.twitterHandle.startsWith("@")
          ? settings.seo.twitterHandle
          : `@${settings.seo.twitterHandle}`
        : "";
      return {
        meta: [
          { charSet: "utf-8" },
          {
            name: "viewport",
            content:
              "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
          },
          { name: "theme-color", content: englishSite ? "#16142B" : "#12141f" },
          {
            name: "author",
            content:
              settings && getSiteLanguage(settings) === "en"
                ? getEnglishBrandName(settings)
                : settings?.brand.name || "وب‌یار",
          },
          { property: "og:type", content: "website" },
          {
            property: "og:locale",
            content:
              settings && getSiteLanguage(settings) === "en"
                ? "en_US"
                : "fa_IR",
          },
          {
            property: "og:site_name",
            content:
              settings && getSiteLanguage(settings) === "en"
                ? getEnglishBrandName(settings)
                : settings?.brand.name || "وب‌یار",
          },
          {
            property: "og:image",
            content: respok
              ? `${base}${respok}/og-image.png`
              : base
                ? `${base}/og-image.png`
                : "/og-image.png",
          },
          { name: "twitter:card", content: "summary_large_image" },
          ...(twitterHandle
            ? [{ name: "twitter:site", content: twitterHandle }]
            : []),
          ...(settings?.seo.googleVerification
            ? [
                {
                  name: "google-site-verification",
                  content: settings.seo.googleVerification,
                },
              ]
            : []),
        ],
        links: [
          // پیش‌بارگذاری فونت خودمیزبان‌شده (public/fonts) تا قبل از رندر اول دانلود شود
          // و فلش فونت پیش‌فرض مرورگر (FOUT) به حداقل برسد.
          ...(englishSite
            ? [
                {
                  rel: "preload",
                  href: "/fonts/Figtree-Latin-Variable.woff2",
                  as: "font",
                  type: "font/woff2",
                  crossOrigin: "anonymous" as const,
                },
              ]
            : [
                {
                  rel: "preload",
                  href: "/fonts/IRANSansWeb.woff2",
                  as: "font",
                  type: "font/woff2",
                  crossOrigin: "anonymous" as const,
                },
                {
                  rel: "preload",
                  href: "/fonts/IRANSansWeb-Bold.woff2",
                  as: "font",
                  type: "font/woff2",
                  crossOrigin: "anonymous" as const,
                },
              ]),
          {
            rel: "stylesheet",
            href: appCss,
          },
          ...(respok
            ? [
                {
                  rel: "icon",
                  href: `${respok}/favicon.svg`,
                  type: "image/svg+xml",
                },
                {
                  rel: "icon",
                  href: `${respok}/favicon-32x32.png`,
                  type: "image/png",
                  sizes: "32x32",
                },
                {
                  rel: "apple-touch-icon",
                  href: `${respok}/apple-touch-icon.png`,
                },
              ]
            : [
                { rel: "icon", href: "/favicon.png", type: "image/png" },
                { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
              ]),
        ],
        scripts: buildHeadScripts(settings),
      };
    },
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  const loaderData = Route.useLoaderData();
  const bodyScripts = loaderData?.settings.analytics.bodyScripts?.trim();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const admin = pathname.startsWith("/admin");
  const english =
    !admin &&
    !!loaderData?.settings &&
    isEnglishChrome(loaderData.settings, pathname);

  return (
    <html lang={english ? "en" : "fa"} dir={english ? "ltr" : "rtl"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {bodyScripts && (
          <div dangerouslySetInnerHTML={{ __html: bodyScripts }} />
        )}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { settings } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteLanguageProvider settings={settings}>
        <Toaster
          position="top-center"
          richColors
          dir={getSiteLanguage(settings) === "en" ? "ltr" : "rtl"}
        />
        <VisitTracker />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </SiteLanguageProvider>
    </QueryClientProvider>
  );
}
