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

const visibleLocalesOf = (value: unknown): readonly Locale[] | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? ((value as { visibleLocales?: unknown }).visibleLocales as Locale[] | undefined)
    : undefined;

/**
 * زبان‌هایی که صفحه فعلی در آن‌ها وجود دارد، اگر loader صفحه آن را اعلام کرده باشد: visibleLocales
 * در داده صفحه یا یکی از اشیای آن (مثل app در /download/<slug>، که فقط در سایت چندزبانه هست).
 * بدون آن undefined، یعنی صفحه در همه زبان‌ها هست.
 */
function pageVisibleLocales(
  matches: ReadonlyArray<{ loaderData?: unknown }> | undefined,
): readonly Locale[] | undefined {
  const data = matches?.at(-1)?.loaderData;
  if (!data || typeof data !== "object") return undefined;
  return [data, ...Object.values(data)].map(visibleLocalesOf).find(Array.isArray);
}

/** صفحه بالاتر همان بخش (/download/<slug> ← /download) */
const parentPath = (path: string) => path.replace(/\/[^/]*\/?$/, "") || "/";

/**
 * آدرس همین صفحه در زبان‌های فعال سایت. بلاگ فقط فارسی است، پس از صفحه بلاگ به صفحه
 * اصلی زبان‌های دیگر می‌رود. صفحه‌ای که در یک زبان وجود ندارد (مثل برنامه‌ای که در آن زبان
 * پنهان است) به صفحه بالاتر همان بخش در آن زبان می‌رود، نه به ۴۰۴. در سایت تک‌زبانه خالی است.
 */
function useLanguageOptions(settings: SiteSettings): LanguageOption[] {
  const location = useRouterState({ select: (state) => state.location });
  const visible = useRouterState({ select: (state) => pageVisibleLocales(state.matches) });
  if (settings.localization?.mode !== "multi") return [];
  const locales = getActiveLocales(settings);
  if (locales.length < 2) return [];
  return locales.map((locale) => {
    let path = location.pathname;
    if (isBlogPath(path) && locale !== "fa") path = "/";
    else if (visible && !visible.includes(locale)) path = parentPath(path);
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
