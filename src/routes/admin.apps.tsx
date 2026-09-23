import { createFileRoute } from "@tanstack/react-router";
import AppsSection from "@/components/admin/sections/AppsSection";

export const Route = createFileRoute("/admin/apps")({
  component: AppsSection,
});
