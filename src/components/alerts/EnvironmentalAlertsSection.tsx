"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  buildAlertPreviews,
  loadEnvironmentalAlerts,
  logCurrentAlerts,
  updateEnvironmentalAlertStatus,
} from "@/lib/environmentalAlerts";
import type {
  AlertSeverity,
  AlertStatus,
  EnvironmentalAlert,
} from "@/types/alert";
import type { AssignedSystem } from "@/types/system";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

type EnvironmentalAlertsSectionProps = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  system: AssignedSystem;
};

const alertStatuses: AlertStatus[] = ["new", "acknowledged", "resolved"];

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

function severityTone(severity: AlertSeverity): StatusTone {
  return severity === "critical" ? "danger" : "warning";
}

function statusTone(status: AlertStatus): StatusTone {
  switch (status) {
    case "resolved":
      return "success";
    case "acknowledged":
      return "info";
    default:
      return "warning";
  }
}

function formatDate(value: Date | null) {
  if (!value) return "Pending server timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function EnvironmentalAlertsSection({
  growerUid,
  growerName,
  growerEmail,
  system,
}: EnvironmentalAlertsSectionProps) {
  const previews = buildAlertPreviews(
    growerUid,
    system.id,
    system.monitoringSummary.metrics,
  );
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let isCancelled = false;

    async function load() {
      await Promise.resolve();
      if (isCancelled) return;

      if (!firestore) {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextAlerts = await loadEnvironmentalAlerts(
          firestore,
          growerUid,
          system.id,
        );
        if (isCancelled) return;
        setAlerts(nextAlerts);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        if (isCancelled) return;
        setLoadError(
          readableError(error, "Saved environmental alerts could not be loaded."),
        );
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [growerUid, refreshKey, system.id]);

  function retry() {
    setAlerts([]);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }

  async function handleLogCurrentAlerts() {
    const firestore = db;
    if (!firestore || isLogging || previews.length === 0) return;

    setIsLogging(true);
    setOperationMessage(null);
    try {
      const result = await logCurrentAlerts(
        firestore,
        {
          growerUid,
          growerName,
          growerEmail,
          systemId: system.id,
          systemName: system.systemName,
          hardwareUid: system.hardwareUid,
        },
        previews,
      );
      setOperationMessage({
        tone: "success",
        text: `Saved ${result.saved} alert(s). Skipped ${result.skipped} unresolved duplicate(s).`,
      });
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: readableError(error, "Current alerts could not be logged."),
      });
    } finally {
      setIsLogging(false);
    }
  }

  async function handleStatusUpdate(alert: EnvironmentalAlert, status: AlertStatus) {
    const firestore = db;
    if (!firestore || updatingAlertId || status === alert.status) return;

    setUpdatingAlertId(alert.id);
    setOperationMessage(null);
    try {
      await updateEnvironmentalAlertStatus(firestore, alert.id, status);
      setOperationMessage({
        tone: "success",
        text: `Alert status updated to ${status}.`,
      });
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: readableError(error, "Alert status could not be updated."),
      });
    } finally {
      setUpdatingAlertId(null);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/45 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-slate-950">Environmental Alerts</h5>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Previews are read only. Firestore writes occur only after a manual button or
            status selection.
          </p>
        </div>
        {previews.length > 0 ? (
          <button
            className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLogging}
            onClick={handleLogCurrentAlerts}
            type="button"
          >
            {isLogging ? "Logging..." : "Log Current Alerts"}
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-amber-200/80 bg-white p-4">
        <h6 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
          Alert Preview
        </h6>
        {previews.length === 0 ? (
          <div className="mt-3">
            <StatePanel compact title="No current warning/critical alerts." />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {previews.map((preview) => (
              <div
                className={`rounded-xl border p-3.5 ${preview.severity === "critical" ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/60"}`}
                key={preview.dedupeKey}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {preview.parameter}: {preview.formattedValue}
                  </p>
                  <StatusBadge tone={severityTone(preview.severity)}>{preview.severity}</StatusBadge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{preview.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {operationMessage ? (
        <p
          aria-live="polite"
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            operationMessage.tone === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {operationMessage.text}
        </p>
      ) : null}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h6 className="text-sm font-semibold text-slate-900">Saved Alerts</h6>
          <p className="text-xs text-slate-500">environmental_alerts</p>
        </div>

        {isLoading ? (
          <div className="mt-3"><StatePanel compact title="Loading saved alerts..." tone="loading" /></div>
        ) : loadError ? (
          <div className="mt-3">
            <StatePanel actionLabel="Retry saved alerts" compact description={loadError} onAction={retry} title="Saved alerts could not be loaded" tone="error" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-3"><StatePanel compact title="No saved alerts for this system yet." /></div>
        ) : (
          <div className="mt-2 space-y-3">
            {alerts.map((alert) => (
              <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4" key={alert.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={severityTone(alert.severity)}>{alert.severity}</StatusBadge>
                      <StatusBadge tone={statusTone(alert.status)}>{alert.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {alert.parameter}: {alert.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {alert.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Created: {formatDate(alert.createdAt)}
                    </p>
                  </div>

                  <label className="text-xs font-medium text-slate-600">
                    Status
                    <select
                      className="mt-1.5 block rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                      disabled={updatingAlertId !== null}
                      onChange={(event) =>
                        void handleStatusUpdate(
                          alert,
                          event.target.value as AlertStatus,
                        )
                      }
                      value={alert.status}
                    >
                      {alertStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
