import { createFileRoute } from "@tanstack/react-router";
import CategoriesSection from "@/components/admin/sections/CategoriesSection";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesSection,
});
