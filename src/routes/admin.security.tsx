import { createFileRoute } from "@tanstack/react-router";
import SecuritySection from "@/components/admin/sections/SecuritySection";

export const Route = createFileRoute("/admin/security")({
  component: SecuritySection,
});
