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

  it("detects Persian left in Arabic that has no Persian-only letters by comparing with the source", () => {
    // بازبینی: «درباره ما» و مانند آن حرف مخصوص فارسی ندارند و بدون مقایسه با مبدأ ترجمه‌شده حساب می‌شدند
    for (const text of ["درباره ما", "تماس با ما", "سوالات متداول", "ثبت نام", "راه‌حل‌ها"]) {
      expect(isUntranslated(text, "ar", text)).toBe(true);
    }
    // ارقام، فاصله و نیم‌فاصله در مقایسه یکسان‌اند
    expect(isUntranslated("صفحه 2  از 3", "ar", "صفحه ۲ از ۳")).toBe(true);
    expect(
      isUntranslated(
        "درباره ما [link](https://example.com/ar)",
        "ar",
        "درباره ما [link](https://example.com/fa)",
      ),
    ).toBe(true);
    // ترجمه عربی واقعی (متفاوت با مبدأ) پذیرفته می‌شود
    expect(isUntranslated("من نحن", "ar", "درباره ما")).toBe(false);
    expect(isUntranslated("اتصل بنا", "ar", "تماس با ما")).toBe(false);
  });

  it("still accepts a single word spelled like the Persian source", () => {
    for (const name of ["سارا", "محمد", "حسن", "واتساب", "تماس"]) {
      expect(isUntranslated(name, "ar", name)).toBe(false);
    }
    // رقم یا واژه لاتین کنار نام، واژه فارسی/عربی دوم حساب نمی‌شود
    expect(isUntranslated("سارا ۲", "ar", "سارا ۲")).toBe(false);
    expect(isUntranslated("واتساب Business", "ar", "واتساب Business")).toBe(false);
    expect(isUntranslated("API v2", "ar", "API v2")).toBe(false);
  });

  it("uses the source only for Arabic", () => {
    expect(isUntranslated("Live chat", "en", "Live chat")).toBe(false);
    expect(isUntranslated("درباره ما", "tr", "درباره ما")).toBe(true);
    expect(isUntranslated("درباره ما", "fa", "درباره ما")).toBe(false);
  });

  it("never flags Persian itself", () => {
    expect(isUntranslated("چت زنده", "fa")).toBe(false);
  });
});
