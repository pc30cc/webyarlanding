import { useEffect } from "react";

export interface WidgetScriptConfig {
  enabled: boolean;
  scriptUrl: string;
  inlineScript: string;
  position?: "right" | "left";
}

/** ابزارک‌هایی که قبلاً روی این صفحه تزریق شده‌اند — جلوگیری از اجرای دوباره اسکریپت */
const injectedKeys = new Set<string>();

/** تزریق اسکریپت ابزارک‌های خارجی (چت، مرکز تماس و مانند آن) — فقط سمت کلاینت، یک‌بار در هر بارگذاری صفحه. */
export function ScriptWidget({ config }: { config?: WidgetScriptConfig }) {
  const enabled = Boolean(config?.enabled);
  const scriptUrl = config?.scriptUrl ?? "";
  const inlineScript = config?.inlineScript ?? "";
  const key = `${scriptUrl}::${inlineScript}`;

  useEffect(() => {
    if (!enabled) return;
    if (!scriptUrl && !inlineScript) return;
    // اسکریپت ابزارک‌های خارجی معمولاً وضعیت سراسری می‌سازند؛ اجرای دوباره آن‌ها
    // (رندر مجدد، StrictMode) باعث خطاهایی مثل «bootstrap failed» می‌شود.
    if (injectedKeys.has(key)) return;
    injectedKeys.add(key);

    let cancelled = false;

    function inject() {
      if (cancelled) return;

      if (scriptUrl) {
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        document.body.appendChild(script);
      }

      if (inlineScript) {
        // کد نصب معمولاً یک قطعه HTML کامل است (شامل تگ <script>)؛ innerHTML اسکریپت‌ها را اجرا
        // نمی‌کند، پس هر <script> باید به‌صورت المان جدید بازسازی و درج شود.
        const parsed = document.createElement("div");
        parsed.innerHTML = inlineScript;

        // ابتدا محتوای غیر اسکریپتی (مثل div محل نمایش ابزارک) درج شود
        Array.from(parsed.childNodes).forEach((node) => {
          if (node.nodeName.toLowerCase() === "script") return;
          document.body.appendChild(node.cloneNode(true));
        });

        const scripts = parsed.querySelectorAll("script");
        if (scripts.length > 0) {
          scripts.forEach((original) => {
            const script = document.createElement("script");
            for (const attr of Array.from(original.attributes)) {
              script.setAttribute(attr.name, attr.value);
            }
            if (original.textContent) script.text = original.textContent;
            document.body.appendChild(script);
          });
        } else {
          const inline = document.createElement("script");
          inline.text = inlineScript;
          document.body.appendChild(inline);
        }
      }
    }

    // بعد از کامل شدن بارگذاری صفحه اجرا شود تا ابزارک به DOM آماده دسترسی داشته باشد
    if (document.readyState === "complete") {
      window.setTimeout(inject, 300);
    } else {
      window.addEventListener("load", () => window.setTimeout(inject, 300), { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, scriptUrl, inlineScript, key]);

  return null;
}
