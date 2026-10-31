import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { normalizeMessage } from "@/lib/site-i18n";
import { LanguageSection } from "@/components/admin/sections/LanguageSection";

const mocks = vi.hoisted(() => ({
  content: [] as unknown[],
  stored: {
    translations: { en: {}, tr: {}, ar: {} } as Record<"en" | "tr" | "ar", Record<string, string>>,
    legacyEnglish: false,
  },
  translate: vi.fn(),
  save: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === "site-translations" ? mocks.stored : mocks.content,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useQueryClient: () => ({
    setQueryData: mocks.setQueryData,
    invalidateQueries: mocks.invalidateQueries,
  }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/site-translation.functions", () => ({
  adminTranslateSiteMessages: mocks.translate,
}));
vi.mock("@/lib/site-translations.functions", () => ({
  adminGetSiteTranslations: vi.fn(),
  adminSaveSiteTranslations: mocks.save,
}));
vi.mock("@/lib/catalog.functions", () => ({
  adminListCatalogItems: vi.fn(),
  adminListCatalogCategories: vi.fn(),
}));
vi.mock("@/lib/apps.functions", () => ({ adminListApps: vi.fn() }));
vi.mock("@/lib/seo.functions", () => ({ listSeoPages: vi.fn() }));
vi.mock("sonner", () => ({
  toast: { error: mocks.error, success: mocks.success },
}));

afterEach(cleanup);
beforeEach(() => {
  mocks.content = [];
  mocks.stored = {
    translations: { en: {}, tr: {}, ar: {} },
    legacyEnglish: false,
  };
  mocks.translate.mockReset();
  mocks.save.mockReset();
  mocks.setQueryData.mockReset();
  mocks.invalidateQueries.mockReset();
  mocks.save.mockResolvedValue({ ok: true, clearedLegacy: false });
  mocks.error.mockReset();
  mocks.success.mockReset();
});

function mount(
  configure: (settings: SiteSettings) => void = () => {},
  onLegacyEnglishCleared = vi.fn(),
) {
  const settings = structuredClone(DEFAULT_SETTINGS);
  configure(settings);
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <LanguageSection
      settings={settings}
      pending={false}
      onSave={onSave}
      onLegacyEnglishCleared={onLegacyEnglishCleared}
    />,
  );
  return { onSave, onLegacyEnglishCleared };
}

const multi =
  (...locales: ("en" | "tr" | "ar")[]) =>
  (settings: SiteSettings) => {
    settings.localization.mode = "multi";
    settings.localization.locales = ["fa", ...locales];
  };

describe("Arabic editor: untranslated Persian without Persian-only letters", () => {
  it("leaves multi-word Persian sources empty in the Arabic editor and sends them to the AI", async () => {
    mocks.content = [[{ title: "تماس با ما" }, { title: "درباره ما" }, { title: "پشتیبانی" }]];
    mocks.translate.mockImplementation(async ({ data }: { data: { texts: string[] } }) =>
      data.texts.map(() => ({ status: "accepted", text: "نص عربي" })),
    );
    mount(multi("ar"));
    const field = (source: string) =>
      screen.getByRole("textbox", { name: "ترجمه عربی: " + source }) as HTMLTextAreaElement;
    expect(field("تماس با ما").value).toBe("");
    expect(field("درباره ما").value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    const sent = mocks.translate.mock.calls.flatMap(
      ([args]) => (args.data as { texts: string[] }).texts,
    );
    expect(sent).toEqual(expect.arrayContaining(["تماس با ما", "درباره ما", "پشتیبانی"]));
  });
});
