import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { routeTree } from "./routeTree.gen";
import { splitLocalePrefix, type Locale } from "./lib/locales";
import { createLocaleRewrite } from "./lib/locale-routing";

/** مسیر آدرسی که router برای آن ساخته می‌شود: درخواست سرور یا آدرس فعلی مرورگر */
const initialPathname = createIsomorphicFn()
  .server(() => getRequestUrl().pathname)
  .client(() => window.location.pathname);

export const getRouter = () => {
  const queryClient = new QueryClient();
  // پیشوند زبانِ آدرس فعلی (/en، /tr، /ar). یک router برای هر درخواست سرور و یکی در مرورگر
  // ساخته می‌شود، پس این مقدار بین درخواست‌ها مشترک نیست. تغییر زبان همیشه با بارگذاری
  // کامل صفحه است، پس پیشوند در طول عمر یک router ثابت می‌ماند.
  const prefix: Locale | null = splitLocalePrefix(initialPathname()).locale;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // routeها بدون پیشوند زبان تعریف شده‌اند: پیشوند هنگام خواندن آدرس حذف و هنگام ساختن
    // لینک‌ها دوباره اضافه می‌شود. فقط برای آدرس‌های پیشونددار نصب می‌شود، چون وجود rewrite
    // باعث می‌شود router پارامترهای آدرس را بازنویسی و با ریدایرکت یکسان‌سازی کند
    // (مثلاً ?v=2.10 → ?v=2.1) و آدرس‌های زبان پیش‌فرض باید دقیقاً مثل قبل بمانند.
    ...(prefix ? { rewrite: createLocaleRewrite(prefix) } : {}),
  });

  return router;
};
