import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { PostDto } from "@/lib/blog.functions";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** "Oct 4, 2026"; empty when the date is missing or invalid. */
export function formatPostDate(post: Pick<PostDto, "publishedAt" | "createdAt">): string {
  const value = post.publishedAt || post.createdAt;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

/** Reading time from the markdown body (works for Latin and Persian text). */
export function readingMinutes(markdown: string): number {
  const words = (markdown || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Same tag slug the Persian blog uses for /tag/$slug links. */
export function tagSlug(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_/\\.,:;!?"'`(){}[\]]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Blog posts keep their original language; mark Persian text right-to-left. */
export function textDir(text: string): "rtl" | "ltr" {
  return /[؀-ۿ]/.test(text) ? "rtl" : "ltr";
}

/** Page numbers with gaps: 1 … 4 5 6 … 12 */
export function pageList(current: number, total: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - current) <= 1) pages.push(n);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }
  return pages;
}

/** Debounced search box bound to the ?q= parameter of /blog. */
export function useBlogSearch(initial: string | undefined) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial ?? "");
  useEffect(() => setValue(initial ?? ""), [initial]);
  useEffect(() => {
    if (value === (initial ?? "")) return;
    const timeout = setTimeout(() => {
      void navigate({
        to: "/blog",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          q: value.trim() || undefined,
          page: 1,
        }),
        replace: true,
      } as never);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return { value, setValue };
}
