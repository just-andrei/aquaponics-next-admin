"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { IssueReportCard } from "@/components/reports/IssueReportCard";
import { IssueReportFormDialog } from "@/components/reports/IssueReportFormDialog";
import { IssueReportSummaryCards } from "@/components/reports/IssueReportSummaryCards";
import { StatePanel } from "@/components/ui/StatePanel";
import { db } from "@/lib/firebase";
import {
  createIssueReport,
  loadIssueReports,
  resolveIssueReport,
  subscribeToIssueReports,
  updateIssueReport,
} from "@/lib/issueReports";
import {
  ISSUE_REPORT_CATEGORIES,
  ISSUE_REPORT_PRIORITIES,
  type IssueReport,
  type IssueReportGrower,
  type IssueReportInput,
  type IssueReportsData,
} from "@/types/issueReport";

type ReportTab = "active" | "history";
type ReportFilters = {
  search: string;
  priority: string;
  category: string;
};
type DialogState =
  | { mode: "create" }
  | { mode: "edit"; report: IssueReport };

const emptyFilters: ReportFilters = {
  search: "",
  priority: "all",
  category: "all",
};

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

function filterReports(reports: IssueReport[], filters: ReportFilters) {
  const query = filters.search.trim().toLowerCase();
  return reports.filter((report) => {
    if (
      filters.priority !== "all" &&
      report.priority.toLowerCase() !== filters.priority.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.category !== "all" &&
      report.category.toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false;
    }
    if (!query) return true;

    return [
      report.displayId,
      report.title,
      report.subject,
      report.description,
      report.reportedBy,
      report.userId,
      report.email,
    ].some((value) => value.toLowerCase().includes(query));
  });
}

function growersForDialog(
  growers: IssueReportGrower[],
  dialog: DialogState | null,
) {
  if (!dialog || dialog.mode !== "edit") return growers;
  const report = dialog.report;
  const alreadyAvailable = growers.some(
    (grower) =>
      grower.uid === report.userUid || grower.userId === report.userId,
  );
  if (alreadyAvailable) return growers;

  return [
    ...growers,
    {
      uid: report.userUid || `legacy-${report.id}`,
      userId: report.userId,
      name: report.reportedBy,
      email: report.email,
      firstName: "",
      lastName: "",
      isFallback: true,
    },
  ];
}

export function AdminReportsPage() {
  const [data, setData] = useState<IssueReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("active");
  const [activeFilters, setActiveFilters] = useState<ReportFilters>(emptyFilters);
  const [historyFilters, setHistoryFilters] =
    useState<ReportFilters>(emptyFilters);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async (showInitialLoading: boolean) => {
    const firestore = db;
    if (showInitialLoading) setIsLoading(true);
    else setIsRefreshing(true);

    if (!firestore) {
      setLoadError(
        "Firebase is unavailable. Check .env.local and restart the development server.",
      );
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const nextData = await loadIssueReports(firestore);
      setData(nextData);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        readableError(error, "System issue reports could not be loaded."),
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const firestore = db;
    if (!firestore) {
      const timer = window.setTimeout(() => {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    return subscribeToIssueReports(
      firestore,
      (nextData) => {
        setData(nextData);
        setLoadError(null);
        setIsLoading(false);
      },
      (error) => {
        setLoadError(
          readableError(error, "System issue reports could not be loaded."),
        );
        setIsLoading(false);
      },
    );
  }, []);

  const selectedFilters =
    activeTab === "active" ? activeFilters : historyFilters;
  const setSelectedFilters =
    activeTab === "active" ? setActiveFilters : setHistoryFilters;
  const selectedReports = useMemo(() => {
    if (!data) return [];
    return filterReports(
      activeTab === "active" ? data.activeReports : data.resolvedReports,
      selectedFilters,
    );
  }, [activeTab, data, selectedFilters]);
  const formGrowers = useMemo(
    () => growersForDialog(data?.growers ?? [], dialog),
    [data?.growers, dialog],
  );

  async function handleFormSubmit(input: IssueReportInput) {
    const firestore = db;
    if (!firestore || !data || !dialog) {
      throw new Error("Firebase report data is unavailable. Refresh and try again.");
    }

    if (dialog.mode === "create") {
      const createdTicketNumber = await createIssueReport(
        firestore,
        input,
        formGrowers,
      );
      setFeedback({
        tone: "success",
        message: `Issue #${createdTicketNumber} was created.`,
      });
    } else {
      await updateIssueReport(
        firestore,
        dialog.report.id,
        input,
        formGrowers,
      );
      setFeedback({ tone: "success", message: "The issue report was updated." });
    }

    setDialog(null);
    await load(false);
  }

  async function handleResolve(report: IssueReport) {
    const firestore = db;
    if (!firestore) return;
    const confirmed = window.confirm(
      `Mark issue #${report.displayId} as resolved? It will move from Active Issues to Resolved History.`,
    );
    if (!confirmed) return;

    setResolvingId(report.id);
    setFeedback(null);
    try {
      await resolveIssueReport(firestore, report.id);
      setFeedback({
        tone: "success",
        message: `Issue #${report.displayId} was moved to resolved history.`,
      });
      await load(false);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: readableError(error, "The issue report could not be resolved."),
      });
    } finally {
      setResolvingId(null);
    }
  }

  function updateFilter(key: keyof ReportFilters, value: string) {
    setSelectedFilters((current) => ({ ...current, [key]: value }));
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab: ReportTab = activeTab === "active" ? "history" : "active";
    setActiveTab(nextTab);
    window.requestAnimationFrame(() => {
      document.getElementById(`${nextTab}-issue-reports-tab`)?.focus();
    });
  }

  if (isLoading) {
    return <StatePanel title="Loading farmer issue reports..." tone="loading" />;
  }

  if (loadError && !data) {
    return (
      <StatePanel
        actionLabel="Retry reports"
        description={loadError}
        onAction={() => void load(true)}
        title="System issue reports could not be loaded"
        tone="error"
      />
    );
  }

  if (!data) return null;

  const sourceCount =
    activeTab === "active"
      ? data.activeReports.length
      : data.resolvedReports.length;

  return (
    <div className="space-y-6">
      <IssueReportSummaryCards
        activeReports={data.activeReports}
        resolvedReports={data.resolvedReports}
      />

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      ) : null}

      {loadError ? (
        <StatePanel
          actionLabel="Retry refresh"
          compact
          description={loadError}
          onAction={() => void load(false)}
          title="The latest report data could not be refreshed"
          tone="error"
        />
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div
            aria-label="Issue report views"
            className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto"
            role="tablist"
          >
            <button
              aria-controls="issue-reports-tabpanel"
              aria-selected={activeTab === "active"}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === "active"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="active-issue-reports-tab"
              onClick={() => setActiveTab("active")}
              onKeyDown={handleTabKeyDown}
              role="tab"
              tabIndex={activeTab === "active" ? 0 : -1}
              type="button"
            >
              Active Issues ({data.activeReports.length})
            </button>
            <button
              aria-controls="issue-reports-tabpanel"
              aria-selected={activeTab === "history"}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === "history"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="history-issue-reports-tab"
              onClick={() => setActiveTab("history")}
              onKeyDown={handleTabKeyDown}
              role="tab"
              tabIndex={activeTab === "history" ? 0 : -1}
              type="button"
            >
              Resolved History ({data.resolvedReports.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRefreshing}
              onClick={() => void load(false)}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={data.growers.length === 0}
              onClick={() => {
                setFeedback(null);
                setDialog({ mode: "create" });
              }}
              title={
                data.growers.length === 0
                  ? "A grower account is required before creating a report."
                  : undefined
              }
              type="button"
            >
              Create issue report
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Search reports
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Grower, ticket number, title, email..."
              type="search"
              value={selectedFilters.search}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Priority
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => updateFilter("priority", event.target.value)}
              value={selectedFilters.priority}
            >
              <option value="all">All priorities</option>
              {ISSUE_REPORT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => updateFilter("category", event.target.value)}
              value={selectedFilters.category}
            >
              <option value="all">All categories</option>
              {ISSUE_REPORT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:px-5">
          <span>
            Showing {selectedReports.length} of {sourceCount} reports
          </span>
          <button
            className="font-semibold text-emerald-700 hover:text-emerald-900"
            onClick={() => setSelectedFilters(emptyFilters)}
            type="button"
          >
            Clear filters
          </button>
        </div>
      </section>

      <div
        aria-labelledby={`${activeTab}-issue-reports-tab`}
        id="issue-reports-tabpanel"
        role="tabpanel"
        tabIndex={0}
      >
        {selectedReports.length === 0 ? (
          <StatePanel
            description={
              sourceCount === 0
                ? activeTab === "active"
                  ? "New farmer-reported system issues will appear here."
                  : "Reports appear here after an administrator marks them as resolved."
                : "Clear or change the current search and filters."
            }
            title={
              sourceCount === 0
                ? activeTab === "active"
                  ? "No active issue reports"
                  : "No resolved issue reports"
                : "No reports match the current filters"
            }
          />
        ) : (
          <section
            aria-label={
              activeTab === "active"
                ? "Active issue reports"
                : "Resolved issue reports"
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {selectedReports.map((report) => (
              <IssueReportCard
                isHistory={activeTab === "history"}
                isResolving={resolvingId === report.id}
                key={report.id}
                onEdit={
                  activeTab === "active"
                    ? () => {
                        setFeedback(null);
                        setDialog({ mode: "edit", report });
                      }
                    : undefined
                }
                onResolve={
                  activeTab === "active"
                    ? () => void handleResolve(report)
                    : undefined
                }
                report={report}
              />
            ))}
          </section>
        )}
      </div>

      {dialog ? (
        <IssueReportFormDialog
          growers={formGrowers}
          key={dialog.mode === "edit" ? dialog.report.id : "new-report"}
          mode={dialog.mode}
          onClose={() => setDialog(null)}
          onSubmit={handleFormSubmit}
          report={dialog.mode === "edit" ? dialog.report : undefined}
        />
      ) : null}
    </div>
  );
}
