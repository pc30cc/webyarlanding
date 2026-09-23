import { createFileRoute } from "@tanstack/react-router";
import SearchConsoleSection from "@/components/admin/sections/SearchConsoleSection";
import SeoProposalsSection from "@/components/admin/sections/SeoProposalsSection";

function SearchConsolePage() {
  return (
    <div className="space-y-6">
      <SearchConsoleSection />
      <SeoProposalsSection />
    </div>
  );
}

export const Route = createFileRoute("/admin/searchconsole")({
  component: SearchConsolePage,
});
