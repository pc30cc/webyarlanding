// خواندن آی‌پی و کشور بازدیدکننده از درخواست جاری (TanStack Start) — فقط سمت سرور.
// قاعده‌اش در client-ip.server.ts است.
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import {
  resolveClientIp,
  resolveCloudflareCountry,
  type ForwardingFacts,
} from "./client-ip.server";

function currentFacts(): ForwardingFacts {
  return {
    // بدون xForwardedFor: آدرس سوکت، نه اولین ورودی X-Forwarded-For که دست بازدیدکننده است.
    peer: getRequestIP(),
    xForwardedFor: getRequestHeader("x-forwarded-for"),
    cfConnectingIp: getRequestHeader("cf-connecting-ip"),
    cfIpCountry: getRequestHeader("cf-ipcountry"),
  };
}

/** آی‌پی بازدیدکننده درخواست جاری (یا رشته خالی وقتی معلوم نیست). */
export function requestClientIp(): string {
  return resolveClientIp(currentFacts());
}

/** کشور بازدیدکننده درخواست جاری از کلادفلر، فقط وقتی درخواست واقعاً از کلادفلر آمده است. */
export function requestCloudflareCountry(): string | null {
  return resolveCloudflareCountry(currentFacts());
}
