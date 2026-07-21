import type { GrowerCollectionName } from "@/types/grower";
import type { MonitoringSummary } from "@/types/monitoring";

export type AssignedSystem = {
  id: string;
  sourceCollection: GrowerCollectionName;
  systemName: string;
  hardwareUid: string;
  isActive: boolean;
  provisionCode: string;
  activeFishId: string;
  activePlantId: string;
  monitoringSummary: MonitoringSummary;
};

export type AssignedSystemsResult = {
  sourceCollection: GrowerCollectionName;
  systems: AssignedSystem[];
};
