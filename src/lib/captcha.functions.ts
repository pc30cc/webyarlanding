import { createServerFn } from "@tanstack/react-start";
import type { CaptchaChallenge } from "./captcha.server";

/** یک سؤال کپچای ریاضی فارسی جدید — برای فرم‌های عمومی مثل تماس با ما */
export const getCaptchaChallenge = createServerFn({ method: "GET" }).handler(
  async (): Promise<CaptchaChallenge> => {
    const { generateCaptcha } = await import("./captcha.server");
    return await generateCaptcha();
  },
);
