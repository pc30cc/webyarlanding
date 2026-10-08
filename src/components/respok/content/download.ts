import { Bell, Lock, RefreshCw, Zap } from "lucide-react";
import type { AppPlatform } from "@/lib/apps.functions";
import { joinEn, type ContentFlags, type FeatureCopy } from ".";

/** Platform names in display order, e.g. "iPhone, Android and Windows". */
export function platformList(platforms: AppPlatform[]): string {
  const order: AppPlatform[] = ["ios", "android", "mac", "windows"];
  const names: Record<AppPlatform, string> = {
    ios: "iPhone",
    android: "Android",
    mac: "Mac",
    windows: "Windows",
  };
  return joinEn(order.filter((p) => platforms.includes(p)).map((p) => names[p]));
}

/** Copy for /download; only the platforms that really have an app are named. */
export function getDownloadContent(
  { callEnabled: call, brand }: ContentFlags,
  platforms: AppPlatform[] = [],
) {
  const list = platformList(platforms);
  return {
    question: "Is there an app for that?",
    eyebrow: list ? `Apps · ${list.replace(" and ", ", ")}` : "Apps",
    title: ["Answer customers", "wherever you are"],
    lede: `Your inbox, chats${call ? ", calls" : ""} and email${list ? ` on ${list}` : ""}, with the same account as the web dashboard.`,
    appsTitle: "Choose the version for your device",
    viewDetails: "Details and screenshots",
    empty: "Apps will be available here soon.",
    perks: [
      {
        icon: Bell,
        title: "Instant notifications",
        body: call
          ? "New messages and calls reach your phone and desktop right away."
          : "New messages reach your phone and desktop right away.",
      },
      {
        icon: Zap,
        title: "Fast and native",
        body: "Native apps built with SwiftUI on Apple devices, Jetpack Compose on Android and WinUI on Windows.",
      },
      {
        icon: Lock,
        title: "Secure",
        body: "Encrypted sessions, a list of your signed-in devices, and account deletion from the iPhone app.",
      },
      {
        icon: RefreshCw,
        title: "Synced everywhere",
        body: "Start a conversation on your phone and finish it on your desktop.",
      },
    ] satisfies FeatureCopy[],
    app: {
      back: "Download apps",
      version: "Version",
      size: "Size",
      requires: "Requires",
      preview: "Preview",
      about: "About this app",
      features: "Features",
      others: "On your other devices",
      screenshot: (name: string, n: number) => `${name}, screenshot ${n}`,
      brandApp: `${brand} app`,
    },
  };
}
