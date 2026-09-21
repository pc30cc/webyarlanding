import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBrandNameEn, getPublicTagline, type SiteSettings } from "@/lib/settings";

/** نماد اعتماد بعد از بارگذاری بقیه صفحه تزریق می‌شود تا تصویر کند اینماد
 *  جلوی بارگذاری ابزارک‌ها و رویداد load صفحه را نگیرد. کد اینماد بدون تغییر می‌ماند. */
function TrustBadge({ html }: { html: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  if (!ready) return <div className="enamad-badge min-h-[96px]" aria-hidden />;
  return <div className="enamad-badge" dangerouslySetInnerHTML={{ __html: html }} />;
}



const FA = {
  tagline: "پلتفرم جامع مدیریت ارتباط با مشتری برای کسب‌وکارهای ایرانی",
  product: "محصول",
  products: "محصولات",
  solutions: "راه‌کارها",
  pricing: "قیمت‌گذاری",
  apiDocs: "مستندات API",
  company: "شرکت",
  about: "درباره ما",
  blog: "بلاگ",
  contact: "تماس با ما",
  support: "پشتیبانی",
  legal: "قانونی",
  terms: "شرایط استفاده",
  privacy: "حریم خصوصی",
  sla: "SLA",
};

const EN: typeof FA = {
  tagline: "Customer communication platform for modern businesses",
  product: "Product",
  products: "Products",
  solutions: "Solutions",
  pricing: "Pricing",
  apiDocs: "API Docs",
  company: "Company",
  about: "About",
  blog: "Blog",
  contact: "Contact",
  support: "Support",
  legal: "Legal",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  sla: "SLA",
};

export function SiteFooter({
  settings,
  english = false,
}: {
  settings: SiteSettings;
  english?: boolean;
}) {
  const t = english ? EN : FA;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = (pathname.replace(/\/+$/, "") || "/") === "/";
  const showTrustBadge = isHome && settings.trustBadge?.enabled && !!settings.trustBadge?.html;
  const brandName = english ? getBrandNameEn(settings) : settings.brand.name;
  const copyright = english
    ? `© ${new Date().getFullYear()} ${getBrandNameEn(settings)} — All rights reserved`
    : settings.brand.copyright || "© ۱۴۰۵ وب‌یار — تمامی حقوق محفوظ است";



  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container-page py-12">
        <div
          className={`mb-8 grid grid-cols-2 gap-8 ${showTrustBadge ? "md:grid-cols-5" : "md:grid-cols-4"}`}
        >
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={settings.brand.logoUrl || "/webyar-logo.png"}
                alt={brandName || "وب‌یار"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-base font-bold text-foreground">{brandName}</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {english ? t.tagline : getPublicTagline(settings) || t.tagline}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t.product}</h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/products" className="block transition-colors hover:text-foreground">
                {t.products}
              </Link>
              <Link to="/solutions" className="block transition-colors hover:text-foreground">
                {t.solutions}
              </Link>
              <Link to="/pricing" className="block transition-colors hover:text-foreground">
                {t.pricing}
              </Link>
              <Link to="/api-docs" className="block transition-colors hover:text-foreground">
                {t.apiDocs}
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t.company}</h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/about" className="block transition-colors hover:text-foreground">
                {t.about}
              </Link>
              <Link to="/blog" className="block transition-colors hover:text-foreground">
                {t.blog}
              </Link>
              <Link to="/contact" className="block transition-colors hover:text-foreground">
                {t.contact}
              </Link>
              <Link to="/help" className="block transition-colors hover:text-foreground">
                {english ? t.support : "Support"}
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t.legal}</h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/terms" className="block transition-colors hover:text-foreground">
                {t.terms}
              </Link>
              <Link to="/privacy" className="block transition-colors hover:text-foreground">
                {t.privacy}
              </Link>
              <Link to="/sla" className="block transition-colors hover:text-foreground">
                {t.sla}
              </Link>
            </nav>
          </div>
          {showTrustBadge && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">نماد اعتماد</h3>
              <div
                className="enamad-badge"
                dangerouslySetInnerHTML={{ __html: settings.trustBadge.html }}
              />
            </div>
          )}
        </div>


        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">{copyright}</p>
        </div>


      </div>
    </footer>
  );
}
