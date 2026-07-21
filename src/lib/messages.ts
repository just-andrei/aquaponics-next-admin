import {
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestoreCollections } from "@/types/firestore";
import type {
  AdminMessage,
  MessageCollectionName,
  MessageKind,
  MessageStatus,
} from "@/types/message";

export const messageStatuses: MessageStatus[] = ["new", "reviewed", "resolved"];

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

function normalizeStatus(value: unknown): MessageStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "reviewed" || normalized === "resolved"
    ? normalized
    : "new";
}

function collectionForKind(kind: MessageKind): MessageCollectionName {
  return kind === "contact"
    ? firestoreCollections.contactSubmissions
    : firestoreCollections.inquirySubmissions;
}

function mapMessage(
  document: QueryDocumentSnapshot<DocumentData>,
  kind: MessageKind,
): AdminMessage {
  const data = document.data();
  return {
    id: document.id,
    kind,
    name: readString(data, ["name", "fullName", "full_name"], "Unknown sender"),
    email: readString(data, ["email", "emailAddress", "email_address"]),
    subject: readString(data, ["subject", "inquirySubject", "inquiry_subject"]),
    message: readString(data, ["message", "body", "details"], "No message provided."),
    status: normalizeStatus(data.status),
    createdAt: readDate(data.createdAt ?? data.created_at),
    source: readString(data, ["source"]),
    inquiryDetails:
      kind === "inquiry"
        ? {
            contactNumber: readString(data, [
              "contactNumber",
              "contact_number",
              "phoneNumber",
              "phone_number",
            ]),
            companyName: readString(data, ["companyName", "company_name"]),
            location: readString(data, ["location", "address"]),
            inquiryType: readString(data, ["inquiryType", "inquiry_type"]),
            farmSizeSqm: readString(data, ["farmSizeSqm", "farm_size_sqm"]),
            setupLocation: readString(data, ["setupLocation", "setup_location"]),
            budgetRange: readString(data, ["budgetRange", "budget_range"]),
            preferredSetupDate: readDate(
              data.preferredSetupDate ?? data.preferred_setup_date,
            ),
          }
        : null,
  };
}

export async function loadAdminMessages(
  firestore: Firestore,
  kind: MessageKind,
) {
  const collectionName = collectionForKind(kind);
  const snapshot = await getDocs(collection(firestore, collectionName));

  return snapshot.docs
    .map((document) => mapMessage(document, kind))
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
        (a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY),
    );
}

export async function updateAdminMessageStatus(
  firestore: Firestore,
  kind: MessageKind,
  messageId: string,
  status: MessageStatus,
) {
  if (!messageStatuses.includes(status)) {
    throw new Error("Unsupported message status.");
  }
  if (!messageId.trim()) throw new Error("A message ID is required.");

  await updateDoc(doc(firestore, collectionForKind(kind), messageId), { status });
}
