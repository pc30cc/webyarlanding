import { useRouterState } from "@tanstack/react-router";
import { Check, Globe } from "lucide-react";
import { useSiteLanguage, useSiteTranslation } from "@/components/site/SiteLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_INFO, isBlogPath, withLocalePrefix, type Locale } from "@/lib/locales";
import { localePrefix } from "@/lib/seo-meta";
import { getActiveLocales, type SiteSettings } from "@/lib/settings";

interface LanguageOption {
  locale: Locale;
  href: string;
}

/**
 * آدرس همین صفحه در زبان‌های فعال سایت. بلاگ فقط فارسی است، پس از صفحه بلاگ به صفحه
 * اصلی زبان‌های دیگر می‌رود. در سایت تک‌زبانه خالی است.
 */
function useLanguageOptions(settings: SiteSettings): LanguageOption[] {
  const location = useRouterState({ select: (state) => state.location });
  if (settings.localization?.mode !== "multi") return [];
  const locales = getActiveLocales(settings);
  if (locales.length < 2) return [];
  return locales.map((locale) => {
    const path = isBlogPath(location.pathname) && locale !== "fa" ? "/" : location.pathname;
    const search = path === location.pathname ? (location.searchStr ?? "") : "";
    return { locale, href: withLocalePrefix(path, localePrefix(settings, locale)) + search };
  });
}

/**
 * انتخاب زبان در هدر. لینک‌ها <a> ساده‌اند (نه <Link>) چون تغییر زبان با بارگذاری کامل
 * صفحه انجام می‌شود (پیشوند زبان در router همان صفحه ثابت است).
 */
export function LanguageSwitcher({
  settings,
  variant,
}: {
  settings: SiteSettings;
  variant: "desktop" | "mobile";
}) {
  const translateText = useSiteTranslation();
  const current = useSiteLanguage();
  const options = useLanguageOptions(settings);
  if (options.length === 0) return null;
  const label = translateText("زبان");

  if (variant === "mobile")
    return (
      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-1 px-3 text-[11px] font-bold text-muted-foreground">{label}</p>
        <div className="grid grid-cols-2 gap-1">
          {options.map(({ locale, href }) => (
            <a
              key={locale}
              href={href}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-foreground ${
                locale === current ? "font-bold text-foreground" : "text-muted-foreground"
              }`}
            >
              {LOCALE_INFO[locale].nativeName}
            </a>
          ))}
        </div>
      </div>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className="hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_INFO[current].nativeName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {options.map(({ locale, href }) => (
          <DropdownMenuItem key={locale} asChild>
            <a
              href={href}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              className="flex items-center justify-between gap-3"
            >
              {LOCALE_INFO[locale].nativeName}
              {locale === current && <Check className="h-4 w-4 text-primary" />}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
