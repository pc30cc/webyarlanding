import { useCallback, useEffect, useState } from "react";

/** دقیقاً همان شکل user در پاسخ GET /api/auth/session اپلیکیشن (کانتراکت canonical) */
export interface AppSessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
}

export type AppSessionStatus = "loading" | "loggedIn" | "loggedOut";

export interface AppSessionState {
  status: AppSessionStatus;
  user: AppSessionUser | null;
}

export interface UseAppSessionResult extends AppSessionState {
  /** POST به logoutUrl (credentials: include) و به‌روزرسانی فوری وضعیت محلی — بدون رفرش کامل صفحه */
  logout: () => Promise<void>;
}

/**
 * وضعیت لاگین کاربر روی اپلیکیشن (دامنه‌ی دیگر) را از GET sessionCheckUrl می‌خواند —
 * دقیقاً همان کانتراکت canonical اپلیکیشن: `{ user: {...} | null }`، هیچ توکن/JWT ای
 * در پاسخ انتظار نمی‌رود (کوکی نشست HttpOnly است و اصلاً به جاوااسکریپت نمایان نیست).
 * اگر sessionCheckUrl تنظیم نشده باشد، یا درخواست به هر دلیلی (شبکه، CORS، ۴۰۴ چون هنوز
 * روی اپ پیاده نشده، خطای سرور) شکست بخورد، همیشه حالت «خارج از سیستم» فرض می‌شود — هدر
 * سایت هرگز به همین دلیل خراب یا معطل نمی‌ماند و به دکمه‌های ورود/ثبت‌نام معمولی برمی‌گردد.
 */
export function useAppSession(sessionCheckUrl: string, logoutUrl: string): UseAppSessionResult {
  const [state, setState] = useState<AppSessionState>({
    status: sessionCheckUrl ? "loading" : "loggedOut",
    user: null,
  });

  useEffect(() => {
    if (!sessionCheckUrl) {
      setState({ status: "loggedOut", user: null });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", user: null });

    fetch(sessionCheckUrl, { method: "GET", credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: { user?: AppSessionUser | null }) => {
        if (cancelled) return;
        const user = data?.user ?? null;
        setState(user ? { status: "loggedIn", user } : { status: "loggedOut", user: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "loggedOut", user: null });
      });

    // این افکت فقط با تغییر واقعی sessionCheckUrl دوباره اجرا می‌شود — نه هر رندر —
    // پس نه درخواست تکراری به سشن می‌زند و نه حلقه‌ی رندر ایجاد می‌کند.
    return () => {
      cancelled = true;
    };
  }, [sessionCheckUrl]);

  const logout = useCallback(async () => {
    if (logoutUrl) {
      try {
        await fetch(logoutUrl, { method: "POST", credentials: "include" });
      } catch {
        // نادیده گرفته می‌شود — در هر صورت وضعیت محلی را خارج از سیستم می‌کنیم؛
        // اگر واقعاً خروج سمت سرور ناموفق بود، بازدید بعدی دوباره لاگین را نشان می‌دهد.
      }
    }
    setState({ status: "loggedOut", user: null });
  }, [logoutUrl]);

  return { ...state, logout };
}
