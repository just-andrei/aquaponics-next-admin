export type AlertSeverity = "warning" | "critical";
export type AlertStatus = "new" | "acknowledged" | "resolved";

export type AlertPreview = {
  parameter: string;
  formattedValue: string;
  rawValue: number;
  severity: AlertSeverity;
  message: string;
  dedupeKey: string;
};

export type EnvironmentalAlert = {
  id: string;
  parameter: string;
  value: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  source: string;
  dedupeKey: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
};

export type AlertSystemContext = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systemId: string;
  systemName: string;
  hardwareUid: string;
};

export type LogAlertsResult = {
  saved: number;
  skipped: number;
};
