import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Languages, Loader2, Search } from "lucide-react";
import { adminTranslateSiteMessages } from "@/lib/site-translation.functions";
import {
  adminGetSiteTranslations,
  adminSaveSiteTranslations,
  type AdminSiteTranslations,
} from "@/lib/site-translations.functions";
import { buildTranslationBatches, isUntranslated } from "@/lib/site-translation-batches";
import { adminListCatalogItems, adminListCatalogCategories } from "@/lib/catalog.functions";
import { adminListApps } from "@/lib/apps.functions";
import { listSeoPages } from "@/lib/seo.functions";
import { getBrandNameEn, type LocalizationSettings, type SiteSettings } from "@/lib/settings";
import { LOCALES, LOCALE_INFO, type Locale } from "@/lib/locales";
import {
  createSiteTranslator,
  invalidateSiteTranslations,
  normalizeMessage,
  type Translate,
} from "@/lib/site-i18n";
import { cachedSiteMessages, hasSiteMessages, loadSiteMessages } from "@/lib/site-messages";
import enMessages from "@/lib/site-translations.en.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Messages = Record<string, string>;
type TranslatedLocale = Exclude<Locale, "fa">;
const TRANSLATED: readonly TranslatedLocale[] = ["en", "tr", "ar"];
const EMPTY: Messages = {};
/** کلید کش ترجمه‌های ذخیره‌شده همه زبان‌ها برای ویرایشگر */
const TRANSLATIONS_QUERY_KEY = ["site-translations"];

/** مسیر آدرس داخل متن راست‌به‌چپ (مثل /en/privacy) چپ‌به‌راست و درست نمایش داده می‌شود */
function UrlPath({ children }: { children: string }) {
  return <bdi dir="ltr">{children}</bdi>;
}

/** فهرست مسیرها با جداکننده فارسی: «/a، /b و /c» */
function urlPaths(paths: string[]): ReactNode {
  return paths.map((path, index) => (
    <span key={path}>
      {index === 0 ? "" : index === paths.length - 1 ? " و " : "، "}
      <UrlPath>{path}</UrlPath>
    </span>
  ));
}

/** تنظیمات زبان‌ها که در این بخش ویرایش و با مسیر معمول تنظیمات ذخیره می‌شوند */
interface LanguageChoice {
  language: Locale;
  mode: "single" | "multi";
  locales: Locale[];
}

function choiceOf(localization: LocalizationSettings): LanguageChoice {
  const language = localization.language ?? "fa";
  const checked = new Set<Locale>([language, ...(localization.locales ?? [])]);
  return {
    language,
    mode: localization.mode === "multi" ? "multi" : "single",
    // ترتیب ثابت fa, en, tr, ar؛ زبان پیش‌فرض همیشه فعال است
    locales: LOCALES.filter((locale) => checked.has(locale)),
  };
}

/** زبان‌هایی که سایت با این انتخاب سرو می‌کند (مثل getActiveLocales) */
function activeOf(choice: LanguageChoice): Locale[] {
  return choice.mode === "multi" ? choice.locales : [choice.language];
}

const sameChoice = (a: LanguageChoice, b: LanguageChoice) =>
  a.language === b.language && a.mode === b.mode && a.locales.join() === b.locales.join();

const own = (map: Messages, key: string) =>
  Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;

/** دیکشنری داخلی رابط سایت برای یک زبان (انگلیسی همیشه در بسته پنل هست) */
function builtInMessages(locale: TranslatedLocale): Messages {
  return locale === "en" ? enMessages : cachedSiteMessages(locale);
}

const contentKeys = new Set([
  "title",
  "name",
  "shortDesc",
  "description",
  "subtitle",
  "features",
  "bullets",
  "excerpt",
  "content",
  "author",
  "tags",
  "categoryName",
  "seoTitle",
  "seoDescription",
  "size",
  "minOs",
  "headline",
  "text",
  "keywords",
]);

function collectContent(value: unknown, result: Set<string>, include = false) {
  if (typeof value === "string") {
    if (include && /[؀-ۿ]/.test(value)) result.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectContent(item, result, include));
  } else if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (
      item["published"] === false ||
      item["enabled"] === false ||
      (typeof item["status"] === "string" && item["status"] !== "published")
    )
      return;
    Object.entries(value).forEach(([key, item]) => {
      if (key === "schemaJson" && typeof item === "string") {
        try {
          collectContent(JSON.parse(item), result);
        } catch {
          /* Invalid JSON is handled by the SEO editor. */
        }
      } else collectContent(item, result, contentKeys.has(key));
    });
  }
}

/** متن‌های قابل ترجمه سایت: محتوای منتشرشده ویرایشگر و متن‌های تنظیمات */
function collectSources(content: unknown, settings: SiteSettings): string[] {
  const originals = new Set<string>();
  collectContent(content, originals);
  [
    settings.brand.tagline,
    settings.brand.address,
    settings.brand.copyright,
    settings.auth.loginLabel,
    settings.auth.signupLabel,
    settings.auth.panelLabel,
    settings.auth.logoutLabel,
    settings.seo.metaTitle,
    settings.seo.metaDescription,
    settings.seo.keywords,
    settings.seo.author,
  ].forEach((text) => text && originals.add(text));
  return uniqueSources(originals);
}

function uniqueSources(texts: Iterable<string>): string[] {
  return Array.from(
    new Map(Array.from(texts).map((text) => [normalizeMessage(text), text])).values(),
  );
}

export function LanguageSection({
  settings,
  pending,
  onSave,
  onLegacyEnglishCleared,
}: {
  settings: SiteSettings;
  /** ذخیره تنظیمات در جریان است */
  pending: boolean;
  /** ذخیره زبان پیش‌فرض، حالت و زبان‌های فعال با مسیر معمول ذخیره تنظیمات */
  onSave: (languages: LanguageChoice) => Promise<unknown> | void;
  /** سرور ترجمه‌های قدیمی انگلیسی را از تنظیمات عمومی پاک کرد */
  onLegacyEnglishCleared?: () => void;
}) {
  // ---------- زبان‌ها: پیش‌نویس تا زدن «ذخیره زبان‌ها» ----------
  const saved = choiceOf(settings.localization);
  const savedKey = `${saved.language}|${saved.mode}|${saved.locales.join()}`;
  const [choice, setChoice] = useState<LanguageChoice>(saved);
  const [savingChoice, setSavingChoice] = useState(false);
  useEffect(() => {
    setChoice(choiceOf(settings.localization));
    // فقط وقتی مقدار ذخیره‌شده عوض شود (نه با هر رندر فرم)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);
  const choiceDirty = !sameChoice(choice, saved);
  const active = activeOf(choice);
  const savedActive = activeOf(saved);

  function setDefault(language: Locale) {
    setChoice((current) => ({
      ...current,
      language,
      locales: LOCALES.filter((locale) => locale === language || current.locales.includes(locale)),
    }));
  }
  function toggleLocale(locale: Locale, checked: boolean) {
    setChoice((current) => ({
      ...current,
      locales: LOCALES.filter((item) =>
        item === locale ? checked || item === current.language : current.locales.includes(item),
      ),
    }));
  }
  async function saveChoice() {
    setSavingChoice(true);
    try {
      await onSave(choice);
    } catch {
      // پیام خطا را مسیر ذخیره تنظیمات نشان می‌دهد؛ پیش‌نویس برای تلاش دوباره می‌ماند.
    } finally {
      setSavingChoice(false);
    }
  }

  const warnings: { id: string; text: ReactNode }[] = [];
  if (choice.language !== saved.language)
    warnings.push({
      id: "default-language",
      text: (
        <>
          تغییر زبان پیش‌فرض همه آدرس‌های سایت را تغییر می‌دهد: زبان پیش‌فرض (
          {LOCALE_INFO[choice.language].adminName}) بدون پیشوند روی ریشه سایت نمایش داده می‌شود (مثل{" "}
          <UrlPath>/pricing</UrlPath>)
          {choice.mode === "multi" ? (
            <>
              {" "}
              و بقیه زبان‌ها با پیشوند (مثل <UrlPath>{`/${saved.language}/pricing`}</UrlPath>)
            </>
          ) : (
            " و در حالت تک‌زبانه زبان دیگری سرو نمی‌شود"
          )}
          . صفحاتی که الان در گوگل ایندکس شده‌اند با زبان دیگری نمایش داده می‌شوند؛ لینک‌ها، تبلیغات
          و سرچ کنسول را هم به‌روز کنید.
        </>
      ),
    });
  const legalMoves = choice.language === "fa" && saved.language === "fa";
  const englishLegal = urlPaths(["/en/privacy", "/en/terms", "/en/help"]);
  const persianLegal = urlPaths(["/privacy", "/terms", "/help"]);
  if (legalMoves && active.includes("en") && !savedActive.includes("en"))
    warnings.push({
      id: "legal-to-en",
      text: (
        <>
          با فعال شدن انگلیسی، صفحات حقوقی انگلیسی به {englishLegal} منتقل می‌شوند و {persianLegal}{" "}
          فارسی می‌شوند. پیش از ذخیره، لینک سیاست حریم خصوصی و پشتیبانی را در App Store و Google
          Play به آدرس‌های جدید تغییر دهید.
        </>
      ),
    });
  if (legalMoves && !active.includes("en") && savedActive.includes("en"))
    warnings.push({
      id: "legal-from-en",
      text: (
        <>
          با غیرفعال شدن انگلیسی، صفحات حقوقی انگلیسی از {englishLegal} دوباره به {persianLegal}{" "}
          برمی‌گردند. پیش از ذخیره، لینک‌های App Store و Google Play را به‌روز کنید.
        </>
      ),
    });
  const withoutDictionary = active.filter((locale) => !hasSiteMessages(locale));
  if (withoutDictionary.length)
    warnings.push({
      id: "no-dictionary",
      text: `${withoutDictionary.map((locale) => LOCALE_INFO[locale].adminName).join(" و ")} هنوز دیکشنری ترجمه رابط سایت ندارد؛ تا وقتی ترجمه آن آماده نشده، صفحاتش با متن‌های رابط فارسی و با noindex (بدون ایندکس در موتورهای جستجو) نمایش داده می‌شوند.`,
    });

  // ---------- ترجمه محتوای ویرایشگر برای هر زبان ----------
  const [search, setSearch] = useState("");
  const [showBuiltIn, setShowBuiltIn] = useState(false);
  const [page, setPage] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [savingTranslations, setSavingTranslations] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedTarget, setSelectedTarget] = useState<TranslatedLocale>("en");
  const cancelled = useRef(false);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );
  const translateBatch = useServerFn(adminTranslateSiteMessages);
  const getTranslations = useServerFn(adminGetSiteTranslations);
  const saveTranslations = useServerFn(adminSaveSiteTranslations);
  const items = useServerFn(adminListCatalogItems);
  const catalogCategories = useServerFn(adminListCatalogCategories);
  const apps = useServerFn(adminListApps);
  const seo = useServerFn(listSeoPages);
  const content = useQuery({
    queryKey: ["language-content"],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      Promise.all([
        apps(),
        seo().then((pages) =>
          pages.filter((page) => {
            // فقط تنظیمات سئوی فارسی متن مبدأ است (اگر ردیف‌ها زبان داشته باشند)
            const locale = (page as { locale?: unknown }).locale;
            return !/^\/(blog|tag)(\/|$)/.test(page.path) && (!locale || locale === "fa");
          }),
        ),
        items({ data: { type: "product" } }),
        items({ data: { type: "solution" } }),
        catalogCategories({ data: { type: "product" } }),
        catalogCategories({ data: { type: "solution" } }),
      ]),
  });
  const queryClient = useQueryClient();
  const stored = useQuery({
    queryKey: TRANSLATIONS_QUERY_KEY,
    staleTime: 60_000,
    queryFn: () => getTranslations(),
  });

  // نقشه کاری ترجمه‌های هر زبان؛ زبانی که ویرایش ذخیره‌نشده دارد با داده سرور بازنویسی نمی‌شود.
  const [maps, setMaps] = useState<Partial<Record<TranslatedLocale, Messages>>>({});
  const [dirty, setDirty] = useState<Partial<Record<TranslatedLocale, true>>>({});
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const editVersion = useRef<Record<TranslatedLocale, number>>({
    en: 0,
    tr: 0,
    ar: 0,
  });
  useEffect(() => {
    const data = stored.data;
    if (!data) return;
    setMaps((current) => {
      const next = { ...current };
      for (const locale of TRANSLATED)
        if (!dirtyRef.current[locale]) next[locale] = data.translations[locale];
      return next;
    });
  }, [stored.data]);
  const loaded = !!stored.data && !stored.isError;

  // دیکشنری‌های داخلی زبان‌های دیگر (اگر اضافه شوند) برای نمایش وضعیت ترجمه
  const [, setDictionaries] = useState(0);
  useEffect(() => {
    for (const locale of TRANSLATED)
      if (locale !== "en" && hasSiteMessages(locale))
        void loadSiteMessages(locale).then(() => setDictionaries((v) => v + 1));
  }, []);

  const brand = settings.brand.name;
  const brandEn = getBrandNameEn(settings);
  const translatorCache = useRef(
    new Map<TranslatedLocale, { deps: unknown[]; translate: Translate }>(),
  );
  function translatorFor(locale: TranslatedLocale): Translate {
    const map = maps[locale] ?? EMPTY;
    const messages = builtInMessages(locale);
    const deps = [map, messages, brand, brandEn];
    const cached = translatorCache.current.get(locale);
    if (cached && cached.deps.every((dep, i) => dep === deps[i])) return cached.translate;
    const translate = createSiteTranslator(locale, messages, {
      [brand]: brandEn,
      ...map,
    });
    translatorCache.current.set(locale, { deps, translate });
    return translate;
  }
  const translators = {
    en: translatorFor("en"),
    tr: translatorFor("tr"),
    ar: translatorFor("ar"),
  };

  const contentRows = useMemo(
    () => (content.data ? collectSources(content.data, settings) : []),
    [content.data, settings],
  );
  const coverage = useMemo(() => {
    const result = {} as Record<TranslatedLocale, number>;
    for (const locale of TRANSLATED) {
      const translate = translators[locale];
      result[locale] = contentRows.filter(
        (source) => !isUntranslated(translate(source), locale, source),
      ).length;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRows, translators.en, translators.tr, translators.ar]);

  // زبان‌های مقصد ویرایشگر: زبان‌های غیرفارسیِ انتخاب‌شده (فعال، یا انتخاب‌شده برای آماده‌سازی)
  const targets = TRANSLATED.filter(
    (locale) => choice.locales.includes(locale) || choice.language === locale,
  );
  const target = targets.includes(selectedTarget) ? selectedTarget : targets[0];
  const targetInfo = target ? LOCALE_INFO[target] : null;
  const targetMap = target ? (maps[target] ?? EMPTY) : EMPTY;
  const translate = target ? translators[target] : null;

  const allRows = useMemo(
    () => (showBuiltIn ? uniqueSources([...contentRows, ...Object.keys(enMessages)]) : contentRows),
    [contentRows, showBuiltIn],
  );
  const rows = useMemo(() => {
    if (!translate) return [];
    const query = search.toLowerCase();
    return allRows
      .filter((text) => (text + translate(text)).toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b, "fa"));
  }, [allRows, search, translate]);
  const missing =
    target && translate
      ? rows.filter((text) => isUntranslated(translate(text), target, text)).length
      : 0;

  function editTranslation(locale: TranslatedLocale, key: string, text: string) {
    editVersion.current[locale]++;
    setDirty((current) => ({ ...current, [locale]: true }));
    setMaps((current) => {
      const next = { ...(current[locale] ?? EMPTY) };
      if (text.trim()) next[key] = text;
      else delete next[key];
      return { ...current, [locale]: next };
    });
  }

  /** ذخیره کامل نقشه یک زبان؛ ویرایش‌هایی که در حین ذخیره انجام شده‌اند ذخیره‌نشده می‌مانند. */
  async function persist(locale: TranslatedLocale, translations: Messages) {
    const version = editVersion.current[locale];
    const result = await saveTranslations({ data: { locale, translations } });
    // صفحات عمومی که در همین مرورگر باز شوند ترجمه تازه را می‌خوانند، نه کش ۳۰ ثانیه‌ای.
    invalidateSiteTranslations();
    // داده کش‌شده همین ویرایشگر هم به‌روز می‌شود؛ وگرنه با برگشتن به این بخش (کش ۶۰ ثانیه‌ای)
    // نسخه پیش از ذخیره نمایش داده می‌شد و ذخیره بعدی ترجمه‌های ذخیره‌شده را بازنویسی می‌کرد.
    queryClient.setQueryData<AdminSiteTranslations>(TRANSLATIONS_QUERY_KEY, (current) =>
      current
        ? {
            translations: { ...current.translations, [locale]: translations },
            // پس از اولین ذخیره انگلیسی ترجمه‌ها از ردیف خودشان خوانده می‌شوند، نه تنظیمات قدیمی
            legacyEnglish: locale === "en" ? false : current.legacyEnglish,
          }
        : current,
    );
    // نسخه سرور (با کلیدهای یکسان‌شده) دفعه بعد که این بخش باز شود در پس‌زمینه خوانده می‌شود
    void queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY, refetchType: "none" });
    if (editVersion.current[locale] === version)
      setDirty((current) => {
        const next = { ...current };
        delete next[locale];
        return next;
      });
    if (locale === "en" && result.clearedLegacy) onLegacyEnglishCleared?.();
  }

  async function saveTarget() {
    if (!target || !loaded) return;
    setSavingTranslations(true);
    try {
      await persist(target, targetMap);
      toast.success(`ترجمه‌های ${LOCALE_INFO[target].adminName} ذخیره شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره ترجمه‌ها ناموفق بود.");
    } finally {
      setSavingTranslations(false);
    }
  }

  async function translateMissing() {
    if (!target || !translate) return;
    if (!content.data || content.isError || !loaded) {
      toast.error("ابتدا خواندن محتوای سایت و ترجمه‌ها باید کامل شود.");
      return;
    }
    const locale = target;
    const sources = allRows.filter((source) => isUntranslated(translate(source), locale, source));
    if (!sources.length) {
      toast.success("همه متن‌ها ترجمه دارند.");
      return;
    }
    const working = { ...(maps[locale] ?? EMPTY) };
    const completed = new Map<string, string[]>();
    // متن‌هایی که ترجمه (بخشی از) آن‌ها پذیرفته نشد؛ کنار گذاشته می‌شوند تا دسته‌های بعدی گیر نکنند
    const rejected = new Set<string>();
    cancelled.current = false;
    setPreparing(true);
    try {
      const batches = buildTranslationBatches(sources);
      setProgress({ done: 0, total: batches.length });
      for (let i = 0; i < batches.length; i++) {
        if (cancelled.current) return;
        // بخش‌های بعدی متنی که یک بخشش رد شده دیگر فرستاده نمی‌شوند (کامل نمی‌شود)
        const batch = batches[i]!.filter((chunk) => !rejected.has(chunk.source));
        if (batch.length) {
          const results = await translateBatch({
            data: {
              texts: batch.map((chunk) => chunk.text),
              targetLocale: locale,
            },
          });
          if (cancelled.current) return;
          let added = false;
          batch.forEach((chunk, index) => {
            const result = results[index];
            if (result?.status !== "accepted") {
              rejected.add(chunk.source);
              return;
            }
            const parts = completed.get(chunk.source) ?? Array<string>(chunk.total).fill("");
            parts[chunk.index] = result.text;
            completed.set(chunk.source, parts);
            if (parts.every(Boolean)) {
              working[normalizeMessage(chunk.source)] = parts.join("\n\n");
              added = true;
            }
          });
          if (added) {
            const snapshot = { ...working };
            setMaps((current) => ({ ...current, [locale]: snapshot }));
            // هر دسته بلافاصله ذخیره می‌شود تا با بستن صفحه، ترجمه‌های انجام‌شده از دست نروند.
            await persist(locale, snapshot);
          }
        }
        setProgress({ done: i + 1, total: batches.length });
      }
      if (rejected.size)
        toast.error(
          `ترجمه ${rejected.size.toLocaleString("fa-IR")} متن پذیرفته نشد (ناقص بود یا هنوز فارسی بود) و ذخیره نشد؛ بقیه ترجمه و ذخیره شد. دوباره «ترجمه خودکار» را بزنید یا آن‌ها را دستی ترجمه کنید.`,
        );
      else toast.success(`ترجمه ${LOCALE_INFO[locale].adminName} کامل و ذخیره شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ترجمه ناموفق بود.");
    } finally {
      setPreparing(false);
    }
  }

  const pageSize = 20;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));
  const busy = preparing || savingTranslations;

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-sm" dir="rtl">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Languages className="h-5 w-5" /> زبان‌های سایت
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          زبان پیش‌فرض بدون پیشوند روی ریشه سایت نمایش داده می‌شود. در حالت چندزبانه هر زبان فعال
          دیگر نسخه جدای خودش را با پیشوند آدرس دارد (مثل <UrlPath>/en/pricing</UrlPath>). متن‌های
          رابط سایت از دیکشنری هر زبان و متن‌های اختصاصی شما (محصولات، راه‌کارها، تنظیمات) از
          ترجمه‌های همین بخش خوانده می‌شوند. وبلاگ فقط فارسی است.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">حالت سایت</legend>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["single", "تک‌زبانه", "فقط زبان پیش‌فرض"],
              ["multi", "چندزبانه", "زبان پیش‌فرض و زبان‌های فعال دیگر"],
            ] as const
          ).map(([mode, label, hint]) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="site-language-mode"
                value={mode}
                checked={choice.mode === mode}
                disabled={savingChoice}
                onChange={() => setChoice((current) => ({ ...current, mode }))}
              />
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">({hint})</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">زبان پیش‌فرض</span>
        <select
          aria-label="زبان پیش‌فرض"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={choice.language}
          disabled={savingChoice}
          onChange={(event) => setDefault(event.target.value as Locale)}
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_INFO[locale].adminName} — {LOCALE_INFO[locale].nativeName}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">زبان‌های فعال</legend>
        {choice.mode === "single" && (
          <p className="text-xs text-muted-foreground">
            در حالت تک‌زبانه فقط زبان پیش‌فرض سرو می‌شود؛ زبان‌های انتخاب‌شده با رفتن به حالت
            چندزبانه فعال می‌شوند و از همین حالا می‌توانید ترجمه‌شان را آماده کنید.
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {LOCALES.map((locale) => (
            <label key={locale} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={choice.locales.includes(locale)}
                disabled={savingChoice || locale === choice.language}
                onChange={(event) => toggleLocale(locale, event.target.checked)}
              />
              {LOCALE_INFO[locale].adminName}
            </label>
          ))}
        </div>
      </fieldset>

      {warnings.length > 0 && (
        <ul
          aria-label="هشدارهای تنظیم زبان"
          className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
        >
          {warnings.map((warning) => (
            <li key={warning.id} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{warning.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!choiceDirty || pending || savingChoice}
          onClick={() => void saveChoice()}
        >
          {(pending || savingChoice) && <Loader2 className="h-4 w-4 animate-spin" />}
          ذخیره زبان‌ها
        </Button>
        {choiceDirty && (
          <Button
            type="button"
            variant="outline"
            disabled={savingChoice}
            onClick={() => setChoice(saved)}
          >
            بازگشت به تنظیم ذخیره‌شده
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="وضعیت زبان‌ها">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border text-right">
              <th className="p-2 font-medium">زبان</th>
              <th className="p-2 font-medium">وضعیت</th>
              <th className="p-2 font-medium">دیکشنری رابط سایت</th>
              <th className="p-2 font-medium">ترجمه محتوای اختصاصی</th>
            </tr>
          </thead>
          <tbody>
            {LOCALES.map((locale) => (
              <tr key={locale} className="border-b border-border last:border-0">
                <td className="p-2">
                  {LOCALE_INFO[locale].adminName}{" "}
                  <span className="text-muted-foreground">({LOCALE_INFO[locale].nativeName})</span>
                </td>
                <td className="p-2">
                  {locale === choice.language
                    ? "پیش‌فرض"
                    : active.includes(locale)
                      ? "فعال"
                      : "غیرفعال"}
                </td>
                <td className="p-2">
                  {locale === "fa"
                    ? "زبان مبدأ"
                    : hasSiteMessages(locale)
                      ? "دارد"
                      : "ندارد (noindex)"}
                </td>
                <td className="p-2">
                  {locale === "fa"
                    ? "زبان مبدأ"
                    : !content.data || !loaded
                      ? "…"
                      : `${coverage[locale].toLocaleString("fa-IR")} از ${contentRows.length.toLocaleString("fa-IR")}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="font-semibold">ترجمه محتوای قابل‌ویرایش</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          ترجمه محصولات، راه‌کارها و متن‌های اختصاصی شما برای هر زبان جدا ذخیره می‌شود و فقط به
          بازدیدکنندگان همان زبان فرستاده می‌شود. ترجمه خودکار با سرویس هوش مصنوعی تنظیم‌شده در
          ادمین و از اعتبار همان سرویس انجام می‌شود؛ نمایش صفحات فقط از ترجمه ذخیره‌شده استفاده
          می‌کند. متن فارسی تغییر نمی‌کند؛ اگر متن اصلی را تغییر دادید، ترجمه جدید را هم ثبت کنید.
        </p>
        {stored.data?.legacyEnglish && (
          <p className="mt-3 text-sm text-muted-foreground">
            ترجمه‌های انگلیسی فعلی هنوز در تنظیمات عمومی ذخیره شده‌اند و با اولین ذخیره ترجمه
            انگلیسی به محل جدید منتقل می‌شوند.
          </p>
        )}
        {!target || !targetInfo || !translate ? (
          <p className="mt-3 text-sm">
            برای ترجمه محتوا، حداقل یک زبان غیر از فارسی را در «زبان‌های فعال» انتخاب کنید.
          </p>
        ) : (
          <>
            <div className="my-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                زبان ترجمه
                <select
                  aria-label="زبان ترجمه"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={target}
                  disabled={busy}
                  onChange={(event) => {
                    setSelectedTarget(event.target.value as TranslatedLocale);
                    setPage(0);
                  }}
                >
                  {targets.map((locale) => (
                    <option key={locale} value={locale}>
                      {LOCALE_INFO[locale].adminName}
                      {active.includes(locale) ? "" : " (غیرفعال)"}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={busy || !loaded || content.isLoading || content.isError}
                onClick={() => void translateMissing()}
              >
                ترجمه خودکار متن‌های بدون ترجمه
              </Button>
              <Button
                type="button"
                disabled={busy || !loaded || !dirty[target]}
                onClick={() => void saveTarget()}
              >
                {savingTranslations && <Loader2 className="h-4 w-4 animate-spin" />}
                ذخیره ترجمه‌های {targetInfo.adminName}
              </Button>
            </div>
            {preparing && (
              <div role="status" className="flex flex-wrap items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ترجمه: {progress.done} از {progress.total}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    cancelled.current = true;
                  }}
                >
                  لغو
                </Button>
              </div>
            )}
            {(content.isLoading || stored.isLoading) && (
              <p className="mt-3 text-sm">در حال خواندن محتوای سایت…</p>
            )}
            {(content.isError || stored.isError) && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                خواندن محتوای سایت یا ترجمه‌ها ناموفق بود.
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    if (content.isError) void content.refetch();
                    if (stored.isError) void stored.refetch();
                  }}
                >
                  تلاش دوباره
                </Button>
              </p>
            )}
            {missing > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {missing} متن در این فهرست هنوز ترجمه {targetInfo.adminName} ندارد.
              </p>
            )}
            <div className="my-4 flex flex-wrap items-center gap-3">
              <Search className="h-4 w-4" />
              <Input
                aria-label="جستجو در ترجمه‌ها"
                placeholder="جستجو در متن یا ترجمه"
                className="max-w-sm"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showBuiltIn}
                  onChange={(event) => {
                    setShowBuiltIn(event.target.checked);
                    setPage(0);
                  }}
                />
                نمایش متن‌های ثابت سایت
              </label>
            </div>
            <div className="space-y-4">
              {rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((source) => {
                const key = normalizeMessage(source);
                const translated = translate(source);
                const value =
                  own(targetMap, key) ??
                  (isUntranslated(translated, target, source) ? "" : translated);
                return (
                  <div
                    key={key}
                    className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2"
                  >
                    <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">
                      {source}
                    </div>
                    <Textarea
                      disabled={busy || !loaded}
                      dir={targetInfo.dir}
                      lang={target}
                      aria-label={`ترجمه ${targetInfo.adminName}: ${key.slice(0, 80)}`}
                      value={value}
                      placeholder={`${targetInfo.nativeName}`}
                      className={targetInfo.dir === "ltr" ? "min-h-24 text-left" : "min-h-24"}
                      onChange={(event) => editTranslation(target, key, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                قبلی
              </Button>
              <span className="text-sm">
                {currentPage + 1} / {Math.max(1, Math.ceil(rows.length / pageSize))}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={(currentPage + 1) * pageSize >= rows.length}
                onClick={() => setPage(currentPage + 1)}
              >
                بعدی
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
