import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { firestoreCollections } from "@/types/firestore";
import type {
  ContactSubmissionDraft,
  InquirySubmissionDraft,
} from "@/types/publicSubmission";

export async function createContactSubmission(
  firestore: Firestore,
  draft: ContactSubmissionDraft,
) {
  await addDoc(collection(firestore, firestoreCollections.contactSubmissions), {
    name: draft.name.trim(),
    email: draft.email.trim(),
    subject: draft.subject.trim(),
    message: draft.message.trim(),
    createdAt: serverTimestamp(),
    status: "new",
    source: "web",
  });
}

export async function createInquirySubmission(
  firestore: Firestore,
  draft: InquirySubmissionDraft,
) {
  const preferredSetupDate = draft.preferredSetupDate
    ? Timestamp.fromDate(new Date(`${draft.preferredSetupDate}T12:00:00`))
    : null;

  await addDoc(collection(firestore, firestoreCollections.inquirySubmissions), {
    name: draft.name.trim(),
    email: draft.email.trim(),
    contactNumber: draft.contactNumber.trim(),
    companyName: draft.companyName.trim(),
    location: draft.location.trim(),
    inquiryType: draft.inquiryType,
    farmSizeSqm: draft.farmSizeSqm.trim(),
    setupLocation: draft.setupLocation,
    budgetRange: draft.budgetRange || null,
    preferredSetupDate,
    message: draft.message.trim(),
    createdAt: serverTimestamp(),
    status: "new",
    source: "web",
  });
}
