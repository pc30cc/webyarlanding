import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("./db.server", () => ({
  db: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }),
      update: () => ({ eq: mocks.write }),
      insert: mocks.write,
    }),
  },
  newId: () => "new-settings-id",
  nowIso: () => "2026-10-04T00:00:00Z",
  parseJson: vi.fn(),
}));
import { saveSettings } from "./settings.server";

beforeEach(() => {
  mocks.read.mockReset();
  mocks.write.mockReset();
});
describe("language settings persistence", () => {
  it("reports read failures before writing", async () => {
    mocks.read.mockResolvedValue({
      data: null,
      error: new Error("Read failed"),
    });
    await expect(saveSettings(DEFAULT_SETTINGS)).rejects.toThrow("Read failed");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it.each([null, { id: "existing-id" }])(
    "reports failed writes for existing or new settings (%j)",
    async (data) => {
      mocks.read.mockResolvedValue({ data, error: null });
      mocks.write.mockResolvedValue({ error: new Error("Write failed") });
      await expect(saveSettings(DEFAULT_SETTINGS)).rejects.toThrow(
        "Write failed",
      );
    },
  );
  it("saves language and custom translations together", async () => {
    mocks.read.mockResolvedValue({ data: null, error: null });
    mocks.write.mockResolvedValue({ error: null });
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.localization = { language: "en", english: { متن: "Text" } };
    await saveSettings(settings);
    const payload = mocks.write.mock.calls[0]![0];
    expect(JSON.parse(payload.setting_value).localization).toEqual(
      settings.localization,
    );
  });
});
