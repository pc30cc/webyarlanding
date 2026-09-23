import { createFileRoute, redirect } from "@tanstack/react-router";

// صفحه مستندات API حذف شد؛ آدرس قدیمی به صفحه دانلود برنامه منتقل می‌شود.
export const Route = createFileRoute("/api-docs")({
  beforeLoad: () => {
    throw redirect({ to: "/download", statusCode: 301 });
  },
});
