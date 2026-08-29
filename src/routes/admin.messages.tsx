import { createFileRoute } from "@tanstack/react-router";
import MessagesSection from "@/components/admin/sections/MessagesSection";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesSection,
});
