import { TrustBadge } from "./TrustBadge";
import { useSiteTranslation } from "@/components/site/SiteLanguage";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  getBrandNameEn,
  getPublicTagline,
  type SiteSettings,
} from "@/lib/settings";

/** نماد اعتماد بعد از بارگذاری بقیه صفحه تزریق می‌شود تا تصویر کند اینماد
 *  جلوی بارگذاری ابزارک‌ها و رویداد load صفحه را نگیرد. کد اینماد بدون تغییر می‌ماند. */
const FA = {
  tagline: "پلتفرم جامع مدیریت ارتباط با مشتری برای کسب‌وکارهای ایرانی",
  product: "محصول",
  products: "محصولات",
  solutions: "راه‌کارها",
  pricing: "قیمت‌گذاری",
  apiDocs: "دانلود برنامه",
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
  apiDocs: "Download apps",
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
  const translateText = useSiteTranslation();

  const t = english ? EN : FA;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = (pathname.replace(/\/+$/, "") || "/") === "/";
  const showTrustBadge =
    isHome && settings.trustBadge?.enabled && !!settings.trustBadge?.html;
  const brandName = english ? getBrandNameEn(settings) : settings.brand.name;
  const copyright = english
    ? `© ${new Date().getFullYear()} ${getBrandNameEn(settings)}. All rights reserved`
    : settings.brand.copyright || "© ۱۴۰۵ وب‌یار. تمامی حقوق محفوظ است";

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
                alt={translateText(brandName || "وب‌یار")}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-base font-bold text-foreground">
                {translateText(brandName)}
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {translateText(
                english ? t.tagline : getPublicTagline(settings) || t.tagline,
              )}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {translateText(t.product)}
            </h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link
                to="/products"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.products)}
              </Link>
              <Link
                to="/solutions"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.solutions)}
              </Link>
              <Link
                to="/pricing"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.pricing)}
              </Link>
              <Link
                to="/download"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.apiDocs)}
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {translateText(t.company)}
            </h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link
                to="/about"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.about)}
              </Link>
              <Link
                to="/blog"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.blog)}
              </Link>
              <Link
                to="/contact"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.contact)}
              </Link>
              <Link
                to="/help"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(english ? t.support : "Support")}
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {translateText(t.legal)}
            </h3>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link
                to="/terms"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.terms)}
              </Link>
              <Link
                to="/privacy"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.privacy)}
              </Link>
              <Link
                to="/sla"
                className="block transition-colors hover:text-foreground"
              >
                {translateText(t.sla)}
              </Link>
            </nav>
          </div>
          {showTrustBadge && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {translateText("نماد اعتماد")}
              </h3>
              <TrustBadge html={settings.trustBadge.html} />
            </div>
          )}
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {translateText(copyright)}
          </p>
        </div>
      </div>
    </footer>
  );
}
