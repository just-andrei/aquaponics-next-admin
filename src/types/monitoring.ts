export type MonitoringStatus = "Normal" | "Warning" | "Critical" | "No data";

export type MonitoringMetrics = {
  ph: number | null;
  waterTemperature: number | null;
  dissolvedOxygen: number | null;
  turbidity: number | null;
  humidity: number | null;
};

export type MonitoringSummary = {
  metrics: MonitoringMetrics;
  measuredAt: Date | null;
  status: MonitoringStatus;
  sourceLabel: string;
};

export type WeeklyMonitoringLog = {
  id: string;
  metrics: MonitoringMetrics;
  measuredAt: Date | null;
  status: MonitoringStatus;
  notes: string;
};
