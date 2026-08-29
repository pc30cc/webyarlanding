import { createFileRoute } from "@tanstack/react-router";
import AiSection from "@/components/admin/sections/AiSection";

export const Route = createFileRoute("/admin/ai")({
  component: AiSection,
});
