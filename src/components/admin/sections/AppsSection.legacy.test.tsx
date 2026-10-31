import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import type { AppDto } from "@/lib/apps.functions";
import type { Locale } from "@/lib/locales";
import AppsSection from "./AppsSection";

// پنل برنامه‌ها با نسخه انگلیسی قدیمی (apps_en): نمایش معنای واقعی و داده ذخیره
const mocks = vi.hoisted(() => ({
  apps: [] as unknown[],
  settings: null as unknown,
  save: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/apps.functions", () => ({
  adminListApps: async () => ({
    apps: mocks.apps,
    stats: { total: 0, perApp: [], daily: [] },
  }),
  adminSaveApp: mocks.save,
  adminDeleteApp: vi.fn(),
}));
vi.mock("@/lib/settings.functions", () => ({ fetchSettings: async () => mocks.settings }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function app(id: string, extra: Partial<AppDto> = {}): AppDto {
  return {
    id,
    slug: id,
    platform: "android",
    name: `App ${id}`,
    subtitle: "",
    iconUrl: "",
    shortDesc: "",
    description: "",
    features: [],
    screenshots: [],
    version: "1.0",
    size: "",
    minOs: "",
    downloadUrl: `https://store.example/fa-${id}`,
    sortOrder: 0,
    enabled: true,
    downloadUrlEn: "",
    enabledEn: true,
    locales: {},
    ...extra,
  };
}

function site(locales: Locale[]): SiteSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.localization.mode = locales.length > 1 ? "multi" : "single";
  settings.localization.locales = locales;
  return settings;
}

const LEGACY_EMPTY = { downloadUrl: "", enabled: true, legacy: true };

afterEach(cleanup);
beforeEach(() => {
  mocks.settings = site(["fa", "en"]);
  mocks.apps = [
    app("a1", { locales: { en: LEGACY_EMPTY } }),
    app("a2", { enabled: false, locales: { en: LEGACY_EMPTY } }),
  ];
  mocks.save.mockReset();
  mocks.save.mockResolvedValue({ ok: true, id: "a1" });
});

const mount = () => render(<AppsSection />);

/** کارت یک برنامه در فهرست */
async function card(name: string) {
  const title = await screen.findByText(name);
  return title.closest("[class*='flex-1']") as HTMLElement;
}

/** باز کردن فرم ویرایش یک برنامه */
async function edit(name: string) {
  fireEvent.click(within(await card(name)).getByRole("button", { name: /ویرایش/ }));
  return screen.getByText(/لینک دانلود نسخه انگلیسی/).closest("div") as HTMLElement;
}

const savedData = () =>
  (mocks.save.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> }).data;

describe("legacy English entries in the apps panel", () => {
  it("shows what a legacy entry really does on the public site", async () => {
    mount();
    const a1 = await card("App a1");
    await waitFor(() => expect(a1.textContent).toContain("EN: بدون لینک («به‌زودی»)"));
    expect(a1.textContent).toContain("تنظیم قدیمی");
    expect(a1.textContent).not.toContain("همان لینک زبان پیش‌فرض");
    // خاموش در جدول apps ولی با نسخه قدیمی روشن در انگلیسی نمایش داده می‌شود
    const a2 = await card("App a2");
    expect(a2.textContent).toContain("خاموش");
    expect(a2.textContent).toContain("نمایش در انگلیسی");
    expect(a1.textContent).not.toContain("نمایش در انگلیسی");
  });

  it("sends the untouched legacy entry back with its flag when other fields change", async () => {
    mount();
    const english = await edit("App a2");
    expect(english.textContent).toContain("لینک ندارد");
    const note = within(english).getByText(/تنظیم قدیمی انگلیسی/);
    expect(note.querySelector("bdi[dir='ltr']")?.textContent).toBe("/en/download");
    fireEvent.change(screen.getByDisplayValue("App a2"), { target: { value: "App a2 new" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(savedData()).toMatchObject({
      id: "a2",
      name: "App a2 new",
      enabled: false,
      locales: { en: LEGACY_EMPTY },
    });
  });

  it("drops the flag only when the English fields are edited, and can restore it", async () => {
    mount();
    const english = await edit("App a1");
    fireEvent.change(within(english).getByRole("textbox"), {
      target: { value: "https://en.example/a1" },
    });
    expect(english.textContent).toContain("به قاعده جدید تبدیل می‌شود");
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(savedData()["locales"]).toEqual({
      en: { downloadUrl: "https://en.example/a1", enabled: true },
    });

    // منصرف شدن: بازگرداندن تنظیم قدیمی همان داده دست‌نخورده را می‌فرستد
    const again = await edit("App a1");
    fireEvent.click(within(again).getByRole("switch"));
    fireEvent.click(within(again).getByRole("button", { name: "بازگرداندن تنظیم قدیمی" }));
    expect(again.textContent).not.toContain("به قاعده جدید تبدیل می‌شود");
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(savedData()["locales"]).toEqual({ en: LEGACY_EMPTY });
  });

  it("keeps a hidden legacy entry in the payload on a Persian-only site", async () => {
    mocks.settings = site(["fa"]);
    mount();
    const a1 = await card("App a1");
    await waitFor(() => expect(a1.textContent).toContain("App a1"));
    expect(a1.textContent).not.toContain("EN:");
    fireEvent.click(within(a1).getByRole("button", { name: /ویرایش/ }));
    expect(screen.queryByText(/لینک دانلود نسخه انگلیسی/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(savedData()["locales"]).toEqual({ en: LEGACY_EMPTY });
  });
});
