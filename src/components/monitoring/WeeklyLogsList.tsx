import type {
  MonitoringMetrics,
  MonitoringStatus,
  WeeklyMonitoringLog,
} from "@/types/monitoring";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

type WeeklyLogsListProps = {
  logs: WeeklyMonitoringLog[];
};

const metricDefinitions = [
  { key: "ph", label: "pH", suffix: "" },
  { key: "waterTemperature", label: "Water temperature", suffix: " °C" },
  { key: "dissolvedOxygen", label: "Dissolved oxygen", suffix: " mg/L" },
  { key: "turbidity", label: "Turbidity", suffix: "" },
  { key: "humidity", label: "Humidity", suffix: "%" },
] as const;

export function monitoringStatusTone(status: MonitoringStatus): StatusTone {
  switch (status) {
    case "Normal":
      return "success";
    case "Warning":
      return "warning";
    case "Critical":
      return "danger";
    default:
      return "neutral";
  }
}

export function formatMonitoringDate(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function availableMonitoringMetrics(metrics: MonitoringMetrics) {
  return metricDefinitions.flatMap((metric) => {
    const value = metrics[metric.key];
    return value === null ? [] : [{ ...metric, value }];
  });
}

export function WeeklyLogsList({ logs }: WeeklyLogsListProps) {
  if (logs.length === 0) {
    return <StatePanel compact title="No weekly logs are stored for this system yet." />;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const metrics = availableMonitoringMetrics(log.metrics);

        return (
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={log.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-600">
                {formatMonitoringDate(log.measuredAt)}
              </p>
              <StatusBadge tone={monitoringStatusTone(log.status)}>{log.status}</StatusBadge>
            </div>

            {log.notes ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">{log.notes}</p>
            ) : null}

            {metrics.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sensor values: No data</p>
            ) : (
              <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => (
                  <div className="rounded-lg bg-cyan-50/60 px-3 py-2 text-xs" key={metric.key}>
                    <dt className="text-slate-500">{metric.label}</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">
                      {metric.value.toFixed(1)}{metric.suffix}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        );
      })}
    </div>
  );
}
