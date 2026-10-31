import { useEffect, useState } from 'react';
import { initGoogleAds, isAdsProduction, readAdsConsent, setAdsConsent } from '../lib/googleAds';
import { useSiteDir, useSiteTranslation } from './site/SiteLanguage';

export function AdsMeasurementConsent({ english = false }: { english?: boolean }) {
  const translateText = useSiteTranslation();
  const siteDir = useSiteDir();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isAdsProduction()) return;
    setVisible(readAdsConsent() === null);
    // Optional measurement must never prevent signup or page rendering.
    try { initGoogleAds(); } catch { /* blocked storage/tag is non-fatal */ }
  }, []);
  if (!visible) return null;
  function choose(granted: boolean) {
    try { setAdsConsent(granted ? 'granted' : 'denied'); } catch { /* non-fatal */ }
    setVisible(false);
  }
  return (
    <aside aria-label={english ? 'Cookies' : translateText('کوکی‌ها')} dir={english ? 'ltr' : siteDir}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl">
      <p className="text-sm leading-6">{english
        ? 'We use cookies to make sure you get the best experience working with our website.'
        : translateText('ما از کوکی‌ها برای مطمئن شدن از اینکه شما بهترین تجربه را از کار کردن با وب‌سایت ما می‌برید استفاده می‌کنیم.')}</p>
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={() => choose(true)} className="rounded-lg border border-border px-4 py-2 text-sm">{english ? 'Accept' : translateText('می‌پذیرم')}</button>
        <button type="button" onClick={() => choose(false)} className="rounded-lg border border-border px-4 py-2 text-sm">{english ? 'Decline' : translateText('نمی‌پذیرم')}</button>
      </div>
    </aside>
  );
}
