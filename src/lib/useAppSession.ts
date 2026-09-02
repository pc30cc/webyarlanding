import { useEffect, useState } from "react";

export interface AppSessionState {
  status: "loading" | "loggedIn" | "loggedOut";
  name?: string | undefined;
}

/**
 * وضعیت لاگین کاربر روی اپلیکیشن (دامنه‌ی دیگر) را با یک فراخوانی fetch اعتبارسنجی‌شده
 * (credentials: include) از sessionCheckUrl می‌خواند. اگر این آدرس تنظیم نشده باشد، یا
 * درخواست به هر دلیلی (شبکه، CORS، ۴۰۴ چون هنوز روی اپ پیاده نشده) شکست بخورد، همیشه
 * حالت «خارج از سیستم» فرض می‌شود — هدر سایت هرگز به همین دلیل خراب یا معطل نمی‌ماند.
 */
export function useAppSession(sessionCheckUrl: string): AppSessionState {
  const [state, setState] = useState<AppSessionState>({
    status: sessionCheckUrl ? "loading" : "loggedOut",
  });

  useEffect(() => {
    if (!sessionCheckUrl) {
      setState({ status: "loggedOut" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });

    fetch(sessionCheckUrl, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: { loggedIn?: boolean; name?: string }) => {
        if (cancelled) return;
        setState(
          data?.loggedIn
            ? { status: "loggedIn", name: typeof data.name === "string" ? data.name : undefined }
            : { status: "loggedOut" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "loggedOut" });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionCheckUrl]);

  return state;
}
