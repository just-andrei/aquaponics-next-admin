import { FirebaseError } from "firebase/app";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  Timestamp,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { firestoreCollections } from "@/types/firestore";
import type { Grower, GrowerCollectionName, GrowerStatus } from "@/types/grower";

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

function normalizeRole(data: DocumentData) {
  const role = readString(data, "role").toLowerCase();
  return role === "user" ? "grower" : role;
}

function isGrowerRecord(data: DocumentData) {
  const role = normalizeRole(data);
  return !role || role === "grower";
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

function readCreatedAt(data: DocumentData) {
  const value = data.createdAt ?? data.created_at;

  if (value instanceof Timestamp) {
    return value.toDate();
  }

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

function mapGrower(
  document: QueryDocumentSnapshot<DocumentData>,
  sourceCollection: GrowerCollectionName,
): Grower | null {
  const data = document.data();
  if (!isGrowerRecord(data)) {
    return null;
  }

  const email = readString(data, "email");
  const directName = readString(data, "name");
  const firstName = readString(data, "first_name", "firstName");
  const lastName = readString(data, "last_name", "lastName");
  const combinedName = `${firstName} ${lastName}`.trim();
  const status = normalizeStatus(data);

  return {
    uid: document.id,
    sourceCollection,
    name: directName || combinedName || email || "Unknown grower",
    email,
    status,
    isActive: status === "active",
    address: readString(data, "address"),
    createdAt: readCreatedAt(data),
  };
}

export async function resolveGrowerCollectionName(
  firestore: Firestore,
): Promise<GrowerCollectionName> {
  for (const collectionName of growerCollections) {
    try {
      const snapshot = await getDocs(
        query(collection(firestore, collectionName), limit(1)),
      );
      if (!snapshot.empty) {
        return collectionName;
      }
    } catch (error) {
      if (!(error instanceof FirebaseError) || error.code !== "permission-denied") {
        throw error;
      }
    }
  }

  return firestoreCollections.growers;
}

export function subscribeToGrowers(
  firestore: Firestore,
  collectionName: GrowerCollectionName,
  onGrowers: (growers: Grower[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(firestore, collectionName),
    (snapshot) => {
      const growers = snapshot.docs
        .map((document) => mapGrower(document, collectionName))
        .filter((grower): grower is Grower => grower !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      onGrowers(growers);
    },
    (error) => onError(error),
  );
}
