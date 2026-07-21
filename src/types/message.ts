export type MessageStatus = "new" | "reviewed" | "resolved";
export type MessageKind = "contact" | "inquiry";
export type MessageCollectionName =
  | "contact_submissions"
  | "inquiry_submissions";

export type InquiryDetails = {
  contactNumber: string;
  companyName: string;
  location: string;
  inquiryType: string;
  farmSizeSqm: string;
  setupLocation: string;
  budgetRange: string;
  preferredSetupDate: Date | null;
};

export type AdminMessage = {
  id: string;
  kind: MessageKind;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: Date | null;
  source: string;
  inquiryDetails: InquiryDetails | null;
};
