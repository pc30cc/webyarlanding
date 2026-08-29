import { Link } from "@tanstack/react-router";
import type { SiteSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const brandInitial = settings.brand.name?.charAt(0) || "و";

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container-page py-12">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-primary-foreground">
                <span className="text-sm font-bold">{brandInitial}</span>
              </div>
              <span className="text-base font-bold text-foreground">{settings.brand.name}</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {settings.brand.tagline || "پلتفرم جامع مدیریت ارتباط با مشتری برای کسب‌وکارهای ایرانی"}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">محصول</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/" hash="features" className="block transition-colors hover:text-foreground">امکانات</Link>
              <Link to="/pricing" className="block transition-colors hover:text-foreground">قیمت‌گذاری</Link>
              <Link to="/api-docs" className="block transition-colors hover:text-foreground">مستندات API</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">شرکت</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/about" className="block transition-colors hover:text-foreground">درباره ما</Link>
              <Link to="/blog" className="block transition-colors hover:text-foreground">بلاگ</Link>
              <Link to="/contact" className="block transition-colors hover:text-foreground">تماس با ما</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">قانونی</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <Link to="/terms" className="block transition-colors hover:text-foreground">شرایط استفاده</Link>
              <Link to="/privacy" className="block transition-colors hover:text-foreground">حریم خصوصی</Link>
              <Link to="/sla" className="block transition-colors hover:text-foreground">SLA</Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {settings.brand.copyright || "© ۱۴۰۵ وب‌یار — تمامی حقوق محفوظ است"}
          </p>
        </div>
      </div>
    </footer>
  );
}
