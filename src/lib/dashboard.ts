import {
  collection,
  getDocs,
  Timestamp,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestoreCollections, systemSubcollections } from "@/types/firestore";
import type { AlertStatus } from "@/types/alert";
import type { GrowerCollectionName } from "@/types/grower";
import type { MessageKind, MessageStatus } from "@/types/message";
import type {
  AdminDashboardData,
  DashboardAlert,
  DashboardMessage,
} from "@/types/dashboard";

type DashboardGrower = {
  uid: string;
  sourceCollection: GrowerCollectionName;
  name: string;
  isActive: boolean;
};

function readString(data: DocumentData, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
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

function isGrowerRecord(data: DocumentData) {
  const role = readString(data, ["role", "userType", "user_type"]).toLowerCase();
  return !role || ["grower", "farmer", "user"].includes(role);
}

function isActiveGrower(data: DocumentData) {
  const activeValue = data.isActive ?? data.is_active;
  if (typeof activeValue === "boolean") return activeValue;
  if (typeof activeValue === "string") {
    const normalized = activeValue.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  const status = readString(data, ["status"]).toLowerCase();
  return !["inactive", "disabled", "blocked", "suspended"].includes(status);
}

function mapGrower(
  document: QueryDocumentSnapshot<DocumentData>,
  sourceCollection: GrowerCollectionName,
): DashboardGrower | null {
  const data = document.data();
  if (!isGrowerRecord(data)) return null;

  const email = readString(data, ["email"]);
  const directName = readString(data, ["name"]);
  const firstName = readString(data, ["first_name", "firstName"]);
  const lastName = readString(data, ["last_name", "lastName"]);

  return {
    uid: document.id,
    sourceCollection,
    name: directName || `${firstName} ${lastName}`.trim() || email || "Unknown grower",
    isActive: isActiveGrower(data),
  };
}

async function loadGrowers(firestore: Firestore) {
  const primarySnapshot = await getDocs(
    collection(firestore, firestoreCollections.growers),
  );
  const primaryGrowers = primarySnapshot.docs
    .map((document) => mapGrower(document, firestoreCollections.growers))
    .filter((grower): grower is DashboardGrower => grower !== null);

  if (primaryGrowers.length > 0) return primaryGrowers;

  const legacySnapshot = await getDocs(
    collection(firestore, firestoreCollections.growersLegacy),
  );
  return legacySnapshot.docs
    .map((document) => mapGrower(document, firestoreCollections.growersLegacy))
    .filter((grower): grower is DashboardGrower => grower !== null);
}

async function countSystemsForGrower(
  firestore: Firestore,
  grower: DashboardGrower,
) {
  const primarySnapshot = await getDocs(
    collection(
      firestore,
      grower.sourceCollection,
      grower.uid,
      systemSubcollections.systems,
    ),
  );
  if (!primarySnapshot.empty || grower.sourceCollection !== firestoreCollections.growers) {
    return primarySnapshot.size;
  }

  const legacySnapshot = await getDocs(
    collection(
      firestore,
      firestoreCollections.growersLegacy,
      grower.uid,
      systemSubcollections.systems,
    ),
  );
  return legacySnapshot.size;
}

function normalizeAlertStatus(value: unknown): AlertStatus {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (status === "acknowledged" || status === "resolved") return status;
  return "new";
}

function mapAlert(
  document: QueryDocumentSnapshot<DocumentData>,
  growerNames: Map<string, string>,
): DashboardAlert {
  const data = document.data();
  const growerUid = readString(data, ["growerUid", "grower_uid"]);
  return {
    id: document.id,
    growerName:
      readString(data, ["growerName", "grower_name"]) ||
      growerNames.get(growerUid) ||
      "Unknown grower",
    systemName: readString(data, ["systemName", "system_name"], "Unknown system"),
    parameter: readString(data, ["parameter"], "Unknown parameter"),
    value: readString(data, ["value"], "No value"),
    severity: readString(data, ["severity"], "warning").toLowerCase(),
    status: normalizeAlertStatus(data.status),
    message: readString(data, ["message"], "No message provided."),
    createdAt: readDate(data.createdAt ?? data.created_at),
  };
}

function normalizeMessageStatus(value: unknown): MessageStatus {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (status === "reviewed" || status === "resolved") return status;
  return "new";
}

function mapMessage(
  document: QueryDocumentSnapshot<DocumentData>,
  kind: MessageKind,
): DashboardMessage {
  const data = document.data();
  return {
    id: document.id,
    kind,
    name: readString(data, ["name", "fullName", "full_name"], "Unknown sender"),
    email: readString(data, ["email", "emailAddress", "email_address"]),
    subject: readString(data, ["subject", "inquirySubject", "inquiry_subject"]),
    message: readString(data, ["message", "body", "details"], "No message provided."),
    status: normalizeMessageStatus(data.status),
    createdAt: readDate(data.createdAt ?? data.created_at),
  };
}

function newestFirst<T extends { createdAt: Date | null }>(records: T[]) {
  return records.sort(
    (a, b) =>
      (b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
      (a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY),
  );
}

export async function loadAdminDashboard(
  firestore: Firestore,
): Promise<AdminDashboardData> {
  const growers = await loadGrowers(firestore);
  const [systemCounts, alertsSnapshot, contactSnapshot, inquirySnapshot] =
    await Promise.all([
      Promise.all(growers.map((grower) => countSystemsForGrower(firestore, grower))),
      getDocs(collection(firestore, firestoreCollections.environmentalAlerts)),
      getDocs(collection(firestore, firestoreCollections.contactSubmissions)),
      getDocs(collection(firestore, firestoreCollections.inquirySubmissions)),
    ]);

  const growerNames = new Map(growers.map((grower) => [grower.uid, grower.name]));
  const alerts = newestFirst(
    alertsSnapshot.docs.map((document) => mapAlert(document, growerNames)),
  );
  const contactMessages = contactSnapshot.docs.map((document) =>
    mapMessage(document, "contact"),
  );
  const inquiryMessages = inquirySnapshot.docs.map((document) =>
    mapMessage(document, "inquiry"),
  );

  return {
    summary: {
      totalGrowers: growers.length,
      activeGrowers: growers.filter((grower) => grower.isActive).length,
      inactiveGrowers: growers.filter((grower) => !grower.isActive).length,
      totalAssignedSystems: systemCounts.reduce((total, count) => total + count, 0),
      unresolvedEnvironmentalAlerts: alerts.filter(
        (alert) => alert.status !== "resolved",
      ).length,
      resolvedEnvironmentalAlerts: alerts.filter(
        (alert) => alert.status === "resolved",
      ).length,
      newContactMessages: contactMessages.filter((message) => message.status === "new")
        .length,
      newInquiryMessages: inquiryMessages.filter((message) => message.status === "new")
        .length,
    },
    recentAlerts: alerts.slice(0, 6),
    recentMessages: newestFirst([...contactMessages, ...inquiryMessages]).slice(0, 6),
  };
}
