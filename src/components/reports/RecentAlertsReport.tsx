import type { ReportAlert } from "@/types/report";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentAlertsReportProps = { alerts: ReportAlert[] };

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

export function RecentAlertsReport({ alerts }: RecentAlertsReportProps) {
  const recentAlerts = alerts.slice(0, 10);
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Recent Alerts</h2>
          <p className="mt-1 text-xs text-slate-500">environmental_alerts</p>
        </div>
        <p className="text-xs text-slate-500">
          Showing {recentAlerts.length} of {alerts.length} filtered records
        </p>
      </div>

      {recentAlerts.length === 0 ? (
        <div className="mt-4"><StatePanel compact title="No alerts match the current filters." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {recentAlerts.map((alert) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4" key={alert.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {alert.parameter}: {alert.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {alert.growerName} · {alert.systemName} · {formatDate(alert.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge tone={alert.severity === "critical" ? "danger" : "warning"}>{alert.severity}</StatusBadge>
                  <StatusBadge tone={alert.status === "resolved" ? "success" : alert.status === "acknowledged" ? "info" : "warning"}>{alert.status}</StatusBadge>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
