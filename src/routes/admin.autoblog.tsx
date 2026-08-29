import { createFileRoute } from "@tanstack/react-router";
import AutoBlogSection from "@/components/admin/sections/AutoBlogSection";

export const Route = createFileRoute("/admin/autoblog")({
  component: AutoBlogSection,
});
