import {
  doc,
  getDoc,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { systemSubcollections } from "@/types/firestore";
import type { GrowerCollectionName } from "@/types/grower";
import type {
  EnergyDisplayStatus,
  EnergyStatusSummary,
  PowerSource,
} from "@/types/energy";

type EnergySource = {
  label: string;
  data: Record<string, unknown>;
};

function readMap(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value));
}

function firstValue(sources: EnergySource[], keys: string[]) {
  for (const source of sources) {
    for (const key of keys) {
      const value = source.data[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return null;
}

function readNumber(sources: EnergySource[], keys: string[]) {
  const value = firstValue(sources, keys);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace("%", "").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function displayText(value: unknown, trueLabel: string, falseLabel: string) {
  if (typeof value === "boolean") return value ? trueLabel : falseLabel;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
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

function readDateFromSources(sources: EnergySource[]) {
  const keys = [
    "timestamp",
    "measuredAt",
    "measured_at",
    "updatedAt",
    "updated_at",
    "createdAt",
    "created_at",
  ];
  for (const source of sources) {
    for (const key of keys) {
      const date = readDate(source.data[key]);
      if (date) return date;
    }
  }
  return null;
}

function normalizePowerSource(value: unknown): PowerSource {
  const normalized =
    typeof value === "string"
      ? value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_")
      : "";
  if (["main_power", "main", "mains", "grid", "grid_power"].includes(normalized)) {
    return "main_power";
  }
  if (["solar", "solar_backup", "solar_power"].includes(normalized)) {
    return "solar_backup";
  }
  if (["battery", "battery_power", "backup_battery"].includes(normalized)) {
    return "battery";
  }
  return "unknown";
}

function getDisplayStatus(
  hasData: boolean,
  batteryPercentage: number | null,
): EnergyDisplayStatus {
  if (!hasData) return "No data";
  if (batteryPercentage !== null && batteryPercentage <= 20) return "Critical";
  if (batteryPercentage !== null && batteryPercentage <= 40) return "Warning";
  return "Normal";
}

export function mapEnergyStatus(data: DocumentData): EnergyStatusSummary {
  const root = readMap(data);
  const sensorAverages = readMap(data.sensor_averages ?? data.sensorAverages);
  const latestEnergy = readMap(data.latest_energy ?? data.latestEnergy);
  const energyStatus = readMap(data.energy_status ?? data.energyStatus);
  const powerStatusMap = readMap(data.power_status ?? data.powerStatus);
  const batteryStatus = readMap(data.battery_status ?? data.batteryStatus);
  const solarStatus = readMap(data.solar_status ?? data.solarStatus);
  const sensorEnergy = readMap(
    sensorAverages.energy ?? sensorAverages.energy_status ?? sensorAverages.energyStatus,
  );
  const sources: EnergySource[] = [
    { label: "Latest energy", data: latestEnergy },
    { label: "Energy status", data: energyStatus },
    { label: "Power status", data: powerStatusMap },
    { label: "Battery status", data: batteryStatus },
    { label: "Solar status", data: solarStatus },
    { label: "Sensor averages energy", data: sensorEnergy },
    { label: "System document", data: root },
  ];

  const powerSourceValue = firstValue(sources, [
    "current_power_source",
    "currentPowerSource",
    "power_source",
    "powerSource",
    "active_power_source",
    "activePowerSource",
  ]);
  const batteryPercentage =
    readNumber(sources, [
      "battery_percentage",
      "batteryPercentage",
      "battery_percent",
      "batteryPercent",
      "state_of_charge",
      "stateOfCharge",
      "soc",
    ]) ??
    readNumber([{ label: "Battery status", data: batteryStatus }], [
      "percentage",
      "percent",
      "level",
      "charge",
    ]);
  const batteryVoltage =
    readNumber(sources, ["battery_voltage", "batteryVoltage"]) ??
    readNumber([{ label: "Battery status", data: batteryStatus }], ["voltage"]);
  const solarVoltage =
    readNumber(sources, ["solar_voltage", "solarVoltage", "pv_voltage", "pvVoltage"]) ??
    readNumber([{ label: "Solar status", data: solarStatus }], ["voltage"]);
  const chargingValue =
    firstValue(sources, [
      "solar_charging_status",
      "solarChargingStatus",
      "solar_charging",
      "solarCharging",
      "charging_status",
      "chargingStatus",
      "is_charging",
      "isCharging",
    ]) ??
    firstValue([{ label: "Solar status", data: solarStatus }], [
      "charging",
      "is_charging",
      "isCharging",
    ]);
  const loadValue = firstValue(sources, ["load_status", "loadStatus"]);
  const powerStatusValue = firstValue(sources, ["power_status", "powerStatus", "status"]);
  const backupValue = firstValue(sources, [
    "backup_available",
    "backupAvailable",
    "backup_availability",
    "backupAvailability",
  ]);

  const solarChargingStatus = displayText(chargingValue, "Charging", "Not charging");
  const loadStatus = displayText(loadValue, "On", "Off");
  const powerStatus = displayText(powerStatusValue, "Online", "Offline");
  const backupAvailability = displayText(backupValue, "Available", "Unavailable");
  const hasData =
    powerSourceValue !== null ||
    batteryPercentage !== null ||
    batteryVoltage !== null ||
    solarVoltage !== null ||
    Boolean(solarChargingStatus || loadStatus || powerStatus || backupAvailability);
  const sourceLabel =
    sources.find((source) => Object.keys(source.data).length > 0)?.label ??
    "No stored energy summary";

  return {
    currentPowerSource: normalizePowerSource(powerSourceValue),
    batteryPercentage,
    batteryVoltage,
    solarVoltage,
    solarChargingStatus,
    loadStatus,
    powerStatus,
    backupAvailability,
    lastUpdated: readDateFromSources(sources),
    status: getDisplayStatus(hasData, batteryPercentage),
    sourceLabel,
    hasData,
  };
}

export async function loadEnergyStatus(
  firestore: Firestore,
  growerUid: string,
  sourceCollection: GrowerCollectionName,
  systemId: string,
) {
  const snapshot = await getDoc(
    doc(
      firestore,
      sourceCollection,
      growerUid,
      systemSubcollections.systems,
      systemId,
    ),
  );

  if (!snapshot.exists()) {
    throw new Error("The assigned system document no longer exists.");
  }
  return mapEnergyStatus(snapshot.data());
}
