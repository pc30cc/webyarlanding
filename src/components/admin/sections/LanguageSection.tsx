import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminTranslateSiteMessages } from "@/lib/site-translation.functions";
import {
  buildTranslationBatches,
  containsPersianProse,
} from "@/lib/site-translation-batches";
import { Languages, Loader2, Search } from "lucide-react";
import {
  adminListCatalogItems,
  adminListCatalogCategories,
} from "@/lib/catalog.functions";
import { adminListApps } from "@/lib/apps.functions";
import { listSeoPages } from "@/lib/seo.functions";
import type { LocalizationSettings, SiteSettings } from "@/lib/settings";
import {
  createSiteTranslator,
  normalizeMessage,
  type SiteLanguage,
} from "@/lib/site-i18n";
import messages from "@/lib/site-translations.en.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    if (include && /[\u0600-\u06ff]/.test(value)) result.add(value);
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

export function LanguageSection({
  settings,
  pending,
  onChange,
  onSwitch,
}: {
  settings: SiteSettings;
  pending: boolean;
  onChange: (settings: LocalizationSettings) => void;
  onSwitch: (language: SiteLanguage, english?: Record<string, string>) => void;
}) {
  const [search, setSearch] = useState("");
  const [showBuiltIn, setShowBuiltIn] = useState(false);
  const [page, setPage] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelled = useRef(false);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );
  const translateBatch = useServerFn(adminTranslateSiteMessages);
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
          pages.filter((page) => !/^\/(blog|tag)(\/|$)/.test(page.path)),
        ),
        items({ data: { type: "product" } }),
        items({ data: { type: "solution" } }),
        catalogCategories({ data: { type: "product" } }),
        catalogCategories({ data: { type: "solution" } }),
      ]),
  });
  const translate = useMemo(
    () => createSiteTranslator("en", settings.localization.english),
    [settings.localization.english],
  );
  const allRows = useMemo(() => {
    const originals = new Set<string>();
    collectContent(content.data, originals);
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
    if (showBuiltIn)
      Object.keys(messages).forEach((text) => originals.add(text));
    return Array.from(
      new Map(
        Array.from(originals).map((text) => [normalizeMessage(text), text]),
      ).values(),
    );
  }, [content.data, settings, showBuiltIn]);
  const rows = useMemo(
    () =>
      allRows
        .filter((text) =>
          (text + translate(text)).toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.localeCompare(b, "fa")),
    [allRows, search, translate],
  );

  async function selectLanguage(language: SiteLanguage) {
    if (language === "fa") {
      onSwitch(language);
      return;
    }
    if (!content.data || content.isError) {
      toast.error("ابتدا خواندن محتوای سایت باید کامل شود.");
      return;
    }
    const sources = allRows.filter((source) =>
      containsPersianProse(translate(source)),
    );
    if (!sources.length) {
      onSwitch(language);
      return;
    }
    const english = { ...settings.localization.english };
    const completed = new Map<string, string[]>();
    cancelled.current = false;
    setPreparing(true);
    try {
      const batches = buildTranslationBatches(sources);
      setProgress({ done: 0, total: batches.length });
      for (let i = 0; i < batches.length; i++) {
        if (cancelled.current) return;
        const batch = batches[i]!;
        const translations = await translateBatch({
          data: { texts: batch.map((chunk) => chunk.text) },
        });
        if (cancelled.current) return;
        batch.forEach((chunk, index) => {
          const parts =
            completed.get(chunk.source) ?? Array<string>(chunk.total).fill("");
          parts[chunk.index] = translations[index]!;
          completed.set(chunk.source, parts);
          if (parts.every(Boolean))
            english[normalizeMessage(chunk.source)] = parts.join("\n\n");
        });
        onChange({ ...settings.localization, english: { ...english } });
        setProgress({ done: i + 1, total: batches.length });
      }
      onSwitch(language, english);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ترجمه ناموفق بود؛ زبان سایت تغییر نکرد.",
      );
    } finally {
      setPreparing(false);
    }
  }
  const needsTranslation = allRows.some((text) =>
    containsPersianProse(translate(text)),
  );
  const missing = rows.filter((text) =>
    containsPersianProse(translate(text)),
  ).length;
  const pageSize = 20;
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  );
  return (
    <section
      className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-sm"
      dir="rtl"
    >
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Languages className="h-5 w-5" /> زبان تمام سایت
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          انتخاب زبان با یک کلیک ذخیره می‌شود و روی تمام صفحات عمومی سایت اعمال
          می‌شود. هنگام انتخاب انگلیسی، متن‌های اختصاصی بدون ترجمه با سرویس هوش
          مصنوعی تنظیم‌شده در ادمین ترجمه می‌شوند و از اعتبار همان سرویس استفاده
          می‌کنند. پس از تکمیل، زبان سایت تغییر می‌کند. برای ترجمه اولیه این بخش
          را تا پایان باز نگه دارید.
        </p>
      </div>
      <div
        className="flex flex-wrap gap-3"
        role="group"
        aria-label="انتخاب زبان سایت"
      >
        {(["fa", "en"] as const).map((language) => (
          <Button
            key={language}
            type="button"
            disabled={
              pending ||
              preparing ||
              (language === "en" && (content.isLoading || content.isError)) ||
              (settings.localization.language === language &&
                (language === "fa" || !needsTranslation))
            }
            aria-pressed={settings.localization.language === language}
            variant={
              settings.localization.language === language
                ? "default"
                : "outline"
            }
            onClick={() => void selectLanguage(language)}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {language === "en"
              ? settings.localization.language === "en" && needsTranslation
                ? "تکمیل ترجمه انگلیسی"
                : "English — انگلیسی"
              : "فارسی"}
          </Button>
        ))}
      </div>
      {preparing && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 text-sm"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال آماده‌سازی ترجمه‌ها: {progress.done} از {progress.total}
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
      <div className="border-t border-border pt-5">
        <h3 className="font-semibold">ترجمه محتوای قابل‌ویرایش</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          متن‌های صفحات سایت ترجمه شده‌اند. برای محصولات، راه‌کارها و متن‌های
          اختصاصی خودتان می‌توانید ترجمه‌ها را در این بخش بازبینی یا ویرایش کنید
          و «ذخیره تنظیمات» را بزنید. ترجمه خودکار فقط هنگام انتخاب انگلیسی اجرا
          می‌شود؛ نمایش صفحات از ترجمه ذخیره‌شده استفاده می‌کند. وبلاگ از ترجمه
          مستثناست و مقاله‌ها به زبان اصلی نمایش داده می‌شوند. متن فارسی حفظ
          می‌شود. اگر متن اصلی را تغییر دادید، ترجمه جدید را هم ثبت کنید.
        </p>
        {content.isLoading && (
          <p className="mt-3 text-sm">در حال خواندن محتوای سایت…</p>
        )}
        {content.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            خواندن محتوای سایت ناموفق بود.
            <Button
              type="button"
              variant="link"
              onClick={() => content.refetch()}
            >
              تلاش دوباره
            </Button>
          </p>
        )}
        {missing > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {missing} متن در این فهرست هنوز ترجمه انگلیسی ندارد.
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
          {rows
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((source) => {
              const key = normalizeMessage(source);
              const value = translate(source);
              return (
                <div
                  key={key}
                  className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2"
                >
                  <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">
                    {source}
                  </div>
                  <Textarea
                    disabled={preparing}
                    dir="ltr"
                    aria-label={"ترجمه انگلیسی: " + key.slice(0, 80)}
                    value={containsPersianProse(value) ? "" : value}
                    placeholder="English translation"
                    className="min-h-24 text-left"
                    onChange={(event) => {
                      const english = { ...settings.localization.english };
                      if (event.target.value.trim())
                        english[key] = event.target.value;
                      else delete english[key];
                      onChange({ ...settings.localization, english });
                    }}
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
      </div>
    </section>
  );
}
