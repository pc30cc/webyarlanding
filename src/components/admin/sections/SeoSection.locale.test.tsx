import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import SeoSection from "./SeoSection";

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/settings.functions", () => ({
  fetchSettings: async () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization.mode = "multi";
    settings.localization.locales = ["fa", "en"];
    return settings;
  },
  updateSettings: vi.fn(),
}));
vi.mock("@/lib/seo.functions", () => ({
  listSeoPages: async () => [],
  saveSeoPage: vi.fn(),
  deleteSeoPage: vi.fn(),
  checkSeoHealth: async () => [],
  checkCatalogSeoHealth: async () => [],
  adminFixSeoIssue: vi.fn(),
  seoBasePageKey: (key: string) => key.replace(/@(?:fa|en|tr|ar)$/, ""),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(cleanup);

describe("SEO pages per language", () => {
  it("shows the language prefix as an isolated left-to-right path in the Persian note", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SeoSection />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("tab", { name: "انگلیسی" }));
    const note = screen.getByText(/فقط روی نسخه انگلیسی صفحه‌ها/);
    const paths = Array.from(note.querySelectorAll("bdi"));
    expect(paths.map((bdi) => [bdi.getAttribute("dir"), bdi.textContent])).toEqual([
      ["ltr", "/en"],
    ]);
    const bare = note.cloneNode(true) as Element;
    bare.querySelectorAll("bdi").forEach((bdi) => bdi.remove());
    expect(bare.textContent).not.toContain("/en");
    expect(note.textContent).toContain("(با پیشوند /en) اعمال می‌شود");
  });
});
