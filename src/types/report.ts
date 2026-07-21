import type { GrowerCollectionName, GrowerStatus } from "@/types/grower";
import type { MonitoringMetrics, MonitoringStatus } from "@/types/monitoring";

export type ReportAlertStatus = "new" | "acknowledged" | "resolved";

export type ReportGrower = {
  uid: string;
  sourceCollection: GrowerCollectionName;
  name: string;
  email: string;
  status: GrowerStatus;
  isActive: boolean;
};

export type ReportSystem = {
  id: string;
  growerUid: string;
  growerName: string;
  sourceCollection: GrowerCollectionName;
  systemName: string;
  isActive: boolean;
  hasStoredMonitoring: boolean;
  hasStoredEnergy: boolean;
};

export type ReportAlert = {
  id: string;
  growerUid: string;
  growerName: string;
  systemId: string;
  systemName: string;
  parameter: string;
  value: string;
  severity: string;
  status: ReportAlertStatus;
  message: string;
  createdAt: Date | null;
};

export type ReportHarvestRecord = {
  id: string;
  growerUid: string;
  growerName: string;
  systemId: string;
  systemName: string;
  recordType: string;
  itemName: string;
  quantity: number | null;
  unit: string;
  condition: string;
  occurredAt: Date | null;
};

export type ReportMonitoringRecord = {
  id: string;
  growerUid: string;
  growerName: string;
  systemId: string;
  systemName: string;
  status: MonitoringStatus;
  metrics: MonitoringMetrics;
  notes: string;
  occurredAt: Date | null;
};

export type ReportSummary = {
  totalGrowers: number;
  activeGrowers: number;
  inactiveGrowers: number;
  totalAssignedSystems: number;
  systemsWithNoMonitoringData: number;
  systemsWithEnergyData: number;
  activeUnresolvedAlerts: number;
  resolvedAlerts: number;
  totalHarvestRecords: number;
  totalPlantStatusRecords: number;
  totalAquacultureStatusRecords: number;
};

export type MonitoringReportData = {
  growers: ReportGrower[];
  systems: ReportSystem[];
  alerts: ReportAlert[];
  harvestRecords: ReportHarvestRecord[];
  monitoringRecords: ReportMonitoringRecord[];
  summary: ReportSummary;
};
