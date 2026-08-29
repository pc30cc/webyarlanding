import { createFileRoute } from "@tanstack/react-router";
import TagsSection from "@/components/admin/sections/TagsSection";

export const Route = createFileRoute("/admin/tags")({
  component: TagsSection,
});
