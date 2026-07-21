import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IssueReport } from "@/types/issueReport";

type IssueReportCardProps = {
  report: IssueReport;
  isHistory?: boolean;
  isResolving?: boolean;
  onEdit?: () => void;
  onResolve?: () => void;
};

function formatDate(value: Date | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export function IssueReportCard({
  report,
  isHistory = false,
  isResolving = false,
  onEdit,
  onResolve,
}: IssueReportCardProps) {
  const isUrgent = report.priority.toLowerCase() === "urgent";
  const statusIsResolved = report.status.toLowerCase() === "resolved";
  const showSubject =
    report.subject &&
    report.subject.trim().toLowerCase() !== report.title.trim().toLowerCase();

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isUrgent && !isHistory ? "border-red-200" : "border-slate-200/90"
      }`}
    >
      <div
        aria-hidden="true"
        className={`h-1 ${
          statusIsResolved
            ? "bg-emerald-500"
            : isUrgent
              ? "bg-red-500"
              : "bg-cyan-500"
        }`}
      />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Issue #{report.displayId}
            </p>
            <h3 className="mt-1 break-words text-lg font-semibold text-slate-950">
              {report.title}
            </h3>
            {showSubject ? (
              <p className="mt-1 break-words text-sm text-slate-600">
                Subject: {report.subject}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={isUrgent ? "danger" : "info"}>
              {report.priority}
            </StatusBadge>
            <StatusBadge tone={statusIsResolved ? "success" : "warning"}>
              {report.status}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {report.description}
          </p>
        </div>

        <dl className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Detail label="Category" value={report.category} />
          <Detail label="Reported at" value={formatDate(report.reportedAt)} />
          <Detail label="Reported by" value={report.reportedBy} />
          <Detail label="Grower user ID" value={report.userId} />
          {report.email ? <Detail label="Email" value={report.email} /> : null}
          {isHistory ? (
            <Detail label="Resolved at" value={formatDate(report.resolvedAt)} />
          ) : null}
        </dl>

        {!isHistory && onEdit && onResolve ? (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isResolving}
              onClick={onEdit}
              type="button"
            >
              Edit report
            </button>
            <button
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isResolving}
              onClick={onResolve}
              type="button"
            >
              {isResolving ? "Resolving..." : "Mark as resolved"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
