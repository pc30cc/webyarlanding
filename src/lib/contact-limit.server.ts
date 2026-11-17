// سقف پیام فرم تماس از هر آی‌پی — فقط سمت سرور.
import { SlidingWindowLimiter } from "./rate-limit.server";

/** حداکثر پیام‌های پذیرفته‌شده از یک آی‌پی در هر پنجره */
export const CONTACT_MAX_PER_IP = 5;
export const CONTACT_WINDOW_MS = 10 * 60_000;

export const contactLimiter = new SlidingWindowLimiter(CONTACT_MAX_PER_IP, CONTACT_WINDOW_MS);
