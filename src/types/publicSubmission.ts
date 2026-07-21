export type ContactSubmissionDraft = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type InquirySubmissionDraft = {
  name: string;
  email: string;
  contactNumber: string;
  companyName: string;
  location: string;
  inquiryType: string;
  farmSizeSqm: string;
  setupLocation: "Indoor" | "Outdoor";
  budgetRange: string;
  preferredSetupDate: string;
  message: string;
};
