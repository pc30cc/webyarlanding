import { createFileRoute } from "@tanstack/react-router";
import BlogSection from "@/components/admin/sections/BlogSection";

export const Route = createFileRoute("/admin/blog")({
  component: BlogSection,
});
