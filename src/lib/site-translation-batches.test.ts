import { describe, expect, it } from "vitest";
import { containsPersianProse, isUntranslated } from "./site-translation-batches";

/** متن عربی با حروف عربی (ي و ك عربی، نه ی و ک فارسی) */
const ARABIC = "الدردشة المباشرة في موقعك";

describe("untranslated text detection", () => {
  it("treats any Persian script as untranslated for Latin-script languages", () => {
    for (const locale of ["en", "tr"] as const) {
      expect(isUntranslated("Live chat", locale)).toBe(false);
      expect(isUntranslated("Canlı sohbet", locale)).toBe(false);
      expect(isUntranslated("چت زنده", locale)).toBe(true);
      expect(isUntranslated("Live چت", locale)).toBe(true);
      // آدرس‌ها و کد متن قابل ترجمه نیستند
      expect(isUntranslated("A [link](https://example.com/مقاله)", locale)).toBe(false);
      expect(isUntranslated("Run `کد`", locale)).toBe(false);
    }
  });

  it("accepts Arabic translations although they share the Persian script", () => {
    expect(containsPersianProse(ARABIC)).toBe(true); // روش قدیمی عربی را فارسی می‌دانست
    expect(isUntranslated(ARABIC, "ar")).toBe(false);
  });

  it("detects Persian left in Arabic by Persian-only letters", () => {
    for (const text of ["پشتیبانی", "چت", "ژورنال", "گفتگو", "کمک", "سایت"]) {
      expect(isUntranslated(text, "ar")).toBe(true);
    }
    // آدرس و کد متن قابل ترجمه نیستند
    expect(isUntranslated("رابط `کد` [صفحه](https://example.com/پشتیبانی)", "ar")).toBe(false);
  });

  it("accepts Arabic text spelled exactly like the Persian source", () => {
    // نام‌ها و واژه‌هایی که در عربی همان املای فارسی را دارند ترجمه درست‌اند، نه متن ترجمه‌نشده
    for (const name of ["سارا", "محمد", "حسن", "واتساب", "تماس"]) {
      expect(isUntranslated(name, "ar")).toBe(false);
    }
    // ارقام فارسی هنگام نمایش لاتین می‌شوند و نشانه ترجمه‌نشدن نیستند
    expect(isUntranslated("سارا ۲", "ar")).toBe(false);
    expect(isUntranslated("API", "ar")).toBe(false);
  });

  it("never flags Persian itself", () => {
    expect(isUntranslated("چت زنده", "fa")).toBe(false);
  });
});
