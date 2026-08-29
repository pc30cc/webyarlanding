import { createFileRoute } from "@tanstack/react-router";
import ChatWidgetSection from "@/components/admin/sections/ChatWidgetSection";

export const Route = createFileRoute("/admin/chat")({
  component: ChatWidgetSection,
});
