import { Bell, Lock, RefreshCw, Zap } from "lucide-react";
import type { ContentFlags, FeatureCopy } from ".";

export function getDownloadContent({ callEnabled: call, brand }: ContentFlags) {
  return {
    question: "Is there an app for that?",
    eyebrow: "Native apps · iOS · Android · Mac · Windows",
    title: ["Answer customers", "wherever you are"],
    lede: call
      ? "Inbox, chat, video calls and email on iPhone, Android, Mac and Windows. One account for all of them."
      : "Inbox, chat and email on iPhone, Android, Mac and Windows. One account for all of them.",
    appsTitle: "Choose the version for your device",
    viewDetails: "Details and screenshots",
    empty: "Apps will be available here soon.",
    perks: [
      { icon: Bell, title: "Instant notifications", body: call ? "New messages and calls reach your phone and desktop right away." : "New messages reach your phone and desktop right away." },
      { icon: Zap, title: "Fast and native", body: "Built with SwiftUI, Jetpack Compose and native Windows technology." },
      { icon: Lock, title: "Secure", body: "Encrypted sessions, device management and account deletion from inside the app." },
      { icon: RefreshCw, title: "Synced everywhere", body: "Start a conversation on your phone and finish it on your desktop." },
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
