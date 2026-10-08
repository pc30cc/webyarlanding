import { useEffect, useState } from "react";

/** Trust seal HTML from the admin panel (e.g. eNamad), injected after 3 s. */
export function TrustBadge({ html }: { html: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!ready) return <div className="enamad-badge min-h-[96px]" aria-hidden />;
  return <div className="enamad-badge" dangerouslySetInnerHTML={{ __html: html }} />;
}
