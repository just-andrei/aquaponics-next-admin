import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { monitoringThresholds } from "@/lib/monitoring";
import { firestoreCollections } from "@/types/firestore";
import type {
  AlertPreview,
  AlertSeverity,
  AlertStatus,
  AlertSystemContext,
  EnvironmentalAlert,
  LogAlertsResult,
} from "@/types/alert";
import type { MonitoringMetrics } from "@/types/monitoring";

const allowedStatuses: AlertStatus[] = ["new", "acknowledged", "resolved"];

function dedupeKey(
  growerUid: string,
  systemId: string,
  parameter: string,
  severity: AlertSeverity,
) {
  return `${growerUid}_${systemId}_${parameter.toLowerCase()}_${severity.toLowerCase()}`;
}

export function buildAlertPreviews(
  growerUid: string,
  systemId: string,
  metrics: MonitoringMetrics,
) {
  const previews: AlertPreview[] = [];

  function addRangeAlert(
    parameter: string,
    value: number | null,
    threshold: {
      normalMin: number;
      normalMax: number;
      warningMin: number;
      warningMax: number;
    },
    suffix: string,
  ) {
    if (value === null) return;
    let severity: AlertSeverity | null = null;
    if (value < threshold.warningMin || value > threshold.warningMax) {
      severity = "critical";
    } else if (value < threshold.normalMin || value > threshold.normalMax) {
      severity = "warning";
    }
    if (!severity) return;

    previews.push({
      parameter,
      formattedValue: `${value.toFixed(1)}${suffix}`,
      rawValue: value,
      severity,
      message: `${parameter} is outside the safe range of ${threshold.normalMin} to ${threshold.normalMax}${suffix}.`,
      dedupeKey: dedupeKey(growerUid, systemId, parameter, severity),
    });
  }

  function addMinimumAlert(
    parameter: string,
    value: number | null,
    threshold: { normalMin: number; warningMin: number },
    suffix: string,
  ) {
    if (value === null) return;
    const severity: AlertSeverity | null =
      value < threshold.warningMin
        ? "critical"
        : value < threshold.normalMin
          ? "warning"
          : null;
    if (!severity) return;

    previews.push({
      parameter,
      formattedValue: `${value.toFixed(1)}${suffix}`,
      rawValue: value,
      severity,
      message: `${parameter} dropped below the minimum safe level of ${threshold.normalMin}${suffix}.`,
      dedupeKey: dedupeKey(growerUid, systemId, parameter, severity),
    });
  }

  function addMaximumAlert(
    parameter: string,
    value: number | null,
    threshold: { normalMax: number; warningMax: number },
    suffix: string,
  ) {
    if (value === null) return;
    const severity: AlertSeverity | null =
      value > threshold.warningMax
        ? "critical"
        : value > threshold.normalMax
          ? "warning"
          : null;
    if (!severity) return;

    previews.push({
      parameter,
      formattedValue: `${value.toFixed(1)}${suffix}`,
      rawValue: value,
      severity,
      message: `${parameter} exceeded the maximum safe level of ${threshold.normalMax}${suffix}.`,
      dedupeKey: dedupeKey(growerUid, systemId, parameter, severity),
    });
  }

  addRangeAlert("pH", metrics.ph, monitoringThresholds.ph, "");
  addRangeAlert(
    "water_temperature",
    metrics.waterTemperature,
    monitoringThresholds.waterTemperature,
    " C",
  );
  addMinimumAlert(
    "dissolved_oxygen",
    metrics.dissolvedOxygen,
    monitoringThresholds.dissolvedOxygen,
    " mg/L",
  );
  addMaximumAlert(
    "turbidity",
    metrics.turbidity,
    monitoringThresholds.turbidity,
    "",
  );
  addRangeAlert("humidity", metrics.humidity, monitoringThresholds.humidity, " %");

  return previews;
}

function normalizeStatus(value: unknown): AlertStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "acknowledged" || normalized === "resolved"
    ? normalized
    : "new";
}

function normalizeSeverity(value: unknown): AlertSeverity {
  return typeof value === "string" && value.trim().toLowerCase() === "critical"
    ? "critical"
    : "warning";
}

function readString(data: DocumentData, key: string, fallback = "") {
  const value = data[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000);
  }
  return null;
}

function mapEnvironmentalAlert(
  document: QueryDocumentSnapshot<DocumentData>,
): EnvironmentalAlert {
  const data = document.data();
  return {
    id: document.id,
    parameter: readString(data, "parameter", "Unknown parameter"),
    value: readString(data, "value", "No value"),
    severity: normalizeSeverity(data.severity),
    message: readString(data, "message", "No message"),
    status: normalizeStatus(data.status),
    source: readString(data, "source"),
    dedupeKey: readString(data, "dedupeKey", document.id),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
    acknowledgedAt: readDate(data.acknowledgedAt),
    resolvedAt: readDate(data.resolvedAt),
  };
}

export async function loadEnvironmentalAlerts(
  firestore: Firestore,
  growerUid: string,
  systemId: string,
) {
  const snapshot = await getDocs(
    query(
      collection(firestore, firestoreCollections.environmentalAlerts),
      where("growerUid", "==", growerUid),
      where("systemId", "==", systemId),
    ),
  );

  return snapshot.docs
    .map(mapEnvironmentalAlert)
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
        (a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY),
    );
}

export async function logCurrentAlerts(
  firestore: Firestore,
  context: AlertSystemContext,
  previews: AlertPreview[],
): Promise<LogAlertsResult> {
  if (previews.length === 0) return { saved: 0, skipped: 0 };

  return runTransaction(firestore, async (transaction) => {
    const references = previews.map((preview) =>
      doc(firestore, firestoreCollections.environmentalAlerts, preview.dedupeKey),
    );
    const existingDocuments = await Promise.all(
      references.map((reference) => transaction.get(reference)),
    );
    let saved = 0;
    let skipped = 0;

    previews.forEach((preview, index) => {
      const existingDocument = existingDocuments[index];
      if (
        existingDocument.exists() &&
        normalizeStatus(existingDocument.data().status) !== "resolved"
      ) {
        skipped += 1;
        return;
      }

      transaction.set(references[index], {
        growerUid: context.growerUid,
        growerName: context.growerName,
        growerEmail: context.growerEmail,
        systemId: context.systemId,
        systemName: context.systemName,
        hardwareUid: context.hardwareUid,
        parameter: preview.parameter,
        value: preview.rawValue,
        severity: preview.severity,
        message: preview.message,
        status: "new",
        source: "web-monitoring-manual",
        dedupeKey: preview.dedupeKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        acknowledgedAt: null,
        resolvedAt: null,
      });
      saved += 1;
    });

    return { saved, skipped };
  });
}

export async function updateEnvironmentalAlertStatus(
  firestore: Firestore,
  alertId: string,
  status: AlertStatus,
) {
  if (!allowedStatuses.includes(status)) {
    throw new Error("Unsupported environmental alert status.");
  }

  const update: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === "new") {
    update.acknowledgedAt = null;
    update.resolvedAt = null;
  } else if (status === "acknowledged") {
    update.acknowledgedAt = serverTimestamp();
    update.resolvedAt = null;
  } else {
    update.resolvedAt = serverTimestamp();
  }

  await updateDoc(
    doc(firestore, firestoreCollections.environmentalAlerts, alertId),
    update,
  );
}
