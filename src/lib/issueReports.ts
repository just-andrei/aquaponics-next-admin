import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestoreCollections } from "@/types/firestore";
import type {
  IssueReport,
  IssueReportGrower,
  IssueReportInput,
  IssueReportsData,
} from "@/types/issueReport";

function readString(data: DocumentData, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000);
  }
  return null;
}

function readPositiveInteger(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? ""));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readSequentialLegacyNumber(value: unknown) {
  const parsed = readPositiveInteger(value);
  return parsed !== null && parsed <= 999_999_999 ? parsed : null;
}

function mapGrower(
  document: QueryDocumentSnapshot<DocumentData>,
): IssueReportGrower {
  const data = document.data();
  const firstName = readString(data, ["first_name", "firstName"]);
  const lastName = readString(data, ["last_name", "lastName"]);
  const email = readString(data, ["email"]);
  const directName = readString(data, ["name", "displayName", "display_name"]);

  return {
    uid: document.id,
    userId: readString(data, ["user_id", "userId"], document.id),
    name:
      directName ||
      `${firstName} ${lastName}`.trim() ||
      email ||
      `Grower ${document.id}`,
    email,
    firstName,
    lastName,
  };
}

async function loadGrowers(firestore: Firestore) {
  const primarySnapshot = await getDocs(
    collection(firestore, firestoreCollections.growers),
  );
  const selectedSnapshot = primarySnapshot.empty
    ? await getDocs(collection(firestore, firestoreCollections.growersLegacy))
    : primarySnapshot;

  return selectedSnapshot.docs
    .map(mapGrower)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function createGrowerLookup(growers: IssueReportGrower[]) {
  const lookup = new Map<string, IssueReportGrower>();
  for (const grower of growers) {
    lookup.set(grower.uid, grower);
    lookup.set(grower.userId, grower);
  }
  return lookup;
}

function mapIssueReport(
  document: QueryDocumentSnapshot<DocumentData>,
  growersById: Map<string, IssueReportGrower>,
  fallbackStatus: "Open" | "Resolved",
): IssueReport {
  const data = document.data();
  const userId = readString(data, ["user_id", "userId"]);
  const userUid = readString(data, ["user_uid", "userUid"]);
  const grower = growersById.get(userUid) ?? growersById.get(userId);
  const firstName = readString(data, ["first_name", "firstName"]);
  const lastName = readString(data, ["last_name", "lastName"]);
  const ticketNumber = readPositiveInteger(data.ticketNumber);
  const legacyTicketId = readString(data, ["ticket_id", "ticketId"]);
  const subject = readString(data, ["subject"]);

  return {
    id: document.id,
    displayId: String(ticketNumber ?? (legacyTicketId || document.id)),
    ticketNumber,
    legacyTicketId,
    title: readString(data, ["title"], subject || "Untitled issue"),
    subject,
    description: readString(data, ["description", "message"], "No description provided."),
    category: readString(data, ["category"], "Uncategorized"),
    priority: readString(data, ["priority"], "Normal"),
    status: readString(data, ["status"], fallbackStatus),
    userId: grower?.userId || userId || "",
    userUid: grower?.uid || userUid || "",
    reportedBy:
      grower?.name ||
      readString(data, ["reported_by", "reportedBy"]) ||
      `${firstName} ${lastName}`.trim() ||
      "Unknown grower",
    email: grower?.email || readString(data, ["email"]) || "",
    reportedAt: readDate(data.reported_at ?? data.reportedAt),
    createdAt: readDate(data.created_at ?? data.createdAt),
    updatedAt: readDate(data.updated_at ?? data.updatedAt),
    resolvedAt: readDate(data.resolved_at ?? data.resolvedAt),
  };
}

function reportTime(report: IssueReport, resolved: boolean) {
  const date = resolved
    ? report.resolvedAt ?? report.updatedAt ?? report.reportedAt ?? report.createdAt
    : report.reportedAt ?? report.createdAt ?? report.updatedAt;
  return date?.getTime() ?? Number.NEGATIVE_INFINITY;
}

function newestFirst(reports: IssueReport[], resolved: boolean) {
  return reports.sort((a, b) => reportTime(b, resolved) - reportTime(a, resolved));
}

function calculateNextTicketNumber(reports: IssueReport[]) {
  const assignedNumbers = reports
    .map(
      (report) =>
        report.ticketNumber ?? readSequentialLegacyNumber(report.legacyTicketId),
    )
    .filter((value): value is number => value !== null);
  return assignedNumbers.length > 0 ? Math.max(...assignedNumbers) + 1 : 1;
}

export async function loadIssueReports(
  firestore: Firestore,
): Promise<IssueReportsData> {
  const [activeSnapshot, historySnapshot, growers] = await Promise.all([
    getDocs(collection(firestore, firestoreCollections.supportTickets)),
    getDocs(collection(firestore, firestoreCollections.ticketHistory)),
    loadGrowers(firestore),
  ]);
  return buildIssueReports(activeSnapshot.docs, historySnapshot.docs, growers);
}

function buildIssueReports(
  activeDocuments: QueryDocumentSnapshot<DocumentData>[],
  historyDocuments: QueryDocumentSnapshot<DocumentData>[],
  growers: IssueReportGrower[],
): IssueReportsData {
  const growersById = createGrowerLookup(growers);
  const activeReports = newestFirst(
    activeDocuments.map((document) =>
      mapIssueReport(document, growersById, "Open"),
    ),
    false,
  );
  const resolvedReports = newestFirst(
    historyDocuments
      .map((document) => mapIssueReport(document, growersById, "Resolved"))
      .filter((report) => report.status.toLowerCase() === "resolved"),
    true,
  );

  return {
    activeReports,
    resolvedReports,
    growers,
    nextTicketNumber: calculateNextTicketNumber([
      ...activeReports,
      ...resolvedReports,
    ]),
  };
}

export function subscribeToIssueReports(
  firestore: Firestore,
  onData: (data: IssueReportsData) => void,
  onError: (error: Error) => void,
) {
  let activeDocuments: QueryDocumentSnapshot<DocumentData>[] = [];
  let historyDocuments: QueryDocumentSnapshot<DocumentData>[] = [];
  let primaryGrowerDocuments: QueryDocumentSnapshot<DocumentData>[] = [];
  let legacyGrowerDocuments: QueryDocumentSnapshot<DocumentData>[] = [];
  let activeReady = false;
  let historyReady = false;
  let primaryGrowersReady = false;
  let legacyGrowersReady = false;

  function emitWhenReady() {
    if (
      !activeReady ||
      !historyReady ||
      !primaryGrowersReady ||
      !legacyGrowersReady
    ) {
      return;
    }
    const selectedGrowerDocuments =
      primaryGrowerDocuments.length > 0
        ? primaryGrowerDocuments
        : legacyGrowerDocuments;
    const growers = selectedGrowerDocuments
      .map(mapGrower)
      .sort((a, b) => a.name.localeCompare(b.name));
    onData(buildIssueReports(activeDocuments, historyDocuments, growers));
  }

  const reportError = (error: Error) => onError(error);
  const unsubscribers = [
    onSnapshot(
      collection(firestore, firestoreCollections.supportTickets),
      (snapshot) => {
        activeDocuments = snapshot.docs;
        activeReady = true;
        emitWhenReady();
      },
      reportError,
    ),
    onSnapshot(
      collection(firestore, firestoreCollections.ticketHistory),
      (snapshot) => {
        historyDocuments = snapshot.docs;
        historyReady = true;
        emitWhenReady();
      },
      reportError,
    ),
    onSnapshot(
      collection(firestore, firestoreCollections.growers),
      (snapshot) => {
        primaryGrowerDocuments = snapshot.docs;
        primaryGrowersReady = true;
        emitWhenReady();
      },
      reportError,
    ),
    onSnapshot(
      collection(firestore, firestoreCollections.growersLegacy),
      (snapshot) => {
        legacyGrowerDocuments = snapshot.docs;
        legacyGrowersReady = true;
        emitWhenReady();
      },
      reportError,
    ),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}

function selectedGrower(
  growers: IssueReportGrower[],
  growerUid: string,
) {
  const grower = growers.find((candidate) => candidate.uid === growerUid);
  if (!grower) throw new Error("Select a valid grower before saving the report.");
  return grower;
}

function editablePayload(input: IssueReportInput, grower: IssueReportGrower) {
  return {
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    priority: input.priority,
    status: "Open",
    user_id: grower.userId,
    reported_by: grower.name,
    updated_at: serverTimestamp(),
  };
}

function optionalGrowerIdentity(grower: IssueReportGrower) {
  if (grower.isFallback) return {};
  return {
    user_uid: grower.uid,
    ...(grower.email ? { email: grower.email } : {}),
    ...(grower.firstName ? { first_name: grower.firstName } : {}),
    ...(grower.lastName ? { last_name: grower.lastName } : {}),
  };
}

async function loadLatestTicketNumber(firestore: Firestore) {
  const [activeSnapshot, historySnapshot] = await Promise.all([
    getDocs(collection(firestore, firestoreCollections.supportTickets)),
    getDocs(collection(firestore, firestoreCollections.ticketHistory)),
  ]);
  const numbers = [...activeSnapshot.docs, ...historySnapshot.docs]
    .map((document) => {
      const data = document.data();
      return (
        readPositiveInteger(data.ticketNumber) ??
        readSequentialLegacyNumber(data.ticket_id ?? data.ticketId)
      );
    })
    .filter((value): value is number => value !== null);
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

export async function createIssueReport(
  firestore: Firestore,
  input: IssueReportInput,
  growers: IssueReportGrower[],
) {
  const grower = selectedGrower(growers, input.growerUid);
  const observedNextTicketNumber = await loadLatestTicketNumber(firestore);
  const counterRef = doc(
    firestore,
    firestoreCollections.configuration,
    "support_ticket_counter",
  );
  const reportRef = doc(
    collection(firestore, firestoreCollections.supportTickets),
  );

  return runTransaction(firestore, async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);
    const storedNextTicketNumber = readPositiveInteger(
      counterSnapshot.data()?.nextTicketNumber,
    );
    const nextTicketNumber = Math.max(
      observedNextTicketNumber,
      storedNextTicketNumber ?? 1,
    );

    transaction.set(
      counterRef,
      {
        nextTicketNumber: nextTicketNumber + 1,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(reportRef, {
      ...editablePayload(input, grower),
      ...optionalGrowerIdentity(grower),
      ticket_id: String(nextTicketNumber),
      ticketNumber: nextTicketNumber,
      reported_at: serverTimestamp(),
      created_at: serverTimestamp(),
    });
    return nextTicketNumber;
  });
}

export async function updateIssueReport(
  firestore: Firestore,
  reportId: string,
  input: IssueReportInput,
  growers: IssueReportGrower[],
) {
  const grower = selectedGrower(growers, input.growerUid);
  await updateDoc(
    doc(firestore, firestoreCollections.supportTickets, reportId),
    {
      ...editablePayload(input, grower),
      ...optionalGrowerIdentity(grower),
    },
  );
}

export async function resolveIssueReport(
  firestore: Firestore,
  reportId: string,
) {
  const sourceRef = doc(
    firestore,
    firestoreCollections.supportTickets,
    reportId,
  );
  const historyRef = doc(
    firestore,
    firestoreCollections.ticketHistory,
    reportId,
  );
  await runTransaction(firestore, async (transaction) => {
    const sourceSnapshot = await transaction.get(sourceRef);
    if (!sourceSnapshot.exists()) {
      throw new Error("This issue report no longer exists in the active queue.");
    }

    transaction.set(
      historyRef,
      {
        ...sourceSnapshot.data(),
        status: "Resolved",
        resolved_at: serverTimestamp(),
        archived_at: serverTimestamp(),
        archived_from: firestoreCollections.supportTickets,
        original_doc_id: reportId,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    transaction.delete(sourceRef);
  });
}
