import type { AlertStatus } from "@/types/alert";
import type { MessageKind, MessageStatus } from "@/types/message";

export type DashboardSummary = {
  totalGrowers: number;
  activeGrowers: number;
  inactiveGrowers: number;
  totalAssignedSystems: number;
  unresolvedEnvironmentalAlerts: number;
  resolvedEnvironmentalAlerts: number;
  newContactMessages: number;
  newInquiryMessages: number;
};

export type DashboardAlert = {
  id: string;
  growerName: string;
  systemName: string;
  parameter: string;
  value: string;
  severity: string;
  status: AlertStatus;
  message: string;
  createdAt: Date | null;
};

export type DashboardMessage = {
  id: string;
  kind: MessageKind;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: Date | null;
};

export type AdminDashboardData = {
  summary: DashboardSummary;
  recentAlerts: DashboardAlert[];
  recentMessages: DashboardMessage[];
};
