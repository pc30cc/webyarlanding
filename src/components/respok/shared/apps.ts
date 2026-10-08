import type { AppDto, AppPlatform } from "@/lib/apps.functions";

export const PLATFORM_EN: Record<
  AppPlatform,
  { label: string; store: string; action: string; soon: string }
> = {
  ios: {
    label: "iPhone",
    store: "App Store",
    action: "Download on the",
    soon: "Coming soon to the",
  },
  android: {
    label: "Android",
    store: "Google Play",
    action: "Get it on",
    soon: "Coming soon to",
  },
  windows: {
    label: "Windows",
    store: "Windows",
    action: "Download for",
    soon: "Coming soon for",
  },
  mac: {
    label: "Mac",
    store: "macOS",
    action: "Download for",
    soon: "Coming soon for",
  },
};

export const PLATFORM_ORDER: AppPlatform[] = ["ios", "android", "mac", "windows"];

/** Store link through /go/{slug} so downloads are counted; null when not released. */
export function downloadHref(app: Pick<AppDto, "slug" | "downloadUrl">): string | null {
  return app.downloadUrl ? `/go/${app.slug}` : null;
}

/** Apps sorted iOS, Android, Mac, Windows. */
export function sortApps(apps: AppDto[]): AppDto[] {
  return [...apps].sort(
    (a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform),
  );
}
