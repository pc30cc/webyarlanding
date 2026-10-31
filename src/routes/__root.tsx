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
  redirect,
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
import { cachedSiteMessages, loadAllSiteMessages, loadSiteMessages } from "@/lib/site-messages";
import { loadPageTranslations } from "@/lib/site-translations.functions";
import { primeHydratedSiteTranslations } from "@/lib/site-i18n";
import { LOCALE_INFO, splitLocalePrefix, type Locale } from "@/lib/locales";
import {
  mergeSettings,
  pageContentLocale,
  resolvePageLocale,
  getDefaultLocale,
  isBlogAvailable,
  getBrandNameEn,
  type SiteSettings,
} from "../lib/settings";

interface RootLoaderData {
  settings: SiteSettings;
  productCatalog: Awaited<ReturnType<typeof getPublicCatalog>>;
  solutionCatalog: Awaited<ReturnType<typeof getPublicCatalog>>;
  locale: Locale;
  /** ترجمه‌های محتوای ویرایشگر برای زبان صفحه؛ برای فارسی این کلید اصلاً وجود ندارد. */
  overrides?: Record<string, string>;
}

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
        {(!settings || isBlogAvailable(settings, loaderData.locale)) && (
          <Link
            to="/blog"
            className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            {translateText("مشاهده وبلاگ")}
          </Link>
        )}
      </motion.div>
    </div>
  );

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
    // پیشوند زبان آدرس عمومی (پیش از rewrite روتر؛ src/router.tsx)
    beforeLoad: async ({ location }) => {
      // روی سرور head() صفحات دیکشنری را از کش می‌خواند (site-i18n: i18nFromMatches)
      if (typeof window === "undefined") await loadAllSiteMessages();
      return {
        urlLocale: splitLocalePrefix(new URL(location.publicHref, "http://local").pathname)
          .locale,
      };
    },
    loader: async ({ context, location }): Promise<RootLoaderData> => {
      const [settings, productCatalog, solutionCatalog] = await Promise.all([
        fetchSettings().catch((error) => {
          console.error("root settings load failed, using defaults:", error);
          return mergeSettings({});
        }),
        getPublicCatalog({ data: { type: "product" } }).catch(() => []),
        getPublicCatalog({ data: { type: "solution" } }).catch(() => []),
      ]);
      const locale = resolvePageLocale(settings, context.urlLocale);
      // پیشوندی که زبان فعالِ غیرپیش‌فرض نیست (معمولاً server.ts زودتر ریدایرکت کرده است؛
      // این برای پنجره کش تنظیمات و ناوبری سمت مرورگر است).
      if (context.urlLocale && context.urlLocale !== locale)
        throw redirect({ href: location.href, statusCode: 302, reloadDocument: true });
      if (context.urlLocale && context.urlLocale === getDefaultLocale(settings))
        throw redirect({ href: location.href, statusCode: 301, reloadDocument: true });
      // دیکشنری در کش ماژول می‌ماند (مرورگر: src/client.tsx پیش از hydration) و در داده‌های
      // route فرستاده نمی‌شود تا داخل HTML هر صفحه تکرار نشود.
      await loadSiteMessages(locale);
      const data: RootLoaderData = { settings, productCatalog, solutionCatalog, locale };
      // صفحات فارسی هیچ کلید اضافه‌ای در داده‌های route ندارند (HTML آن‌ها تغییر نمی‌کند)؛
      // انگلیسیِ بدون ردیف ترجمه هم ندارد، چون ترجمه‌هایش همان localization.english تنظیمات است.
      if (locale !== "fa") {
        const overrides = await loadPageTranslations(locale);
        if (overrides) data.overrides = overrides;
      }
      return data;
    },
    head: ({ loaderData }) => {
      const settings = loaderData?.settings;
      const base = (settings?.brand.siteUrl || "").replace(/\/$/, "");
      const locale = loaderData?.locale ?? "fa";
      const info = LOCALE_INFO[locale];
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
          { name: "theme-color", content: "#12141f" },
          {
            name: "author",
            content:
              settings && locale !== "fa"
                ? getBrandNameEn(settings)
                : settings?.brand.name || "وب‌یار",
          },
          { property: "og:type", content: "website" },
          { property: "og:locale", content: info.ogLocale },
          {
            property: "og:site_name",
            content:
              settings && locale !== "fa"
                ? getBrandNameEn(settings)
                : settings?.brand.name || "وب‌یار",
          },
          {
            property: "og:image",
            content: base ? `${base}/og-image.png?v=2` : "/og-image.png?v=2",
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
          ...(info.dir === "ltr"
            ? [
                {
                  rel: "preload",
                  href: "/fonts/Inter-Latin-Variable.woff2",
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
          // آیکون‌ها از کیت برند وب‌یار (public/)
          { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
          { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
          {
            rel: "icon",
            href: "/favicon-32x32.png",
            type: "image/png",
            sizes: "32x32",
          },
          { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
          {
            rel: "mask-icon",
            href: "/safari-pinned-tab.svg",
            color: "#0B7D6C",
          },
          { rel: "manifest", href: "/site.webmanifest" },
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
  const contentLocale: Locale =
    admin || !loaderData?.settings
      ? "fa"
      : pageContentLocale(loaderData.settings, loaderData.locale, pathname);

  return (
    <html
      lang={contentLocale}
      dir={LOCALE_INFO[contentLocale].dir}
      data-locale={loaderData?.locale && loaderData.locale !== "fa" ? loaderData.locale : undefined}
    >
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
  const { settings, locale, overrides } = Route.useLoaderData();
  const messages = cachedSiteMessages(locale);
  // فقط در مرورگر: کش ترجمه‌ها از داده‌های hydrate‌شده پر می‌شود (برای head() و ناوبری‌های
  // بعدی). روی سرور loader کش را پر کرده و رندر نباید نسخه قدیمی‌تری را تازه حساب کند.
  primeHydratedSiteTranslations(locale, overrides);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteLanguageProvider
        settings={settings}
        locale={locale}
        messages={messages}
        overrides={overrides}
      >
        <Toaster
          position="top-center"
          richColors
          dir={LOCALE_INFO[locale].dir}
        />
        <VisitTracker />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </SiteLanguageProvider>
    </QueryClientProvider>
  );
}
