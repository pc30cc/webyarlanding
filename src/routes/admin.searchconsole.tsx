import { createFileRoute } from "@tanstack/react-router";
import SearchConsoleSection from "@/components/admin/sections/SearchConsoleSection";

export const Route = createFileRoute("/admin/searchconsole")({
  component: SearchConsoleSection,
});
