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
  AquacultureGrowthStage,
  AquacultureStatusDraft,
  AquacultureStatusRecord,
  AverageWeightUnit,
  BehaviorObservation,
  FeedingObservation,
  GrowthHealthStatus,
  GrowthStatusContext,
  PlantGrowthStage,
  PlantHeightUnit,
  PlantLeafCondition,
  PlantStatusDraft,
  PlantStatusRecord,
} from "@/types/growthStatus";

const plantGrowthStages: PlantGrowthStage[] = [
  "seedling",
  "vegetative",
  "mature",
  "flowering",
  "ready_to_harvest",
];
const leafConditions: PlantLeafCondition[] = [
  "healthy",
  "yellowing",
  "wilting",
  "pest_damage",
  "nutrient_deficiency",
  "unknown",
];
const healthStatuses: GrowthHealthStatus[] = ["good", "fair", "poor", "critical"];
const heightUnits: PlantHeightUnit[] = ["cm", "m", "in"];
const aquacultureGrowthStages: AquacultureGrowthStage[] = [
  "small",
  "medium",
  "large",
  "harvest_ready",
];
const feedingObservations: FeedingObservation[] = [
  "normal",
  "low_appetite",
  "overfeeding_signs",
  "missed_feeding",
  "unknown",
];
const behaviorObservations: BehaviorObservation[] = [
  "normal",
  "sluggish",
  "gasping",
  "hiding",
  "aggressive",
  "mortality_observed",
  "unknown",
];
const averageWeightUnits: AverageWeightUnit[] = ["g", "kg"];

function readString(data: DocumentData, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readNullableNumber(data: DocumentData, keys: string[]) {
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

function readNullableInteger(data: DocumentData, keys: string[]) {
  const value = readNullableNumber(data, keys);
  return value === null ? null : Math.trunc(value);
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

function normalizeValue<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T,
): T {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
}

function recordMetadata(document: QueryDocumentSnapshot<DocumentData>) {
  const data = document.data();
  return {
    id: document.id,
    growerUid: readString(data, ["growerUid", "grower_uid"]),
    growerName: readString(data, ["growerName", "grower_name"]),
    growerEmail: readString(data, ["growerEmail", "grower_email"]),
    systemId: readString(data, ["systemId", "system_id"]),
    systemName: readString(data, ["systemName", "system_name"]),
    hardwareUid: readString(data, ["hardwareUid", "hardware_uid"]),
    recordedAt: readDate(data.recordedAt ?? data.recorded_at),
    createdAt: readDate(data.createdAt ?? data.created_at),
    updatedAt: readDate(data.updatedAt ?? data.updated_at),
    createdBy: readString(data, ["createdBy", "created_by"]),
  };
}

function mapPlantStatusRecord(
  document: QueryDocumentSnapshot<DocumentData>,
): PlantStatusRecord {
  const data = document.data();
  return {
    ...recordMetadata(document),
    plantName: readString(data, ["plantName", "plant_name"], "Unnamed plant"),
    growthStage: normalizeValue(
      data.growthStage ?? data.growth_stage,
      plantGrowthStages,
      "seedling",
    ),
    heightValue: readNullableNumber(data, ["heightValue", "height_value"]),
    heightUnit: normalizeValue(data.heightUnit ?? data.height_unit, heightUnits, "cm"),
    leafCondition: normalizeValue(
      data.leafCondition ?? data.leaf_condition,
      leafConditions,
      "unknown",
    ),
    healthStatus: normalizeValue(
      data.healthStatus ?? data.health_status,
      healthStatuses,
      "good",
    ),
    notes: readString(data, ["notes"]),
  };
}

function mapAquacultureStatusRecord(
  document: QueryDocumentSnapshot<DocumentData>,
): AquacultureStatusRecord {
  const data = document.data();
  return {
    ...recordMetadata(document),
    speciesName: readString(data, ["speciesName", "species_name"], "Unnamed species"),
    growthStage: normalizeValue(
      data.growthStage ?? data.growth_stage,
      aquacultureGrowthStages,
      "small",
    ),
    fishCount: readNullableInteger(data, ["fishCount", "fish_count"]),
    averageWeightValue: readNullableNumber(data, [
      "averageWeightValue",
      "average_weight_value",
    ]),
    averageWeightUnit: normalizeValue(
      data.averageWeightUnit ?? data.average_weight_unit,
      averageWeightUnits,
      "g",
    ),
    healthStatus: normalizeValue(
      data.healthStatus ?? data.health_status,
      healthStatuses,
      "good",
    ),
    feedingObservation: normalizeValue(
      data.feedingObservation ?? data.feeding_observation,
      feedingObservations,
      "unknown",
    ),
    behaviorObservation: normalizeValue(
      data.behaviorObservation ?? data.behavior_observation,
      behaviorObservations,
      "unknown",
    ),
    notes: readString(data, ["notes"]),
  };
}

function recordsCollection(
  firestore: Firestore,
  context: GrowthStatusContext,
  subcollection: string,
) {
  return collection(
    firestore,
    context.sourceCollection,
    context.growerUid,
    systemSubcollections.systems,
    context.systemId,
    subcollection,
  );
}

function sortNewest<T extends { recordedAt: Date | null; createdAt: Date | null }>(
  records: T[],
) {
  return records.sort((a, b) => {
    const bTime = b.recordedAt?.getTime() ?? b.createdAt?.getTime();
    const aTime = a.recordedAt?.getTime() ?? a.createdAt?.getTime();
    return (
      (bTime ?? Number.NEGATIVE_INFINITY) -
      (aTime ?? Number.NEGATIVE_INFINITY)
    );
  });
}

function basePayload(context: GrowthStatusContext, recordedAt: Date) {
  if (Number.isNaN(recordedAt.getTime())) throw new Error("A valid recorded date is required.");
  return {
    growerUid: context.growerUid,
    growerName: context.growerName,
    growerEmail: context.growerEmail,
    systemId: context.systemId,
    systemName: context.systemName,
    hardwareUid: context.hardwareUid,
    recordedAt: Timestamp.fromDate(recordedAt),
    updatedAt: serverTimestamp(),
  };
}

function validatePlantDraft(draft: PlantStatusDraft) {
  if (!draft.plantName.trim()) throw new Error("Plant name is required.");
  if (!plantGrowthStages.includes(draft.growthStage)) {
    throw new Error("Select a valid plant growth stage.");
  }
  if (!healthStatuses.includes(draft.healthStatus)) {
    throw new Error("Select a valid health status.");
  }
  if (draft.heightValue !== null && (!Number.isFinite(draft.heightValue) || draft.heightValue < 0)) {
    throw new Error("Height must be empty or a non-negative number.");
  }
}

function validateAquacultureDraft(draft: AquacultureStatusDraft) {
  if (!draft.speciesName.trim()) throw new Error("Species name is required.");
  if (!aquacultureGrowthStages.includes(draft.growthStage)) {
    throw new Error("Select a valid aquaculture growth stage.");
  }
  if (!healthStatuses.includes(draft.healthStatus)) {
    throw new Error("Select a valid health status.");
  }
  if (
    draft.fishCount !== null &&
    (!Number.isInteger(draft.fishCount) || draft.fishCount < 0)
  ) {
    throw new Error("Fish count must be empty or a non-negative whole number.");
  }
  if (
    draft.averageWeightValue !== null &&
    (!Number.isFinite(draft.averageWeightValue) || draft.averageWeightValue < 0)
  ) {
    throw new Error("Average weight must be empty or a non-negative number.");
  }
}

function plantPayload(context: GrowthStatusContext, draft: PlantStatusDraft) {
  validatePlantDraft(draft);
  return {
    ...basePayload(context, draft.recordedAt),
    plantName: draft.plantName.trim(),
    growthStage: draft.growthStage,
    heightValue: draft.heightValue,
    heightUnit: draft.heightUnit,
    leafCondition: draft.leafCondition,
    healthStatus: draft.healthStatus,
    notes: draft.notes.trim(),
  };
}

function aquaculturePayload(
  context: GrowthStatusContext,
  draft: AquacultureStatusDraft,
) {
  validateAquacultureDraft(draft);
  return {
    ...basePayload(context, draft.recordedAt),
    speciesName: draft.speciesName.trim(),
    growthStage: draft.growthStage,
    fishCount: draft.fishCount,
    averageWeightValue: draft.averageWeightValue,
    averageWeightUnit: draft.averageWeightUnit,
    healthStatus: draft.healthStatus,
    feedingObservation: draft.feedingObservation,
    behaviorObservation: draft.behaviorObservation,
    notes: draft.notes.trim(),
  };
}

export async function loadPlantStatusRecords(
  firestore: Firestore,
  context: GrowthStatusContext,
) {
  const snapshot = await getDocs(
    recordsCollection(firestore, context, systemSubcollections.plantStatusRecords),
  );
  return sortNewest(snapshot.docs.map(mapPlantStatusRecord));
}

export async function loadAquacultureStatusRecords(
  firestore: Firestore,
  context: GrowthStatusContext,
) {
  const snapshot = await getDocs(
    recordsCollection(
      firestore,
      context,
      systemSubcollections.aquacultureStatusRecords,
    ),
  );
  return sortNewest(snapshot.docs.map(mapAquacultureStatusRecord));
}

export async function createPlantStatusRecord(
  firestore: Firestore,
  context: GrowthStatusContext,
  draft: PlantStatusDraft,
  createdBy: string,
) {
  if (!createdBy.trim()) throw new Error("An authenticated administrator is required.");
  await addDoc(
    recordsCollection(firestore, context, systemSubcollections.plantStatusRecords),
    {
      ...plantPayload(context, draft),
      createdAt: serverTimestamp(),
      createdBy,
    },
  );
}

export async function updatePlantStatusRecord(
  firestore: Firestore,
  context: GrowthStatusContext,
  recordId: string,
  draft: PlantStatusDraft,
) {
  if (!recordId.trim()) throw new Error("A plant status record ID is required.");
  await updateDoc(
    doc(
      firestore,
      context.sourceCollection,
      context.growerUid,
      systemSubcollections.systems,
      context.systemId,
      systemSubcollections.plantStatusRecords,
      recordId,
    ),
    plantPayload(context, draft),
  );
}

export async function createAquacultureStatusRecord(
  firestore: Firestore,
  context: GrowthStatusContext,
  draft: AquacultureStatusDraft,
  createdBy: string,
) {
  if (!createdBy.trim()) throw new Error("An authenticated administrator is required.");
  await addDoc(
    recordsCollection(
      firestore,
      context,
      systemSubcollections.aquacultureStatusRecords,
    ),
    {
      ...aquaculturePayload(context, draft),
      createdAt: serverTimestamp(),
      createdBy,
    },
  );
}

export async function updateAquacultureStatusRecord(
  firestore: Firestore,
  context: GrowthStatusContext,
  recordId: string,
  draft: AquacultureStatusDraft,
) {
  if (!recordId.trim()) throw new Error("An aquaculture status record ID is required.");
  await updateDoc(
    doc(
      firestore,
      context.sourceCollection,
      context.growerUid,
      systemSubcollections.systems,
      context.systemId,
      systemSubcollections.aquacultureStatusRecords,
      recordId,
    ),
    aquaculturePayload(context, draft),
  );
}
