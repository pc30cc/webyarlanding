import { createFileRoute } from "@tanstack/react-router";
import LoginLogsSection from "@/components/admin/sections/LoginLogsSection";

export const Route = createFileRoute("/admin/logins")({
  component: LoginLogsSection,
});
