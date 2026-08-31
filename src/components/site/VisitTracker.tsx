import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { trackVisit, pingVisitor } from "@/lib/analytics.functions";

const SESSION_KEY = "webyar_vid";
const HEARTBEAT_MS = 45_000;

function getSessionId(): string | null {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** ثبت بازدید صفحه + ضربان حضور برای آمار «آنلاین الان» — فقط برای صفحات عمومی سایت. */
export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const trackFn = useServerFn(trackVisit);
  const pingFn = useServerFn(pingVisitor);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    trackFn({ data: { sessionId, path: pathname } }).catch(() => {});

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      pingFn({ data: { sessionId, path: pathname } }).catch(() => {});
    }, HEARTBEAT_MS);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
