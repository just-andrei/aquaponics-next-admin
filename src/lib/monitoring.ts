import {
  collection,
  getDocs,
  Timestamp,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { systemSubcollections } from "@/types/firestore";
import type { GrowerCollectionName } from "@/types/grower";
import type {
  MonitoringMetrics,
  MonitoringStatus,
  MonitoringSummary,
  WeeklyMonitoringLog,
} from "@/types/monitoring";

const emptyMetrics: MonitoringMetrics = {
  ph: null,
  waterTemperature: null,
  dissolvedOxygen: null,
  turbidity: null,
  humidity: null,
};

// Display-only starter thresholds. They never create alerts or monitoring records.
export const monitoringThresholds = {
  ph: { normalMin: 6.5, normalMax: 8, warningMin: 6, warningMax: 8.5 },
  waterTemperature: {
    normalMin: 24,
    normalMax: 30,
    warningMin: 20,
    warningMax: 32,
  },
  dissolvedOxygen: { normalMin: 5, warningMin: 3.5 },
  turbidity: { normalMax: 15, warningMax: 30 },
  humidity: {
    normalMin: 45,
    normalMax: 80,
    warningMin: 35,
    warningMax: 90,
  },
} as const;

function readMap(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value));
}

function readString(data: DocumentData, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readNumber(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
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

function readDateFromMap(data: Record<string, unknown>) {
  const keys = [
    "timestamp",
    "measuredAt",
    "measured_at",
    "updatedAt",
    "updated_at",
    "createdAt",
    "created_at",
    "weekStart",
    "week_start",
  ];
  for (const key of keys) {
    const date = readDate(data[key]);
    if (date) return date;
  }
  return null;
}

function mapMetrics(data: Record<string, unknown>): MonitoringMetrics {
  return {
    ph: readNumber(data, ["ph", "pH", "avg_ph", "average_ph", "averagePh"]),
    waterTemperature: readNumber(data, [
      "temp",
      "temperature",
      "water_temp",
      "waterTemperature",
      "water_temperature",
      "avg_temp",
      "averageTemperature",
    ]),
    dissolvedOxygen: readNumber(data, [
      "do",
      "dissolved_oxygen",
      "dissolvedOxygen",
      "avg_do",
      "averageDissolvedOxygen",
    ]),
    turbidity: readNumber(data, ["turbidity", "avg_turbidity", "averageTurbidity"]),
    humidity: readNumber(data, ["humidity", "avg_humidity", "averageHumidity"]),
  };
}

function hasMetrics(metrics: MonitoringMetrics) {
  return Object.values(metrics).some((value) => value !== null);
}

function metricMap(value: unknown) {
  const root = readMap(value);
  const nestedKeys = ["metrics", "readings", "sensors", "averages", "data"];
  for (const key of nestedKeys) {
    const nested = readMap(root[key]);
    if (hasMetrics(mapMetrics(nested))) return nested;
  }
  return root;
}

function preferredSensorAverages(value: unknown) {
  const sensorAverages = readMap(value);
  for (const key of ["daily", "weekly", "monthly"]) {
    const summary = metricMap(sensorAverages[key]);
    if (hasMetrics(mapMetrics(summary))) return summary;
  }
  return metricMap(sensorAverages);
}

function assessRange(
  value: number | null,
  threshold: {
    normalMin: number;
    normalMax: number;
    warningMin: number;
    warningMax: number;
  },
) {
  if (value === null) return "none";
  if (value < threshold.warningMin || value > threshold.warningMax) return "critical";
  if (value < threshold.normalMin || value > threshold.normalMax) return "warning";
  return "normal";
}

export function getMonitoringStatus(metrics: MonitoringMetrics): MonitoringStatus {
  const results = [
    assessRange(metrics.ph, monitoringThresholds.ph),
    assessRange(metrics.waterTemperature, monitoringThresholds.waterTemperature),
    metrics.dissolvedOxygen === null
      ? "none"
      : metrics.dissolvedOxygen < monitoringThresholds.dissolvedOxygen.warningMin
        ? "critical"
        : metrics.dissolvedOxygen < monitoringThresholds.dissolvedOxygen.normalMin
          ? "warning"
          : "normal",
    metrics.turbidity === null
      ? "none"
      : metrics.turbidity > monitoringThresholds.turbidity.warningMax
        ? "critical"
        : metrics.turbidity > monitoringThresholds.turbidity.normalMax
          ? "warning"
          : "normal",
    assessRange(metrics.humidity, monitoringThresholds.humidity),
  ];

  if (results.every((result) => result === "none")) return "No data";
  if (results.includes("critical")) return "Critical";
  if (results.includes("warning")) return "Warning";
  return "Normal";
}

function storedStatus(data: DocumentData): MonitoringStatus {
  const value = readString(data, "health_status", "healthStatus", "status").toLowerCase();
  if (value.includes("critical") || value.includes("unhealthy")) return "Critical";
  if (value.includes("warning") || value.includes("caution")) return "Warning";
  if (value.includes("normal") || value.includes("healthy") || value.includes("good")) {
    return "Normal";
  }
  return "No data";
}

export function mapMonitoringSummary(data: DocumentData): MonitoringSummary {
  const candidates: Array<{ label: string; map: Record<string, unknown> }> = [
    {
      label: "Latest reading",
      map: metricMap(data.latest_reading ?? data.latestReading),
    },
    {
      label: "Latest monitoring",
      map: metricMap(data.latestMonitoring ?? data.latest_monitoring),
    },
    {
      label: "Monitoring summary",
      map: metricMap(data.monitoring_summary ?? data.monitoringSummary),
    },
    {
      label: "Sensor averages",
      map: preferredSensorAverages(data.sensor_averages ?? data.sensorAverages),
    },
    { label: "System document", map: metricMap(data) },
  ];

  for (const candidate of candidates) {
    const metrics = mapMetrics(candidate.map);
    if (hasMetrics(metrics)) {
      return {
        metrics,
        measuredAt: readDateFromMap(candidate.map) ?? readDateFromMap(data),
        status: getMonitoringStatus(metrics),
        sourceLabel: candidate.label,
      };
    }
  }

  return {
    metrics: { ...emptyMetrics },
    measuredAt: readDateFromMap(data),
    status: "No data",
    sourceLabel: "No stored summary",
  };
}

function mapWeeklyLog(
  document: QueryDocumentSnapshot<DocumentData>,
): WeeklyMonitoringLog {
  const data = document.data();
  const summary = mapMonitoringSummary(data);
  return {
    id: document.id,
    metrics: summary.metrics,
    measuredAt: summary.measuredAt,
    status: summary.status === "No data" ? storedStatus(data) : summary.status,
    notes: readString(data, "notes", "note", "remarks", "description"),
  };
}

export async function loadWeeklyMonitoringLogs(
  firestore: Firestore,
  growerUid: string,
  sourceCollection: GrowerCollectionName,
  systemId: string,
) {
  const snapshot = await getDocs(
    collection(
      firestore,
      sourceCollection,
      growerUid,
      systemSubcollections.systems,
      systemId,
      systemSubcollections.weeklyLogs,
    ),
  );

  return snapshot.docs
    .map(mapWeeklyLog)
    .sort((a, b) => {
      const timeDifference =
        (b.measuredAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
        (a.measuredAt?.getTime() ?? Number.NEGATIVE_INFINITY);
      return timeDifference || b.id.localeCompare(a.id);
    })
    .slice(0, 5);
}
