import { SummaryCard } from "@/components/ui/SummaryCard";
import type { IssueReport } from "@/types/issueReport";

type IssueReportSummaryCardsProps = {
  activeReports: IssueReport[];
  resolvedReports: IssueReport[];
};

export function IssueReportSummaryCards({
  activeReports,
  resolvedReports,
}: IssueReportSummaryCardsProps) {
  return (
    <section aria-labelledby="issue-report-summary-heading">
      <div>
        <h2
          className="text-lg font-semibold text-slate-950"
          id="issue-report-summary-heading"
        >
          Issue Report Summary
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Current farmer-reported system concerns and resolved history.
        </p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SummaryCard
          helper="Waiting for admin follow-up"
          label="Unresolved issues"
          tone="danger"
          value={activeReports.length}
        />
        <SummaryCard
          helper="Archived in ticket history"
          label="Resolved issues"
          tone="success"
          value={resolvedReports.length}
        />
      </div>
    </section>
  );
}
