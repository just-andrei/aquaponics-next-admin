import type { DashboardSummary } from "@/types/dashboard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { StatusTone } from "@/components/ui/StatusBadge";

type DashboardSummaryCardsProps = {
  summary: DashboardSummary;
};

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const cards = [
    ["Total growers", summary.totalGrowers, "info"],
    ["Active growers", summary.activeGrowers, "success"],
    ["Inactive growers", summary.inactiveGrowers, "neutral"],
    ["Assigned systems", summary.totalAssignedSystems, "water"],
    ["Unresolved alerts", summary.unresolvedEnvironmentalAlerts, "danger"],
    ["Resolved alerts", summary.resolvedEnvironmentalAlerts, "success"],
    ["New contact messages", summary.newContactMessages, "info"],
    ["New inquiry messages", summary.newInquiryMessages, "violet"],
  ] satisfies Array<[string, number, StatusTone]>;

  return (
    <section aria-labelledby="dashboard-summary-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-950" id="dashboard-summary-heading">
            Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Current totals from the stored administration data.
          </p>
        </div>
        <p className="text-xs text-slate-500">Read-only Firebase snapshot</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, tone]) => (
          <SummaryCard key={label} label={label} tone={tone} value={value} />
        ))}
      </div>
    </section>
  );
}
