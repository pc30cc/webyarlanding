import { useEffect } from "react";

export interface WidgetScriptConfig {
  enabled: boolean;
  scriptUrl: string;
  inlineScript: string;
  position?: "right" | "left";
}

/** تزریق اسکریپت ابزارک‌های خارجی (چت، مرکز تماس و مانند آن) — فقط سمت کلاینت. */
export function ScriptWidget({ config }: { config?: WidgetScriptConfig }) {
  useEffect(() => {
    const cfg = config;
    if (!cfg?.enabled) return;

    const injected: HTMLElement[] = [];
    let cancelled = false;

    function inject() {
      if (cancelled || !cfg) return;

      if (cfg.scriptUrl) {
        const script = document.createElement("script");
        script.src = cfg.scriptUrl;
        script.async = true;
        document.body.appendChild(script);
        injected.push(script);
      }

      if (cfg.inlineScript) {
        // کد نصب معمولاً یک قطعه HTML کامل است (شامل تگ <script>)؛ innerHTML اسکریپت‌ها را اجرا
        // نمی‌کند، پس هر <script> باید به‌صورت المان جدید بازسازی و درج شود.
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
          const inline = document.createElement("script");
          inline.text = cfg.inlineScript;
          document.body.appendChild(inline);
          injected.push(inline);
        }
      }
    }

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
  }, [config]);

  return null;
}
