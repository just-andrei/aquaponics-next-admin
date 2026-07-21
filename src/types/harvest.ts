import type { GrowerCollectionName } from "@/types/grower";

export type HarvestRecordType = "plant" | "aquaculture";
export type HarvestCondition = "good" | "fair" | "poor";

export type HarvestRecord = {
  id: string;
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systemId: string;
  systemName: string;
  hardwareUid: string;
  recordType: HarvestRecordType;
  itemName: string;
  quantity: number;
  unit: string;
  harvestDate: Date | null;
  condition: HarvestCondition;
  notes: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
};

export type HarvestRecordDraft = {
  recordType: HarvestRecordType;
  itemName: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  condition: HarvestCondition;
  notes: string;
};

export type HarvestRecordContext = {
  sourceCollection: GrowerCollectionName;
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systemId: string;
  systemName: string;
  hardwareUid: string;
};
