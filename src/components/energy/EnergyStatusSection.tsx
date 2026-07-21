"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { loadEnergyStatus } from "@/lib/energyStatus";
import type { EnergyDisplayStatus, EnergyStatusSummary } from "@/types/energy";
import type { AssignedSystem } from "@/types/system";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

type EnergyStatusSectionProps = {
  growerUid: string;
  system: AssignedSystem;
};

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

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

function readableValue(value: string) {
  return value.replaceAll("_", " ");
}

function statusTone(status: EnergyDisplayStatus): StatusTone {
  switch (status) {
    case "Critical":
      return "danger";
    case "Warning":
      return "warning";
    case "Normal":
      return "success";
    default:
      return "neutral";
  }
}

export function EnergyStatusSection({
  growerUid,
  system,
}: EnergyStatusSectionProps) {
  const [summary, setSummary] = useState<EnergyStatusSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let cancelled = false;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;

      if (!firestore) {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextSummary = await loadEnergyStatus(
          firestore,
          growerUid,
          system.sourceCollection,
          system.id,
        );
        if (cancelled) return;
        setSummary(nextSummary);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;
        setLoadError(readableError(error, "Energy / power status could not be loaded."));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [growerUid, refreshKey, system.id, system.sourceCollection]);

  function retry() {
    setSummary(null);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  const fields = summary
    ? [
        ["Current power source", readableValue(summary.currentPowerSource)],
        [
          "Battery percentage",
          summary.batteryPercentage === null ? "Not available" : `${summary.batteryPercentage}%`,
        ],
        [
          "Battery voltage",
          summary.batteryVoltage === null ? "Not available" : `${summary.batteryVoltage} V`,
        ],
        [
          "Solar voltage",
          summary.solarVoltage === null ? "Not available" : `${summary.solarVoltage} V`,
        ],
        ["Solar charging", summary.solarChargingStatus || "Not available"],
        ["Load status", summary.loadStatus || "Not available"],
        ["Power status", summary.powerStatus || "Not available"],
        ["Backup availability", summary.backupAvailability || "Not available"],
      ]
    : [];

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            Energy / Power Status
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Read-only stored hybrid energy, battery, and solar backup information.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">Status display only</StatusBadge>
          {summary ? (
            <StatusBadge tone={statusTone(summary.status)}>{summary.status}</StatusBadge>
          ) : null}
        </div>
      </div>

      <p className="mt-2 break-all text-xs text-slate-500">
        {system.sourceCollection}/&#123;uid&#125;/systems/{system.id}
      </p>

      <div className="mt-3">
        {isLoading ? (
          <StatePanel compact title="Loading energy / power status..." tone="loading" />
        ) : loadError ? (
          <StatePanel
            actionLabel="Retry energy status"
            compact
            description={loadError}
            onAction={retry}
            title="Energy status could not be loaded"
            tone="error"
          />
        ) : !summary?.hasData ? (
          <StatePanel
            compact
            description="Energy, battery, or solar values have not been stored on this system document yet."
            title="No stored energy data"
          />
        ) : (
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 to-white p-4">
            {summary.batteryPercentage !== null ? (
              <div className="mb-4 rounded-xl border border-white bg-white/90 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-600">Battery level</span>
                  <span className="font-bold text-slate-950">{summary.batteryPercentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${summary.status === "Critical" ? "bg-red-500" : summary.status === "Warning" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, summary.batteryPercentage))}%` }}
                  />
                </div>
              </div>
            ) : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {fields.map(([label, value]) => (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm" key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words capitalize text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <p>Last updated: {formatDate(summary.lastUpdated)}</p>
              <p className="mt-1">Stored source: {summary.sourceLabel}</p>
              <p className="mt-1">
                Display status uses battery thresholds only: Critical at 20% or below,
                Warning at 40% or below.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
