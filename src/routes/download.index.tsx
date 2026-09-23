import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, ChevronLeft, Lock, Zap, Wifi } from "lucide-react";
import { fetchSettings } from "@/lib/settings.functions";
import { getPublicSeoPage } from "@/lib/seo.functions";
import { getPublicApps } from "@/lib/apps.functions";
import { buildPageMeta, buildBreadcrumbJsonLd, safeJsonLdHtml } from "@/lib/seo-meta";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AuroraBackdrop, LiveBadge, SectionHeading, SpotlightCard } from "@/components/site/magic";
import { PLATFORM_META, StoreBadge } from "@/components/site/brand-icons";
import { ChatScreen, InboxScreen, PhoneFrame, DesktopFrame, WindowsScreen } from "@/components/site/devices";
import { ScrollReveal } from "@/components/site/animations";

export const Route = createFileRoute("/download/")({
  loader: async () => {
    const [settings, seoOverride, apps] = await Promise.all([
      fetchSettings(),
      getPublicSeoPage({ data: { path: "/download" } }),
      getPublicApps(),
    ]);
    return { settings, seoOverride, apps };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return buildPageMeta({
      settings: loaderData.settings,
      path: "/download",
      override: loaderData.seoOverride,
      fallbackTitle: "دانلود برنامه وب‌یار | آیفون، اندروید و ویندوز",
      fallbackDescription:
        "اپلیکیشن‌های نیتیو وب‌یار برای iOS، اندروید و ویندوز: پاسخ به چت، تماس تصویری و ایمیل مشتریان از هر جا، با اعلان لحظه‌ای.",
    });
  },
  component: DownloadPage,
});

const perks = [
  { Icon: Bell, t: "اعلان لحظه‌ای", d: "هر پیام یا تماس جدید، همان لحظه روی گوشی و دسکتاپ." },
  { Icon: Zap, t: "سریع و نیتیو", d: "ساخته‌شده با SwiftUI، Jetpack Compose و ویندوز؛ نه یک وب‌ویو ساده." },
  { Icon: Lock, t: "امن", d: "نشست رمزنگاری‌شده، مدیریت دستگاه‌ها و حذف حساب از داخل اپ." },
  { Icon: Wifi, t: "همگام در همه‌جا", d: "گفتگو را روی گوشی شروع و روی دسکتاپ ادامه دهید." },
];

function DownloadPage() {
  const { settings, apps } = Route.useLoaderData();
  const byPlatform = (p: string) => apps.find((a) => a.platform === p);
  const jsonLd = [
    ...apps.map((a) => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: a.name,
      operatingSystem: a.platform === "ios" ? "iOS" : a.platform === "android" ? "Android" : "Windows",
      applicationCategory: "BusinessApplication",
      softwareVersion: a.version || undefined,
      description: a.shortDesc,
    })),
    buildBreadcrumbJsonLd(settings, [
      { name: "خانه", path: "/" },
      { name: "دانلود برنامه", path: "/download" },
    ]),
  ];

  return (
    <SiteLayout settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLdHtml(jsonLd)} />

      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28">
        <AuroraBackdrop />
        <div className="container-page relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <LiveBadge>اپ‌های نیتیو وب‌یار · iOS · Android · Windows</LiveBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-[32px] leading-[1.35] font-extrabold text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.25]"
          >
            مشتریانتان را <span className="text-brand">هر جا که هستید</span> پاسخ دهید
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-base leading-[1.9] text-muted-foreground sm:text-lg"
          >
            صندوق گفتگو، چت، تماس تصویری و ایمیل — روی آیفون، اندروید و ویندوز. همه در یک حساب.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {(["ios", "android", "windows"] as const).map((p) => {
              const a = byPlatform(p);
              return a ? <StoreBadge key={p} platform={p} slug={a.slug} available={!!a.downloadUrl} /> : null;
            })}
          </motion.div>

          {/* ترکیب سه دستگاه */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-16 max-w-5xl"
          >
            <div className="relative mx-auto w-full sm:w-[88%]">
              <DesktopFrame>
                <WindowsScreen />
              </DesktopFrame>
              <div className="absolute start-3 bottom-3 hidden origin-bottom-left scale-[0.55] sm:block lg:scale-[0.65] rtl:origin-bottom-right">
                <PhoneFrame variant="ios">
                  <InboxScreen />
                </PhoneFrame>
              </div>
              <div className="absolute end-3 bottom-3 hidden origin-bottom-right scale-[0.55] sm:block lg:scale-[0.65] rtl:origin-bottom-left">
                <PhoneFrame variant="android">
                  <ChatScreen />
                </PhoneFrame>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <SectionHeading eyebrow="برنامه‌ها" title="نسخه مخصوص دستگاه خود را انتخاب کنید" />
        <div className="grid gap-5 md:grid-cols-3">
          {apps.map((a, i) => {
            const m = PLATFORM_META[a.platform];
            return (
              <ScrollReveal key={a.id} delay={i * 0.08}>
                <Link to="/download/$slug" params={{ slug: a.slug }} className="group block h-full">
                  <SpotlightCard className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/40">
                    <div className="flex items-center gap-4">
                      <img src={a.iconUrl || "/webyar-logo.png"} alt="" width={64} height={64} className="h-16 w-16 rounded-[18px] shadow-lg" />
                      <div className="min-w-0">
                        <div className="truncate text-lg font-extrabold text-foreground">{a.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <m.Icon className="h-3.5 w-3.5" /> {m.label}
                          {a.version && <span dir="ltr">· v{a.version}</span>}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-[1.9] text-muted-foreground">{a.shortDesc}</p>
                    <div className="mt-5 flex items-center justify-between text-sm font-bold text-primary">
                      مشاهده جزئیات و تصاویر
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </SpotlightCard>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
        {apps.length === 0 && (
          <p className="text-center text-muted-foreground">برنامه‌ها به‌زودی در این صفحه قرار می‌گیرند.</p>
        )}
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.t} className="glass rounded-2xl p-5">
              <p.Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-bold text-foreground">{p.t}</div>
              <div className="mt-1 text-sm leading-7 text-muted-foreground">{p.d}</div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
