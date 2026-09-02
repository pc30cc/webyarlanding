import { useEffect } from "react";
import type { SiteSettings } from "@/lib/settings";

/** ویجت چت — تزریق اسکریپت تنظیم‌شده در پنل مدیریت، فقط سمت کلاینت. */
export function ChatWidget({ settings }: { settings: SiteSettings }) {
  useEffect(() => {
    const cfg = settings.chatWidget;
    if (!cfg?.enabled) return;

    const injected: HTMLElement[] = [];
    let cancelled = false;

    function inject() {
      if (cancelled) return;

      if (cfg.scriptUrl) {
        const script = document.createElement("script");
        script.src = cfg.scriptUrl;
        script.async = true;
        document.body.appendChild(script);
        injected.push(script);
      }

      if (cfg.inlineScript) {
        // کد نصب معمولاً یک قطعه HTML کامل است (شامل تگ <script> و گاهی کامنت‌های HTML دور آن)،
        // همان‌طور که اکثر ابزارک‌های چت ارائه می‌دهند — نه فقط سورس خام جاوااسکریپت. innerHTML
        // اسکریپت‌ها را اجرا نمی‌کند، پس هر <script> باید به‌صورت یک المان جدید و واقعی بازسازی و
        // درج شود تا مرورگر آن را اجرا کند.
        const parsed = document.createElement("div");
        parsed.innerHTML = cfg.inlineScript;
        const scripts = parsed.querySelectorAll("script");

        if (scripts.length > 0) {
          scripts.forEach((original) => {
            const script = document.createElement("script");
            for (const attr of Array.from(original.attributes)) {
              script.setAttribute(attr.name, attr.value);
            }
            if (original.textContent) script.text = original.textContent;
            document.body.appendChild(script);
            injected.push(script);
          });
        } else {
          // اگر کد نصب فقط سورس خام جاوااسکریپت بود (بدون تگ <script>)، مثل قبل مستقیم اجرا شود
          const inline = document.createElement("script");
          inline.text = cfg.inlineScript;
          document.body.appendChild(inline);
          injected.push(inline);
        }
      }
    }

    // بارگذاری ویجت را تا بیکار شدن مرورگر (یا حداکثر ۲ ثانیه) عقب می‌اندازیم تا با
    // پردازش اولیه صفحه رقابت نکند؛ روی تجربه کاربر تفاوتی محسوس ندارد چون ویجت شناور
    // است، نه بخشی از محتوای اصلی.
    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback
      ? window.requestIdleCallback(inject, { timeout: 2000 })
      : window.setTimeout(inject, 1500);

    return () => {
      cancelled = true;
      if (hasIdleCallback) window.cancelIdleCallback(idleId as number);
      else window.clearTimeout(idleId as number);
      injected.forEach((el) => el.remove());
    };
  }, [settings.chatWidget]);

  return null;
}
