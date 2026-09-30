import { siApple, siGoogleplay, siAndroid } from "simple-icons";
import { Link } from "@tanstack/react-router";
import type { AppPlatform } from "@/lib/apps.functions";

function SiIcon({ path, className }: { path: string; className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={path} />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string | undefined }) {
  return <SiIcon path={siApple.path} className={className} />;
}
export function GooglePlayIcon({ className }: { className?: string | undefined }) {
  return <SiIcon path={siGoogleplay.path} className={className} />;
}
export function AndroidIcon({ className }: { className?: string | undefined }) {
  return <SiIcon path={siAndroid.path} className={className} />;
}
export function WindowsIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M0 3.4 9.8 2v9.5H0zM11 1.8 24 0v11.5H11zM0 12.5h9.8V22L0 20.6zM11 12.5h13V24l-13-1.8z" />
    </svg>
  );
}

export const PLATFORM_META: Record<
  AppPlatform,
  { label: string; store: string; storeTop: string; Icon: (p: { className?: string | undefined }) => React.ReactElement }
> = {
  ios: { label: "آیفون و آیپد", store: "App Store", storeTop: "دریافت از", Icon: AppleIcon },
  android: { label: "اندروید", store: "Google Play", storeTop: "دریافت از", Icon: GooglePlayIcon },
  windows: { label: "ویندوز", store: "Windows", storeTop: "دانلود برای", Icon: WindowsIcon },
  mac: { label: "مک", store: "macOS", storeTop: "دانلود برای", Icon: AppleIcon },
};

/** دکمه استور (App Store / Google Play / Windows) — کلیک از مسیر /go عبور می‌کند تا شمرده شود */
export function StoreBadge({
  platform,
  slug,
  available,
  className,
  toDetails,
}: {
  platform: AppPlatform;
  slug: string;
  available: boolean;
  className?: string | undefined;
  toDetails?: boolean;
}) {
  const m = PLATFORM_META[platform] ?? PLATFORM_META.ios;
  const inner = (
    <>
      <m.Icon className="h-7 w-7 shrink-0" />
      <span className="flex flex-col items-start leading-tight" dir="ltr">
        <span className="text-[10px] opacity-75">{available ? m.storeTop : "به‌زودی در"}</span>
        <span className="text-[15px] font-bold">{m.store}</span>
      </span>
    </>
  );
  const base =
    "inline-flex min-h-[52px] items-center gap-3 rounded-2xl border border-border bg-foreground px-5 py-2 text-background transition-transform";
  if (toDetails) {
    return (
      <Link to="/download/$slug" params={{ slug }} className={`${base} hover:-translate-y-0.5 ${className ?? ""}`}>
        {inner}
      </Link>
    );
  }
  if (!available) {
    return <span className={`${base} cursor-default opacity-60 ${className ?? ""}`}>{inner}</span>;
  }
  return (
    <a href={`/go/${slug}`} rel="nofollow" className={`${base} hover:-translate-y-0.5 ${className ?? ""}`}>
      {inner}
    </a>
  );
}

/** کاشی آیکون پلتفرم به سبک آیکون اپ‌استور — گرادیان رنگ برند، هایلایت شیشه‌ای و درخشش (الهام از Magic UI) */
const TILE_STYLE: Record<AppPlatform, { bg: string; fg: string; glow: string }> = {
  ios: { bg: "linear-gradient(145deg,#4a4a4f 0%,#1c1c1f 55%,#050506 100%)", fg: "#ffffff", glow: "rgba(180,180,200,.45)" },
  android: { bg: "linear-gradient(145deg,#7cf5b6 0%,#34d17f 50%,#12a05a 100%)", fg: "#063a20", glow: "rgba(61,220,132,.55)" },
  mac: { bg: "linear-gradient(145deg,#e9e9ee 0%,#b8b8c2 50%,#7d7d88 100%)", fg: "#1c1c1f", glow: "rgba(200,200,215,.5)" },
  windows: { bg: "linear-gradient(145deg,#4cc2ff 0%,#0a84ff 50%,#0050a8 100%)", fg: "#ffffff", glow: "rgba(10,132,255,.55)" },
};

export function PlatformTile({ platform, className, iconClassName, glow }: { platform: AppPlatform; className?: string; iconClassName?: string; glow?: boolean }) {
  const t = TILE_STYLE[platform] ?? TILE_STYLE.ios;
  const Icon = platform === "ios" || platform === "mac" ? AppleIcon : platform === "android" ? AndroidIcon : WindowsIcon;
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden ${className ?? ""}`}
      style={{ background: t.bg, color: t.fg, boxShadow: `${glow ? `0 20px 50px -15px ${t.glow}, ` : ""}inset 0 1px 0 rgba(255,255,255,.35), inset 0 -8px 20px rgba(0,0,0,.18)` }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <Icon className={`relative drop-shadow-[0_2px_4px_rgba(0,0,0,.25)] ${iconClassName ?? ""}`} />
    </span>
  );
}
