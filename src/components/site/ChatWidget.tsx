import { useEffect } from "react";
import type { SiteSettings } from "@/lib/settings";

/** ویجت چت — تزریق اسکریپت تنظیم‌شده در پنل مدیریت، فقط سمت کلاینت. */
export function ChatWidget({ settings }: { settings: SiteSettings }) {
  useEffect(() => {
    const cfg = settings.chatWidget;
    if (!cfg?.enabled) return;

    const injected: HTMLElement[] = [];

    if (cfg.scriptUrl) {
      const script = document.createElement("script");
      script.src = cfg.scriptUrl;
      script.async = true;
      document.body.appendChild(script);
      injected.push(script);
    }

    if (cfg.inlineScript) {
      const inline = document.createElement("script");
      inline.text = cfg.inlineScript;
      document.body.appendChild(inline);
      injected.push(inline);
    }

    return () => {
      injected.forEach((el) => el.remove());
    };
  }, [settings.chatWidget]);

  return null;
}
