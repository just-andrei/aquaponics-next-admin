import {
  collection,
  getDocs,
  Timestamp,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { mapMonitoringSummary } from "@/lib/monitoring";
import { mapEnergyStatus } from "@/lib/energyStatus";
import { firestoreCollections, systemSubcollections } from "@/types/firestore";
import type { GrowerCollectionName, GrowerStatus } from "@/types/grower";
import type {
  MonitoringReportData,
  ReportAlert,
  ReportAlertStatus,
  ReportGrower,
  ReportHarvestRecord,
  ReportMonitoringRecord,
  ReportSystem,
} from "@/types/report";

const growerCollections: GrowerCollectionName[] = [
  firestoreCollections.growers,
  firestoreCollections.growersLegacy,
];

function readString(data: DocumentData, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readNumber(data: DocumentData, keys: string[]) {
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

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
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

function normalizeGrowerStatus(data: DocumentData): GrowerStatus {
  if (typeof data.isActive === "boolean") return data.isActive ? "active" : "inactive";
  const value = readString(data, ["status"]).toLowerCase();
  return ["inactive", "disabled", "blocked", "suspended"].includes(value)
    ? "inactive"
    : "active";
}

function isGrowerRecord(data: DocumentData) {
  const role = readString(data, ["role"]).toLowerCase();
  return !role || role === "grower" || role === "user";
}

function mapGrower(
  document: QueryDocumentSnapshot<DocumentData>,
  sourceCollection: GrowerCollectionName,
): ReportGrower | null {
  const data = document.data();
  if (!isGrowerRecord(data)) return null;
  const email = readString(data, ["email"]);
  const directName = readString(data, ["name"]);
  const firstName = readString(data, ["first_name", "firstName"]);
  const lastName = readString(data, ["last_name", "lastName"]);
  const status = normalizeGrowerStatus(data);
  return {
    uid: document.id,
    sourceCollection,
    name: directName || `${firstName} ${lastName}`.trim() || email || "Unknown grower",
    email,
    status,
    isActive: status === "active",
  };
}

async function loadGrowers(firestore: Firestore) {
  for (const collectionName of growerCollections) {
    const snapshot = await getDocs(collection(firestore, collectionName));
    const growers = snapshot.docs
      .map((document) => mapGrower(document, collectionName))
      .filter((grower): grower is ReportGrower => grower !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (growers.length > 0) return growers;
  }
  return [];
}

function mapSystem(
  document: QueryDocumentSnapshot<DocumentData>,
  grower: ReportGrower,
  sourceCollection: GrowerCollectionName,
): ReportSystem {
  const data = document.data();
  const monitoring = mapMonitoringSummary(data);
  return {
    id: document.id,
    growerUid: grower.uid,
    growerName: grower.name,
    sourceCollection,
    systemName:
      readString(data, ["system_name", "systemName"]) || `System ${document.id}`,
    isActive: readBoolean(
      data.is_system_active ?? data.isSystemActive ?? data.isActive,
    ),
    hasStoredMonitoring: monitoring.status !== "No data",
    hasStoredEnergy: mapEnergyStatus(data).hasData,
  };
}

async function loadSystemsForGrower(firestore: Firestore, grower: ReportGrower) {
  const sources: GrowerCollectionName[] =
    grower.sourceCollection === firestoreCollections.growers
      ? [firestoreCollections.growers, firestoreCollections.growersLegacy]
      : [grower.sourceCollection];

  for (const sourceCollection of sources) {
    const snapshot = await getDocs(
      collection(
        firestore,
        sourceCollection,
        grower.uid,
        systemSubcollections.systems,
      ),
    );
    if (!snapshot.empty) {
      return snapshot.docs.map((document) =>
        mapSystem(document, grower, sourceCollection),
      );
    }
  }
  return [];
}

function nestedCollection(
  firestore: Firestore,
  system: ReportSystem,
  subcollection: string,
) {
  return collection(
    firestore,
    system.sourceCollection,
    system.growerUid,
    systemSubcollections.systems,
    system.id,
    subcollection,
  );
}

function mapHarvestRecord(
  document: QueryDocumentSnapshot<DocumentData>,
  system: ReportSystem,
): ReportHarvestRecord {
  const data = document.data();
  return {
    id: document.id,
    growerUid: readString(data, ["growerUid", "grower_uid"], system.growerUid),
    growerName: readString(data, ["growerName", "grower_name"], system.growerName),
    systemId: readString(data, ["systemId", "system_id"], system.id),
    systemName: readString(data, ["systemName", "system_name"], system.systemName),
    recordType: readString(data, ["recordType", "record_type"], "Not specified"),
    itemName: readString(data, ["itemName", "item_name"], "Unnamed item"),
    quantity: readNumber(data, ["quantity"]),
    unit: readString(data, ["unit"]),
    condition: readString(data, ["condition"], "Not specified"),
    occurredAt:
      readDate(data.harvestDate ?? data.harvest_date) ??
      readDate(data.createdAt ?? data.created_at),
  };
}

function mapWeeklyLog(
  document: QueryDocumentSnapshot<DocumentData>,
  system: ReportSystem,
): ReportMonitoringRecord {
  const data = document.data();
  const summary = mapMonitoringSummary(data);
  return {
    id: document.id,
    growerUid: system.growerUid,
    growerName: system.growerName,
    systemId: system.id,
    systemName: system.systemName,
    status: summary.status,
    metrics: summary.metrics,
    notes: readString(data, ["notes", "note", "remarks", "description"]),
    occurredAt: summary.measuredAt ?? readDate(data.createdAt ?? data.created_at),
  };
}

type NestedSystemData = {
  system: ReportSystem;
  monitoringRecords: ReportMonitoringRecord[];
  harvestRecords: ReportHarvestRecord[];
  plantStatusCount: number;
  aquacultureStatusCount: number;
};

async function loadNestedSystemData(
  firestore: Firestore,
  system: ReportSystem,
): Promise<NestedSystemData> {
  const [weeklySnapshot, harvestSnapshot, plantSnapshot, aquacultureSnapshot] =
    await Promise.all([
      getDocs(nestedCollection(firestore, system, systemSubcollections.weeklyLogs)),
      getDocs(nestedCollection(firestore, system, systemSubcollections.harvestRecords)),
      getDocs(
        nestedCollection(firestore, system, systemSubcollections.plantStatusRecords),
      ),
      getDocs(
        nestedCollection(
          firestore,
          system,
          systemSubcollections.aquacultureStatusRecords,
        ),
      ),
    ]);

  return {
    system,
    monitoringRecords: weeklySnapshot.docs.map((document) =>
      mapWeeklyLog(document, system),
    ),
    harvestRecords: harvestSnapshot.docs.map((document) =>
      mapHarvestRecord(document, system),
    ),
    plantStatusCount: plantSnapshot.size,
    aquacultureStatusCount: aquacultureSnapshot.size,
  };
}

function normalizeAlertStatus(value: unknown): ReportAlertStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "acknowledged" || normalized === "resolved") return normalized;
  return "new";
}

function mapAlert(
  document: QueryDocumentSnapshot<DocumentData>,
  growerNames: Map<string, string>,
): ReportAlert {
  const data = document.data();
  const growerUid = readString(data, ["growerUid", "grower_uid"]);
  return {
    id: document.id,
    growerUid,
    growerName:
      readString(data, ["growerName", "grower_name"]) ||
      growerNames.get(growerUid) ||
      "Unknown grower",
    systemId: readString(data, ["systemId", "system_id"]),
    systemName: readString(data, ["systemName", "system_name"], "Unknown system"),
    parameter: readString(data, ["parameter"], "Unknown parameter"),
    value: readString(data, ["value"], "No value"),
    severity: readString(data, ["severity"], "warning").toLowerCase(),
    status: normalizeAlertStatus(data.status),
    message: readString(data, ["message"], "No message"),
    createdAt: readDate(data.createdAt ?? data.created_at),
  };
}

function newestFirst<T extends { occurredAt: Date | null }>(records: T[]) {
  return records.sort(
    (a, b) =>
      (b.occurredAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
      (a.occurredAt?.getTime() ?? Number.NEGATIVE_INFINITY),
  );
}

export async function loadMonitoringReport(
  firestore: Firestore,
): Promise<MonitoringReportData> {
  const growers = await loadGrowers(firestore);
  const systems = (
    await Promise.all(growers.map((grower) => loadSystemsForGrower(firestore, grower)))
  ).flat();
  const [nestedData, alertSnapshot] = await Promise.all([
    Promise.all(systems.map((system) => loadNestedSystemData(firestore, system))),
    getDocs(collection(firestore, firestoreCollections.environmentalAlerts)),
  ]);

  const growerNames = new Map(growers.map((grower) => [grower.uid, grower.name]));
  const alerts = alertSnapshot.docs
    .map((document) => mapAlert(document, growerNames))
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
        (a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY),
    );
  const harvestRecords = newestFirst(
    nestedData.flatMap((data) => data.harvestRecords),
  );
  const monitoringRecords = newestFirst(
    nestedData.flatMap((data) => data.monitoringRecords),
  );
  const systemsWithNoMonitoringData = systems.filter((system) => {
    const nested = nestedData.find((data) => data.system === system);
    return !system.hasStoredMonitoring && (nested?.monitoringRecords.length ?? 0) === 0;
  }).length;

  return {
    growers,
    systems,
    alerts,
    harvestRecords,
    monitoringRecords,
    summary: {
      totalGrowers: growers.length,
      activeGrowers: growers.filter((grower) => grower.isActive).length,
      inactiveGrowers: growers.filter((grower) => !grower.isActive).length,
      totalAssignedSystems: systems.length,
      systemsWithNoMonitoringData,
      systemsWithEnergyData: systems.filter((system) => system.hasStoredEnergy).length,
      activeUnresolvedAlerts: alerts.filter((alert) => alert.status !== "resolved").length,
      resolvedAlerts: alerts.filter((alert) => alert.status === "resolved").length,
      totalHarvestRecords: harvestRecords.length,
      totalPlantStatusRecords: nestedData.reduce(
        (total, data) => total + data.plantStatusCount,
        0,
      ),
      totalAquacultureStatusRecords: nestedData.reduce(
        (total, data) => total + data.aquacultureStatusCount,
        0,
      ),
    },
  };
}
