export type EnergyDisplayStatus = "Normal" | "Warning" | "Critical" | "No data";
export type PowerSource = "main_power" | "solar_backup" | "battery" | "unknown";

export type EnergyStatusSummary = {
  currentPowerSource: PowerSource;
  batteryPercentage: number | null;
  batteryVoltage: number | null;
  solarVoltage: number | null;
  solarChargingStatus: string;
  loadStatus: string;
  powerStatus: string;
  backupAvailability: string;
  lastUpdated: Date | null;
  status: EnergyDisplayStatus;
  sourceLabel: string;
  hasData: boolean;
};
