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
    expect(isUntranslated(ARABIC, "ar", "چت زنده در سایت شما")).toBe(false);
    expect(isUntranslated(ARABIC, "ar")).toBe(false);
  });

  it("detects Persian left in Arabic by Persian-only letters", () => {
    for (const text of ["پشتیبانی", "چت", "ژورنال", "گفتگو", "کمک", "سایت"]) {
      expect(isUntranslated(text, "ar")).toBe(true);
    }
  });

  it("detects Arabic output identical to the Persian source", () => {
    // «تماس» حرف مخصوص فارسی ندارد؛ فقط مقایسه با متن مبدأ آن را تشخیص می‌دهد
    expect(isUntranslated("تماس", "ar")).toBe(false);
    expect(isUntranslated("تماس", "ar", "تماس")).toBe(true);
    // ارقام و فاصله‌ها در مقایسه یکسان می‌شوند (مترجم سایت ارقام را لاتین می‌کند)
    expect(isUntranslated("سلام 2", "ar", "سلام  ۲")).toBe(true);
    // متن لاتین یکسان (مثلاً نام محصول) ترجمه‌نشده نیست
    expect(isUntranslated("API", "ar", "API")).toBe(false);
  });

  it("never flags Persian itself", () => {
    expect(isUntranslated("چت زنده", "fa", "چت زنده")).toBe(false);
  });
});
