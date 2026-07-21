/**
 * Existing Firestore collection names from the Flutter admin app.
 * Keep these values unchanged while features are migrated incrementally.
 */
export const firestoreCollections = {
  admin: "admin",
  growers: "user",
  growersLegacy: "users",
  plants: "plants",
  aquaculture: "aquaculture",
  supportTickets: "support_tickets",
  ticketHistory: "ticket_history",
  masterSets: "master_sets",
  contactSubmissions: "contact_submissions",
  inquirySubmissions: "inquiry_submissions",
  environmentalAlerts: "environmental_alerts",
  notifications: "notifications",
  configuration: "configuration",
} as const;

export const systemSubcollections = {
  systems: "systems",
  weeklyLogs: "weekly_logs",
  harvestRecords: "harvest_records",
  plantStatusRecords: "plant_status_records",
  aquacultureStatusRecords: "aquaculture_status_records",
} as const;

export type FirestoreCollectionName =
  (typeof firestoreCollections)[keyof typeof firestoreCollections];
