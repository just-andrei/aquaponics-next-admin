import type { DashboardAlert } from "@/types/dashboard";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentAlertsProps = {
  alerts: DashboardAlert[];
};

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

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Recent Environmental Alerts
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Latest saved records from environmental_alerts
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="mt-4">
          <StatePanel compact title="No environmental alerts have been saved." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300" key={alert.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {alert.parameter}: {alert.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {alert.growerName} · {alert.systemName} · {formatDate(alert.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge tone={alert.severity === "critical" ? "danger" : "warning"}>{alert.severity}</StatusBadge>
                  <StatusBadge tone={alert.status === "resolved" ? "success" : "neutral"}>{alert.status}</StatusBadge>
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
