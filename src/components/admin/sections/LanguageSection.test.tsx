import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { normalizeMessage } from "@/lib/site-i18n";
import { LanguageSection } from "./LanguageSection";

const mocks = vi.hoisted(() => ({
  content: [] as unknown[],
  stored: {
    translations: { en: {}, tr: {}, ar: {} } as Record<"en" | "tr" | "ar", Record<string, string>>,
    legacyEnglish: false,
  },
  translate: vi.fn(),
  save: vi.fn(),
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

/** «نص عربي» با حروف عربی (ي عربی، نه ی فارسی) */
const ARABIC_TEXT = "نص عربي";

afterEach(cleanup);
beforeEach(() => {
  mocks.content = [];
  mocks.stored = {
    translations: { en: {}, tr: {}, ar: {} },
    legacyEnglish: false,
  };
  mocks.translate.mockReset();
  mocks.save.mockReset();
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

const warnings = () =>
  screen.queryByRole("list", { name: "هشدارهای تنظیم زبان" })?.textContent ?? "";

describe("languages hub", () => {
  it("saves mode, default language and active languages in the fixed order", async () => {
    const { onSave } = mount();
    const save = screen.getByRole("button", { name: "ذخیره زبان‌ها" });
    expect(save).toBeDisabled();
    expect(warnings()).toBe("");
    fireEvent.click(screen.getByRole("radio", { name: /چندزبانه/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "عربی" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "انگلیسی" }));
    // زبان پیش‌فرض همیشه فعال است و برداشتنی نیست
    expect(screen.getByRole("checkbox", { name: "فارسی" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "فارسی" })).toBeDisabled();
    fireEvent.click(save);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        language: "fa",
        mode: "multi",
        locales: ["fa", "en", "ar"],
      }),
    );
  });

  it("warns that enabling English moves the English legal pages", () => {
    mount();
    fireEvent.click(screen.getByRole("radio", { name: /چندزبانه/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "انگلیسی" }));
    expect(warnings()).toContain("/en/privacy");
    expect(warnings()).toContain("App Store");
  });

  it("warns about languages without a UI dictionary and shows their status", () => {
    mount();
    fireEvent.click(screen.getByRole("radio", { name: /چندزبانه/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "ترکی" }));
    expect(warnings()).toContain("ترکی");
    expect(warnings()).toContain("noindex");
    const table = screen.getByRole("table", { name: "وضعیت زبان‌ها" });
    const turkish = within(table).getByText("ترکی").closest("tr")!;
    expect(turkish.textContent).toContain("فعال");
    expect(turkish.textContent).not.toContain("غیرفعال");
    expect(turkish.textContent).toContain("ندارد (noindex)");
    const english = within(table).getByText("انگلیسی").closest("tr")!;
    expect(english.textContent).toContain("غیرفعال");
    expect(english.textContent).toContain("دارد");
  });

  it("warns that changing the default language changes every URL and keeps it active", async () => {
    const { onSave } = mount();
    fireEvent.change(screen.getByRole("combobox", { name: "زبان پیش‌فرض" }), {
      target: { value: "en" },
    });
    expect(warnings()).toContain("همه آدرس‌های سایت");
    expect(screen.getByRole("checkbox", { name: "انگلیسی" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "ذخیره زبان‌ها" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        language: "en",
        mode: "single",
        locales: ["fa", "en"],
      }),
    );
  });
});

describe("per-language content translations", () => {
  it("offers only the selected non-Persian languages as translation targets", () => {
    mount(multi("en", "ar"));
    const select = screen.getByRole("combobox", { name: "زبان ترجمه" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => (option as HTMLOptionElement).value),
    ).toEqual(["en", "ar"]);
  });

  it("asks for a language when only Persian is selected", () => {
    mount();
    expect(screen.queryByRole("combobox", { name: "زبان ترجمه" })).toBeNull();
    expect(screen.getByText(/حداقل یک زبان غیر از فارسی/)).toBeInTheDocument();
  });

  it("excludes drafts and disabled items and skips the provider when nothing is missing", async () => {
    mocks.content = [
      [
        { title: "پیش نویس خصوصی", status: "draft" },
        { title: "محصول مخفی", published: false },
        { name: "اپلیکیشن مخفی", enabled: false },
      ],
    ];
    mount(multi("en"));
    fireEvent.click(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    expect(mocks.translate).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.queryByText("پیش نویس خصوصی")).toBeNull();
  });

  it("translates missing Arabic content and stores it in the Arabic map only", async () => {
    const translated = "این متن قبلا ترجمه شده است";
    const source = "این متن اختصاصی محصول تست است";
    mocks.content = [[{ content: source }, { title: translated }]];
    mocks.stored.translations.ar = { [normalizeMessage(translated)]: ARABIC_TEXT };
    mocks.translate.mockImplementation(async ({ data }: { data: { texts: string[] } }) =>
      data.texts.map(() => ARABIC_TEXT),
    );
    mount(multi("en", "ar"));
    fireEvent.change(screen.getByRole("combobox", { name: "زبان ترجمه" }), {
      target: { value: "ar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    const calls = mocks.translate.mock.calls.map(
      ([args]) => args.data as { texts: string[]; targetLocale: string },
    );
    expect(calls.every((call) => call.targetLocale === "ar")).toBe(true);
    const sent = calls.flatMap((call) => call.texts);
    expect(sent).toContain(source);
    // ترجمه عربیِ موجود (هم‌خط با فارسی) ترجمه‌نشده حساب نمی‌شود
    expect(sent).not.toContain(translated);
    const [last] = mocks.save.mock.lastCall!;
    expect(last.data.locale).toBe("ar");
    expect(last.data.translations).toMatchObject({
      [normalizeMessage(source)]: ARABIC_TEXT,
      [normalizeMessage(translated)]: ARABIC_TEXT,
    });
  });

  it("keeps the saved translations on provider failure", async () => {
    mocks.content = [[{ title: "عنوان اختصاصی ترجمه نشده" }]];
    mocks.translate.mockRejectedValue(new Error("Provider unavailable"));
    mount(multi("en"));
    fireEvent.click(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Provider unavailable"));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("saves a manual English edit and clears the legacy settings copy", async () => {
    const source = "عنوان اختصاصی محصول";
    mocks.content = [[{ title: source }]];
    mocks.stored.legacyEnglish = true;
    mocks.stored.translations.en = { "متن قدیمی": "Old text" };
    mocks.save.mockResolvedValue({ ok: true, clearedLegacy: true });
    const { onLegacyEnglishCleared } = mount(multi("en"));
    const save = screen.getByRole("button", { name: "ذخیره ترجمه‌های انگلیسی" });
    expect(save).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "ترجمه انگلیسی: " + normalizeMessage(source),
      }),
      { target: { value: "Custom product title" } },
    );
    fireEvent.click(save);
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        data: {
          locale: "en",
          translations: {
            "متن قدیمی": "Old text",
            [normalizeMessage(source)]: "Custom product title",
          },
        },
      }),
    );
    await waitFor(() => expect(onLegacyEnglishCleared).toHaveBeenCalled());
  });
});
