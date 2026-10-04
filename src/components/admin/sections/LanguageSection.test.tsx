import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { normalizeMessage } from "@/lib/site-i18n";
import { LanguageSection } from "./LanguageSection";

const mocks = vi.hoisted(() => ({
  content: [] as unknown[],
  translate: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mocks.content, isLoading: false, isError: false }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/site-translation.functions", () => ({
  adminTranslateSiteMessages: mocks.translate,
  adminListTranslationPosts: vi.fn(),
}));
vi.mock("@/lib/blog.functions", () => ({
  adminListPosts: vi.fn(),
  listCategories: vi.fn(),
  listTags: vi.fn(),
}));
vi.mock("@/lib/catalog.functions", () => ({
  adminListCatalogItems: vi.fn(),
  adminListCatalogCategories: vi.fn(),
}));
vi.mock("@/lib/apps.functions", () => ({ adminListApps: vi.fn() }));
vi.mock("@/lib/seo.functions", () => ({ listSeoPages: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

afterEach(cleanup);
beforeEach(() => {
  mocks.content = [];
  mocks.translate.mockReset();
  mocks.error.mockReset();
});

function mount(language: "fa" | "en" = "fa") {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.language = language;
  const onSwitch = vi.fn();
  render(
    <LanguageSection
      settings={settings}
      pending={false}
      onChange={vi.fn()}
      onSwitch={onSwitch}
    />,
  );
  return onSwitch;
}

describe("one-click site language", () => {
  it("excludes drafts and disabled items from public translation storage", async () => {
    mocks.content = [
      [
        { title: "پیش نویس خصوصی", status: "draft" },
        { title: "محصول مخفی", published: false },
        { name: "اپلیکیشن مخفی", enabled: false },
      ],
    ];
    const onSwitch = mount();
    fireEvent.click(screen.getByRole("button", { name: "English — انگلیسی" }));
    await waitFor(() => expect(onSwitch).toHaveBeenCalledWith("en"));
    expect(mocks.translate).not.toHaveBeenCalled();
    expect(screen.queryByText("پیش نویس خصوصی")).toBeNull();
  });
  it("switches immediately when built-in translations cover the content", async () => {
    const onSwitch = mount();
    fireEvent.click(screen.getByRole("button", { name: "English — انگلیسی" }));
    await waitFor(() => expect(onSwitch).toHaveBeenCalledWith("en"));
    expect(mocks.translate).not.toHaveBeenCalled();
  });
  it("waits for complete custom content translation before saving English", async () => {
    const source = "این متن اختصاصی مقاله تست است";
    mocks.content = [[{ content: source }]];
    mocks.translate.mockResolvedValue([
      "This is the custom test article content",
    ]);
    const onSwitch = mount();
    fireEvent.click(screen.getByRole("button", { name: "English — انگلیسی" }));
    await waitFor(() =>
      expect(onSwitch).toHaveBeenCalledWith(
        "en",
        expect.objectContaining({
          [normalizeMessage(source)]: "This is the custom test article content",
        }),
      ),
    );
    expect(mocks.translate).toHaveBeenCalledWith({ data: { texts: [source] } });
  });
  it("keeps the current language on provider failure and allows completing new content in English mode", async () => {
    mocks.content = [[{ title: "عنوان اختصاصی ترجمه نشده" }]];
    mocks.translate.mockRejectedValue(new Error("Provider unavailable"));
    const onSwitch = mount("en");
    fireEvent.click(
      screen.getByRole("button", { name: "تکمیل ترجمه انگلیسی" }),
    );
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Provider unavailable"),
    );
    expect(onSwitch).not.toHaveBeenCalled();
  });
});
