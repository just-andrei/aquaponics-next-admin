import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { systemSubcollections } from "@/types/firestore";
import type {
  HarvestCondition,
  HarvestRecord,
  HarvestRecordContext,
  HarvestRecordDraft,
  HarvestRecordType,
} from "@/types/harvest";

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
  return 0;
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

function normalizeRecordType(value: unknown): HarvestRecordType {
  return typeof value === "string" && value.trim().toLowerCase() === "aquaculture"
    ? "aquaculture"
    : "plant";
}

function normalizeCondition(value: unknown): HarvestCondition {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "fair" || normalized === "poor" ? normalized : "good";
}

function mapHarvestRecord(
  document: QueryDocumentSnapshot<DocumentData>,
): HarvestRecord {
  const data = document.data();
  return {
    id: document.id,
    growerUid: readString(data, ["growerUid", "grower_uid"]),
    growerName: readString(data, ["growerName", "grower_name"]),
    growerEmail: readString(data, ["growerEmail", "grower_email"]),
    systemId: readString(data, ["systemId", "system_id"]),
    systemName: readString(data, ["systemName", "system_name"]),
    hardwareUid: readString(data, ["hardwareUid", "hardware_uid"]),
    recordType: normalizeRecordType(data.recordType ?? data.record_type),
    itemName: readString(data, ["itemName", "item_name"], "Unnamed item"),
    quantity: readNumber(data, ["quantity"]),
    unit: readString(data, ["unit"], "-"),
    harvestDate: readDate(data.harvestDate ?? data.harvest_date),
    condition: normalizeCondition(data.condition),
    notes: readString(data, ["notes"]),
    createdAt: readDate(data.createdAt ?? data.created_at),
    updatedAt: readDate(data.updatedAt ?? data.updated_at),
    createdBy: readString(data, ["createdBy", "created_by"]),
  };
}

function recordsCollection(firestore: Firestore, context: HarvestRecordContext) {
  return collection(
    firestore,
    context.sourceCollection,
    context.growerUid,
    systemSubcollections.systems,
    context.systemId,
    systemSubcollections.harvestRecords,
  );
}

function validateDraft(draft: HarvestRecordDraft) {
  if (draft.recordType !== "plant" && draft.recordType !== "aquaculture") {
    throw new Error("Record type must be plant or aquaculture.");
  }
  if (!draft.itemName.trim()) throw new Error("Item name is required.");
  if (!Number.isFinite(draft.quantity) || draft.quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }
  if (!draft.unit.trim()) throw new Error("Unit is required.");
  if (Number.isNaN(draft.harvestDate.getTime())) {
    throw new Error("A valid harvest date is required.");
  }
  if (!["good", "fair", "poor"].includes(draft.condition)) {
    throw new Error("Condition must be good, fair, or poor.");
  }
}

function editablePayload(context: HarvestRecordContext, draft: HarvestRecordDraft) {
  validateDraft(draft);
  return {
    growerUid: context.growerUid,
    growerName: context.growerName,
    growerEmail: context.growerEmail,
    systemId: context.systemId,
    systemName: context.systemName,
    hardwareUid: context.hardwareUid,
    recordType: draft.recordType,
    itemName: draft.itemName.trim(),
    quantity: draft.quantity,
    unit: draft.unit.trim(),
    harvestDate: Timestamp.fromDate(draft.harvestDate),
    condition: draft.condition,
    notes: draft.notes.trim(),
    updatedAt: serverTimestamp(),
  };
}

export async function loadHarvestRecords(
  firestore: Firestore,
  context: HarvestRecordContext,
) {
  const snapshot = await getDocs(recordsCollection(firestore, context));
  return snapshot.docs
    .map(mapHarvestRecord)
    .sort((a, b) => {
      const bSortTime = b.harvestDate?.getTime() ?? b.createdAt?.getTime();
      const aSortTime = a.harvestDate?.getTime() ?? a.createdAt?.getTime();
      return (
        (bSortTime ?? Number.NEGATIVE_INFINITY) -
        (aSortTime ?? Number.NEGATIVE_INFINITY)
      );
    });
}

export async function createHarvestRecord(
  firestore: Firestore,
  context: HarvestRecordContext,
  draft: HarvestRecordDraft,
  createdBy: string,
) {
  if (!createdBy.trim()) throw new Error("An authenticated administrator is required.");
  await addDoc(recordsCollection(firestore, context), {
    ...editablePayload(context, draft),
    createdAt: serverTimestamp(),
    createdBy,
  });
}

export async function updateHarvestRecord(
  firestore: Firestore,
  context: HarvestRecordContext,
  recordId: string,
  draft: HarvestRecordDraft,
) {
  if (!recordId.trim()) throw new Error("A harvest record ID is required.");
  await updateDoc(
    doc(
      firestore,
      context.sourceCollection,
      context.growerUid,
      systemSubcollections.systems,
      context.systemId,
      systemSubcollections.harvestRecords,
      recordId,
    ),
    editablePayload(context, draft),
  );
}
