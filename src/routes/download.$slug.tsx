import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ChevronLeft, HardDrive, Smartphone, Tag } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicApp, getPublicApps } from "@/lib/apps.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AuroraBackdrop } from "@/components/site/magic";
import { PLATFORM_META, StoreBadge } from "@/components/site/brand-icons";
import { DesktopFrame, MOBILE_SCREENS, PhoneFrame, WindowsScreen } from "@/components/site/devices";

export const Route = createFileRoute("/download/$slug")({
  loader: async ({ params }) => {
    const [settings, app, apps] = await Promise.all([
      fetchSettings(),
      getPublicApp({ data: { slug: params.slug } }),
      getPublicApps(),
    ]);
    if (!app) throw notFound();
    return { settings, app, others: apps.filter((a) => a.id !== app.id) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "برنامه پیدا نشد" }, { name: "robots", content: "noindex" }] };
    }
    const { app, settings } = loaderData;
    return buildPageMeta({
      settings,
      path: `/download/${app.slug}`,
      override: null,
      fallbackTitle: `${app.name} | دانلود و تصاویر`,
      fallbackDescription: app.shortDesc,
    });
  },
  notFoundComponent: AppNotFound,
  errorComponent: AppNotFound,
  component: AppPage,
});

function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
      <h1 className="text-2xl font-bold">این برنامه پیدا نشد</h1>
      <Link to="/download" className="text-primary">بازگشت به دانلود برنامه‌ها</Link>
    </div>
  );
}

function AppPage() {
  const { settings, app, others } = Route.useLoaderData();
  const m = PLATFORM_META[app.platform];
  const customShots = app.screenshots.filter(Boolean);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app.name,
      operatingSystem: m.label,
      applicationCategory: "BusinessApplication",
      softwareVersion: app.version || undefined,
      description: app.description || app.shortDesc,
    },
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "دانلود برنامه", path: "/download" },
      { name: app.name, path: `/download/${app.slug}` },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />

      <section className="relative -mt-16 overflow-hidden pt-26 pb-12 sm:-mt-[4.75rem] sm:pt-[8.75rem]">
        <AuroraBackdrop />
        <div className="container-page relative z-10">
          <Link to="/download" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            دانلود برنامه <ChevronLeft className="h-4 w-4" /> <span className="text-foreground">{app.name}</span>
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={app.iconUrl || "/webyar-logo.png"}
              alt={app.name}
              width={112}
              height={112}
              className="h-24 w-24 rounded-[26px] shadow-[0_20px_50px_-15px_oklch(0.8_0.15_172/0.5)] sm:h-28 sm:w-28"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{app.name}</h1>
              {app.subtitle && <p className="mt-1 text-base text-muted-foreground sm:text-lg">{app.subtitle}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-foreground">
                  <m.Icon className="h-3.5 w-3.5" /> {m.label}
                </span>
                {app.version && (
                  <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-foreground">
                    <Tag className="h-3.5 w-3.5" /> نسخه <span dir="ltr">{app.version}</span>
                  </span>
                )}
                {app.size && (
                  <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-foreground">
                    <HardDrive className="h-3.5 w-3.5" /> {app.size}
                  </span>
                )}
                {app.minOs && (
                  <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-foreground">
                    <Smartphone className="h-3.5 w-3.5" /> {app.minOs}
                  </span>
                )}
              </div>
            </div>
            <StoreBadge platform={app.platform} slug={app.slug} available={!!app.downloadUrl} className="self-start sm:self-center" />
          </div>
        </div>
      </section>

      {/* گالری تصاویر مثل صفحه اپ‌استور */}
      <section className="py-8">
        <div className="container-page mb-4 text-lg font-bold text-foreground">پیش‌نمایش</div>
        <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-6 overflow-x-auto px-5 pt-4 pb-12 [justify-content:safe_center]">
          {customShots.length > 0
            ? customShots.map((src, i) => (
                <img
                  key={src + i}
                  src={src}
                  alt={`${app.name} — تصویر ${i + 1}`}
                  loading="lazy"
                  className={`shrink-0 snap-start rounded-3xl border border-border object-cover ${app.platform === "windows" ? "h-[340px] sm:h-[420px]" : "h-[480px] sm:h-[540px]"}`}
                />
              ))
            : app.platform === "windows"
              ? [0, 1].map((i) => (
                  <div key={i} className="w-[88vw] max-w-[760px] shrink-0 snap-start">
                    <DesktopFrame>
                      <WindowsScreen />
                    </DesktopFrame>
                  </div>
                ))
              : MOBILE_SCREENS.map((s) => (
                  <figure key={s.key} className="shrink-0 snap-start">
                    <div className="rounded-[48px] bg-gradient-to-b from-primary/20 via-accent/10 to-transparent p-5">
                      <PhoneFrame variant={app.platform === "android" ? "android" : "ios"}>
                        <s.C android={app.platform === "android"} />
                      </PhoneFrame>
                    </div>
                    <figcaption className="mt-3 text-center text-sm font-semibold text-foreground">{s.title}</figcaption>
                  </figure>
                ))}
        </div>
      </section>

      <section className="container-page grid gap-10 pb-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">درباره این برنامه</h2>
          <p className="text-base leading-[2] whitespace-pre-line text-muted-foreground">{app.description || app.shortDesc}</p>
        </div>
        {app.features.length > 0 && (
          <div className="glass rounded-3xl p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">امکانات</h2>
            <ul className="space-y-3">
              {app.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section className="container-page pb-24">
          <h2 className="mb-5 text-lg font-bold text-foreground">روی دستگاه‌های دیگر</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.id} to="/download/$slug" params={{ slug: o.slug }} className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-primary/40">
                <img src={o.iconUrl || "/webyar-logo.png"} alt="" className="h-12 w-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-foreground">{o.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{o.subtitle}</div>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
