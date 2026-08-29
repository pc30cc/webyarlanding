import { createFileRoute } from "@tanstack/react-router";
import MediaSection from "@/components/admin/sections/MediaSection";

export const Route = createFileRoute("/admin/media")({
  component: MediaSection,
});
