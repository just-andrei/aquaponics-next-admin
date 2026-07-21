"use client";

import { useEffect, useState } from "react";
import { EnvironmentalAlertsSection } from "@/components/alerts/EnvironmentalAlertsSection";
import {
  formatMonitoringDate,
  monitoringStatusTone,
  WeeklyLogsList,
} from "@/components/monitoring/WeeklyLogsList";
import { db } from "@/lib/firebase";
import { loadWeeklyMonitoringLogs } from "@/lib/monitoring";
import type { WeeklyMonitoringLog } from "@/types/monitoring";
import type { AssignedSystem } from "@/types/system";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type MonitoringHistorySectionProps = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  system: AssignedSystem;
};

const metricDefinitions = [
  { key: "ph", label: "pH", suffix: "" },
  { key: "waterTemperature", label: "Water temperature", suffix: " °C" },
  { key: "dissolvedOxygen", label: "Dissolved oxygen", suffix: " mg/L" },
  { key: "turbidity", label: "Turbidity", suffix: "" },
  { key: "humidity", label: "Humidity", suffix: "%" },
] as const;

function readableError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Weekly monitoring logs could not be loaded. Please try again.";
}

export function MonitoringHistorySection({
  growerUid,
  growerName,
  growerEmail,
  system,
}: MonitoringHistorySectionProps) {
  const [logs, setLogs] = useState<WeeklyMonitoringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let isCancelled = false;

    async function load() {
      await Promise.resolve();
      if (isCancelled) return;

      if (!firestore) {
        setError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextLogs = await loadWeeklyMonitoringLogs(
          firestore,
          growerUid,
          system.sourceCollection,
          system.id,
        );
        if (isCancelled) return;
        setLogs(nextLogs);
        setError(null);
        setIsLoading(false);
      } catch (loadError) {
        if (isCancelled) return;
        setError(readableError(loadError));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [growerUid, retryKey, system.id, system.sourceCollection]);

  function retry() {
    setLogs([]);
    setError(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  const summary = system.monitoringSummary;

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">Monitoring History</h4>
          <p className="mt-1 text-xs text-slate-500">
            Read-only stored sensor review. Display status does not create alerts.
          </p>
        </div>
        <StatusBadge tone={monitoringStatusTone(summary.status)}>{summary.status}</StatusBadge>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-white p-4">
        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
          <span>Latest summary: {summary.sourceLabel}</span>
          <span>{formatMonitoringDate(summary.measuredAt)}</span>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricDefinitions.map((metric) => {
            const value = summary.metrics[metric.key];
            return (
              <div className="rounded-xl border border-cyan-100 bg-white px-3 py-3 shadow-sm" key={metric.key}>
                <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
                <dd className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                  {value === null ? "No data" : `${value.toFixed(1)}${metric.suffix}`}
                </dd>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{value === null ? "Not stored" : summary.status}</p>
              </div>
            );
          })}
        </dl>
      </div>

      <EnvironmentalAlertsSection
        growerEmail={growerEmail}
        growerName={growerName}
        growerUid={growerUid}
        system={system}
      />

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <h5 className="text-sm font-semibold text-slate-900">Recent weekly summaries</h5>
          <p className="break-all text-xs text-slate-500">
            {system.sourceCollection}/&#123;uid&#125;/systems/{system.id}/weekly_logs
          </p>
        </div>

        {isLoading ? (
          <StatePanel compact title="Loading recent weekly logs..." tone="loading" />
        ) : error ? (
          <StatePanel
            actionLabel="Retry weekly logs"
            compact
            description={error}
            onAction={retry}
            title="Weekly summaries could not be loaded"
            tone="error"
          />
        ) : (
          <WeeklyLogsList logs={logs} />
        )}
      </div>
    </section>
  );
}
