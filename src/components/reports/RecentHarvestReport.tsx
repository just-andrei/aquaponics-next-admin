import type { ReportHarvestRecord } from "@/types/report";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentHarvestReportProps = { records: ReportHarvestRecord[] };

function formatDate(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function RecentHarvestReport({ records }: RecentHarvestReportProps) {
  const recentRecords = records.slice(0, 10);
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Recent Harvest Records</h2>
          <p className="mt-1 text-xs text-slate-500">Nested harvest_records</p>
        </div>
        <p className="text-xs text-slate-500">
          Showing {recentRecords.length} of {records.length} filtered records
        </p>
      </div>

      {recentRecords.length === 0 ? (
        <div className="mt-4"><StatePanel compact title="No harvest records match the current filters." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {recentRecords.map((record) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4" key={`${record.growerUid}-${record.systemId}-${record.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{record.itemName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {record.growerName} · {record.systemName} · {formatDate(record.occurredAt)}
                  </p>
                </div>
                <StatusBadge tone="info">{record.recordType.replaceAll("_", " ")}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {record.quantity === null ? "Quantity not recorded" : record.quantity}{" "}
                {record.unit} · Condition: {record.condition}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
