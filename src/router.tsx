import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isLocalizablePath, splitLocalePrefix, withLocalePrefix, type Locale } from "./lib/locales";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // پیشوند زبانِ آدرس فعلی (/en، /tr، /ar). یک router برای هر درخواست سرور و یکی در مرورگر
  // ساخته می‌شود، پس این مقدار بین درخواست‌ها مشترک نیست.
  let prefix: Locale | null = null;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // routeها بدون پیشوند زبان تعریف شده‌اند: پیشوند هنگام خواندن آدرس حذف و هنگام ساختن
    // لینک‌ها دوباره اضافه می‌شود، پس همه لینک‌های داخلی در همان زبان صفحه می‌مانند.
    rewrite: {
      input: ({ url }) => {
        const { locale, path } = splitLocalePrefix(url.pathname);
        prefix = locale;
        if (!locale) return undefined;
        url.pathname = path;
        return url;
      },
      output: ({ url }) => {
        if (!prefix || !isLocalizablePath(url.pathname)) return undefined;
        url.pathname = withLocalePrefix(url.pathname, prefix);
        return url;
      },
    },
  });

  return router;
};
