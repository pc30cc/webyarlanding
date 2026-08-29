import { createFileRoute } from "@tanstack/react-router";
import SeoSection from "@/components/admin/sections/SeoSection";

export const Route = createFileRoute("/admin/seo")({
  component: SeoSection,
});
