import { createFileRoute } from "@tanstack/react-router";
import CallCenterWidgetSection from "@/components/admin/sections/CallCenterWidgetSection";

export const Route = createFileRoute("/admin/callcenter")({
  component: CallCenterWidgetSection,
});
