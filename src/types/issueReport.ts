export const ISSUE_REPORT_CATEGORIES = [
  "Sensor",
  "Actuator",
  "Fish",
  "Plant",
] as const;

export const ISSUE_REPORT_PRIORITIES = ["Urgent", "Normal"] as const;

export type IssueReportCategory = (typeof ISSUE_REPORT_CATEGORIES)[number];
export type IssueReportPriority = (typeof ISSUE_REPORT_PRIORITIES)[number];

export type IssueReportGrower = {
  uid: string;
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  isFallback?: boolean;
};

export type IssueReport = {
  id: string;
  displayId: string;
  ticketNumber: number | null;
  legacyTicketId: string;
  title: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  userId: string;
  userUid: string;
  reportedBy: string;
  email: string;
  reportedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  resolvedAt: Date | null;
};

export type IssueReportInput = {
  title: string;
  description: string;
  category: IssueReportCategory;
  priority: IssueReportPriority;
  growerUid: string;
};

export type IssueReportsData = {
  activeReports: IssueReport[];
  resolvedReports: IssueReport[];
  growers: IssueReportGrower[];
  nextTicketNumber: number;
};
