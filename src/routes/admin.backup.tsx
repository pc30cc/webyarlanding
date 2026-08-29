import { createFileRoute } from "@tanstack/react-router";
import BackupSection from "@/components/admin/sections/BackupSection";

export const Route = createFileRoute("/admin/backup")({
  component: BackupSection,
});
