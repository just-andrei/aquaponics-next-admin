import type { ReportSummary } from "@/types/report";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { StatusTone } from "@/components/ui/StatusBadge";

type ReportSummaryCardsProps = { summary: ReportSummary };

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const cards = [
    ["Total growers", summary.totalGrowers, "info"],
    ["Active growers", summary.activeGrowers, "success"],
    ["Inactive growers", summary.inactiveGrowers, "neutral"],
    ["Assigned systems", summary.totalAssignedSystems, "water"],
    ["Systems without monitoring", summary.systemsWithNoMonitoringData, "neutral"],
    ["Systems with energy data", summary.systemsWithEnergyData, "water"],
    ["Unresolved alerts", summary.activeUnresolvedAlerts, "danger"],
    ["Resolved alerts", summary.resolvedAlerts, "success"],
    ["Harvest records", summary.totalHarvestRecords, "info"],
    ["Plant status records", summary.totalPlantStatusRecords, "success"],
    ["Aquaculture status records", summary.totalAquacultureStatusRecords, "water"],
  ] satisfies Array<[string, number, StatusTone]>;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Report Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Totals across the complete loaded report dataset.
          </p>
        </div>
        <p className="text-xs text-slate-500">Read-only Firebase snapshot</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map(([label, value, tone]) => (
          <SummaryCard key={label} label={label} tone={tone} value={value} />
        ))}
      </div>
    </section>
  );
}
