import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { isLocale } from "./lib/locales";
import { loadSiteMessages } from "./lib/site-messages";

// دیکشنری زبان صفحه (data-locale روی <html>، فقط برای زبان‌های غیرفارسی) پیش از hydration
// بارگذاری می‌شود تا رندر مرورگر با HTML سرور یکی باشد. دیکشنری فایل جدا و قابل‌کش است، نه
// بخشی از HTML هر صفحه.
const locale = document.documentElement.dataset["locale"];
const ready = isLocale(locale) ? loadSiteMessages(locale) : Promise.resolve();

void ready
  .catch((error) => console.error("site messages failed to load:", error))
  .then(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <StartClient />
        </StrictMode>,
      );
    });
  });
