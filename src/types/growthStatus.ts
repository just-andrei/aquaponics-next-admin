import type { GrowerCollectionName } from "@/types/grower";

export type GrowthHealthStatus = "good" | "fair" | "poor" | "critical";
export type PlantGrowthStage =
  | "seedling"
  | "vegetative"
  | "mature"
  | "flowering"
  | "ready_to_harvest";
export type PlantLeafCondition =
  | "healthy"
  | "yellowing"
  | "wilting"
  | "pest_damage"
  | "nutrient_deficiency"
  | "unknown";
export type PlantHeightUnit = "cm" | "m" | "in";
export type AquacultureGrowthStage = "small" | "medium" | "large" | "harvest_ready";
export type FeedingObservation =
  | "normal"
  | "low_appetite"
  | "overfeeding_signs"
  | "missed_feeding"
  | "unknown";
export type BehaviorObservation =
  | "normal"
  | "sluggish"
  | "gasping"
  | "hiding"
  | "aggressive"
  | "mortality_observed"
  | "unknown";
export type AverageWeightUnit = "g" | "kg";

export type GrowthStatusContext = {
  sourceCollection: GrowerCollectionName;
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systemId: string;
  systemName: string;
  hardwareUid: string;
};

type RecordMetadata = {
  id: string;
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systemId: string;
  systemName: string;
  hardwareUid: string;
  recordedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
};

export type PlantStatusRecord = RecordMetadata & {
  plantName: string;
  growthStage: PlantGrowthStage;
  heightValue: number | null;
  heightUnit: PlantHeightUnit;
  leafCondition: PlantLeafCondition;
  healthStatus: GrowthHealthStatus;
  notes: string;
};

export type PlantStatusDraft = {
  plantName: string;
  growthStage: PlantGrowthStage;
  heightValue: number | null;
  heightUnit: PlantHeightUnit;
  leafCondition: PlantLeafCondition;
  healthStatus: GrowthHealthStatus;
  notes: string;
  recordedAt: Date;
};

export type AquacultureStatusRecord = RecordMetadata & {
  speciesName: string;
  growthStage: AquacultureGrowthStage;
  fishCount: number | null;
  averageWeightValue: number | null;
  averageWeightUnit: AverageWeightUnit;
  healthStatus: GrowthHealthStatus;
  feedingObservation: FeedingObservation;
  behaviorObservation: BehaviorObservation;
  notes: string;
};

export type AquacultureStatusDraft = {
  speciesName: string;
  growthStage: AquacultureGrowthStage;
  fishCount: number | null;
  averageWeightValue: number | null;
  averageWeightUnit: AverageWeightUnit;
  healthStatus: GrowthHealthStatus;
  feedingObservation: FeedingObservation;
  behaviorObservation: BehaviorObservation;
  notes: string;
  recordedAt: Date;
};
