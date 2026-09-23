import { siApple, siGoogleplay, siAndroid } from "simple-icons";
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
};

/** دکمه استور (App Store / Google Play / Windows) — کلیک از مسیر /go عبور می‌کند تا شمرده شود */
export function StoreBadge({
  platform,
  slug,
  available,
  className,
}: {
  platform: AppPlatform;
  slug: string;
  available: boolean;
  className?: string | undefined;
}) {
  const m = PLATFORM_META[platform];
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
  if (!available) {
    return <span className={`${base} cursor-default opacity-60 ${className ?? ""}`}>{inner}</span>;
  }
  return (
    <a href={`/go/${slug}`} rel="nofollow" className={`${base} hover:-translate-y-0.5 ${className ?? ""}`}>
      {inner}
    </a>
  );
}
