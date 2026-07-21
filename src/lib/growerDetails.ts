import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestoreCollections, systemSubcollections } from "@/types/firestore";
import { mapMonitoringSummary } from "@/lib/monitoring";
import type {
  GrowerCollectionName,
  GrowerProfile,
  GrowerStatus,
} from "@/types/grower";
import type {
  AssignedSystem,
  AssignedSystemsResult,
} from "@/types/system";

export type GrowerDetailsData = {
  grower: GrowerProfile;
  assignedSystems: AssignedSystemsResult;
};

const growerCollections: GrowerCollectionName[] = [
  firestoreCollections.growers,
  firestoreCollections.growersLegacy,
];

function readString(data: DocumentData, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
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

function readDate(value: unknown) {
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

function normalizeStatus(data: DocumentData): GrowerStatus {
  if (typeof data.isActive === "boolean") {
    return data.isActive ? "active" : "inactive";
  }

  const status = readString(data, "status").toLowerCase();
  if (["inactive", "disabled", "blocked", "suspended"].includes(status)) {
    return "inactive";
  }
  return "active";
}

function mapGrowerProfile(
  uid: string,
  sourceCollection: GrowerCollectionName,
  data: DocumentData,
): GrowerProfile {
  const email = readString(data, "email");
  const directName = readString(data, "name");
  const firstName = readString(data, "first_name", "firstName");
  const lastName = readString(data, "last_name", "lastName");
  const combinedName = `${firstName} ${lastName}`.trim();
  const status = normalizeStatus(data);

  return {
    uid,
    sourceCollection,
    name: directName || combinedName || email || "Unknown grower",
    email,
    status,
    isActive: status === "active",
    address: readString(data, "address"),
    createdAt: readDate(data.createdAt ?? data.created_at),
    updatedAt: readDate(data.updatedAt ?? data.updated_at),
  };
}

function mapAssignedSystem(
  document: QueryDocumentSnapshot<DocumentData>,
  sourceCollection: GrowerCollectionName,
): AssignedSystem {
  const data = document.data();
  const systemName = readString(data, "system_name", "systemName");
  const activeValue =
    data.is_system_active ?? data.isSystemActive ?? data.isActive;

  return {
    id: document.id,
    sourceCollection,
    systemName: systemName || `System ${document.id}`,
    hardwareUid: readString(data, "hardware_uid", "hardwareUid"),
    isActive: readBoolean(activeValue),
    provisionCode: readString(data, "provision_code", "provisionCode"),
    activeFishId: readString(data, "active_fish_id", "activeFishId"),
    activePlantId: readString(data, "active_plant_id", "activePlantId"),
    monitoringSummary: mapMonitoringSummary(data),
  };
}

function isPermissionDenied(error: unknown) {
  return (
    error instanceof FirebaseError &&
    (error.code === "permission-denied" || error.code === "firestore/permission-denied")
  );
}

async function loadGrowerProfile(firestore: Firestore, growerUid: string) {
  for (const collectionName of growerCollections) {
    try {
      const snapshot = await getDoc(doc(firestore, collectionName, growerUid));
      if (snapshot.exists()) {
        return mapGrowerProfile(growerUid, collectionName, snapshot.data());
      }
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
    }
  }

  return null;
}

async function loadAssignedSystems(
  firestore: Firestore,
  growerUid: string,
): Promise<AssignedSystemsResult> {
  for (const collectionName of growerCollections) {
    try {
      const snapshot = await getDocs(
        collection(
          firestore,
          collectionName,
          growerUid,
          systemSubcollections.systems,
        ),
      );
      if (!snapshot.empty) {
        return {
          sourceCollection: collectionName,
          systems: snapshot.docs
            .map((document) => mapAssignedSystem(document, collectionName))
            .sort((a, b) => a.systemName.localeCompare(b.systemName)),
        };
      }
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
    }
  }

  return {
    sourceCollection: firestoreCollections.growers,
    systems: [],
  };
}

export async function loadGrowerDetails(
  firestore: Firestore,
  growerUid: string,
): Promise<GrowerDetailsData> {
  const normalizedUid = growerUid.trim();
  if (!normalizedUid) {
    throw new Error("A grower UID is required.");
  }

  const grower = await loadGrowerProfile(firestore, normalizedUid);
  if (!grower) {
    throw new Error("The grower profile could not be found in user or users.");
  }

  const assignedSystems = await loadAssignedSystems(firestore, normalizedUid);
  return { grower, assignedSystems };
}
