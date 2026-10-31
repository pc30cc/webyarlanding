import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { normalizeMessage } from "@/lib/site-i18n";
import { LanguageSection } from "./LanguageSection";

// react-query واقعی با یک QueryClient مشترک، مثل پنل که بین بخش‌ها جابه‌جا می‌شود
type Maps = Record<"en" | "tr" | "ar", Record<string, string>>;
const mocks = vi.hoisted(() => ({
  server: { translations: {} as Record<string, Record<string, string>>, legacyEnglish: false },
  get: vi.fn(),
  save: vi.fn(),
  translate: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/site-translation.functions", () => ({
  adminTranslateSiteMessages: mocks.translate,
}));
vi.mock("@/lib/site-translations.functions", () => ({
  adminGetSiteTranslations: mocks.get,
  adminSaveSiteTranslations: mocks.save,
}));
vi.mock("@/lib/catalog.functions", () => ({
  adminListCatalogItems: async ({ data }: { data: { type: string } }) =>
    data.type === "product" ? [{ title: FIRST }, { title: SECOND }] : [],
  adminListCatalogCategories: async () => [],
}));
vi.mock("@/lib/apps.functions", () => ({ adminListApps: async () => [] }));
vi.mock("@/lib/seo.functions", () => ({ listSeoPages: async () => [] }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const FIRST = "عنوان اختصاصی اول";
const SECOND = "عنوان اختصاصی دوم";
const LEGACY_NOTE = /ترجمه‌های انگلیسی فعلی هنوز در تنظیمات عمومی/;

beforeEach(() => {
  mocks.server = {
    translations: { en: { "متن قدیمی": "Old text" }, tr: {}, ar: {} },
    legacyEnglish: true,
  };
  // سرور ساختگی: خواندن نسخه فعلی، ذخیره جایگزینی کامل نقشه یک زبان
  mocks.get.mockReset();
  mocks.get.mockImplementation(async () => structuredClone(mocks.server));
  mocks.save.mockReset();
  mocks.save.mockImplementation(
    async ({ data }: { data: { locale: keyof Maps; translations: Record<string, string> } }) => {
      mocks.server.translations[data.locale] = { ...data.translations };
      const clearedLegacy = data.locale === "en" && mocks.server.legacyEnglish;
      if (data.locale === "en") mocks.server.legacyEnglish = false;
      return { ok: true, clearedLegacy };
    },
  );
  mocks.translate.mockReset();
});
afterEach(cleanup);

function mount(client: QueryClient) {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.mode = "multi";
  settings.localization.locales = ["fa", "en"];
  return render(
    <QueryClientProvider client={client}>
      <LanguageSection settings={settings} pending={false} onSave={vi.fn()} />
    </QueryClientProvider>,
  );
}
const field = (source: string) =>
  screen.findByRole("textbox", {
    name: "ترجمه انگلیسی: " + normalizeMessage(source),
  }) as Promise<HTMLTextAreaElement>;
const saveButton = () => screen.getByRole("button", { name: "ذخیره ترجمه‌های انگلیسی" });

describe("stored translations after a save", () => {
  it("shows the saved values after switching sections and never saves the old map back", async () => {
    const client = new QueryClient();
    const first = mount(client);
    fireEvent.change(await field(FIRST), { target: { value: "First title" } });
    expect(screen.getByText(LEGACY_NOTE)).toBeInTheDocument();
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    // پس از اولین ذخیره انگلیسی، یادداشت «هنوز در تنظیمات قدیمی» دیگر درست نیست
    await waitFor(() => expect(screen.queryByText(LEGACY_NOTE)).toBeNull());
    expect(client.getQueryData(["site-translations"])).toMatchObject({
      translations: { en: { [normalizeMessage(FIRST)]: "First title" } },
      legacyEnglish: false,
    });

    // رفتن به بخش دیگر و برگشتن (در کمتر از ۶۰ ثانیه)
    first.unmount();
    mount(client);
    expect((await field(FIRST)).value).toBe("First title");
    expect(screen.queryByText(LEGACY_NOTE)).toBeNull();
    fireEvent.change(await field(SECOND), { target: { value: "Second title" } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.lastCall![0].data.translations).toEqual({
      "متن قدیمی": "Old text",
      [normalizeMessage(FIRST)]: "First title",
      [normalizeMessage(SECOND)]: "Second title",
    });
  });

  it("keeps auto-translated batches after switching sections", async () => {
    mocks.translate.mockImplementation(async ({ data }: { data: { texts: string[] } }) =>
      data.texts.map((text) => ({ status: "accepted", text: "EN " + text.length })),
    );
    const client = new QueryClient();
    const first = mount(client);
    await field(FIRST);
    fireEvent.click(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "ترجمه خودکار متن‌های بدون ترجمه" })).toBeEnabled(),
    );
    const translated = mocks.save.mock.lastCall![0].data.translations as Record<string, string>;
    expect(translated[normalizeMessage(FIRST)]).toBe("EN " + FIRST.length);

    first.unmount();
    mount(client);
    expect((await field(FIRST)).value).toBe("EN " + FIRST.length);
    fireEvent.change(await field(SECOND), { target: { value: "Manual" } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.lastCall![0].data.translations).toEqual({
      ...translated,
      [normalizeMessage(SECOND)]: "Manual",
    });
  });
});
