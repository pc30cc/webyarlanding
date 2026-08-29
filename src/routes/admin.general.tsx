import { createFileRoute } from "@tanstack/react-router";
import GeneralSection from "@/components/admin/sections/GeneralSection";

export const Route = createFileRoute("/admin/general")({
  component: GeneralSection,
});
