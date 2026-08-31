import { createFileRoute } from "@tanstack/react-router";
import CatalogSection from "@/components/admin/sections/CatalogSection";

export const Route = createFileRoute("/admin/catalog")({
  component: CatalogSection,
});
