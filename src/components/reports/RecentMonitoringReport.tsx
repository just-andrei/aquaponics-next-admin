import type { MonitoringMetrics } from "@/types/monitoring";
import type { ReportMonitoringRecord } from "@/types/report";
import { monitoringStatusTone } from "@/components/monitoring/WeeklyLogsList";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentMonitoringReportProps = { records: ReportMonitoringRecord[] };

function formatDate(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function metricValues(metrics: MonitoringMetrics) {
  return [
    ["pH", metrics.ph, ""],
    ["Water temp", metrics.waterTemperature, " °C"],
    ["Dissolved oxygen", metrics.dissolvedOxygen, " mg/L"],
    ["Turbidity", metrics.turbidity, ""],
    ["Humidity", metrics.humidity, "%"],
  ].filter((metric) => metric[1] !== null) as Array<[string, number, string]>;
}

export function RecentMonitoringReport({ records }: RecentMonitoringReportProps) {
  const recentRecords = records.slice(0, 10);
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Recent Weekly Monitoring</h2>
          <p className="mt-1 text-xs text-slate-500">Nested weekly_logs</p>
        </div>
        <p className="text-xs text-slate-500">
          Showing {recentRecords.length} of {records.length} filtered records
        </p>
      </div>

      {recentRecords.length === 0 ? (
        <div className="mt-4"><StatePanel compact title="No weekly monitoring records match the current filters." /></div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentRecords.map((record) => {
            const metrics = metricValues(record.metrics);
            return (
              <article className="rounded-xl border border-cyan-100 bg-cyan-50/35 p-4" key={`${record.growerUid}-${record.systemId}-${record.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{record.systemName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.growerName} · {formatDate(record.occurredAt)}
                    </p>
                  </div>
                  <StatusBadge tone={monitoringStatusTone(record.status)}>{record.status}</StatusBadge>
                </div>
                {metrics.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No sensor values stored.</p>
                ) : (
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {metrics.map(([label, value, suffix]) => (
                      <div className="rounded-lg bg-white px-3 py-2 shadow-sm" key={label}>
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-0.5 font-medium text-slate-800">{value}{suffix}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {record.notes ? <p className="mt-3 text-xs leading-5 text-slate-600">{record.notes}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
