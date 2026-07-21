"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ISSUE_REPORT_CATEGORIES,
  ISSUE_REPORT_PRIORITIES,
  type IssueReport,
  type IssueReportCategory,
  type IssueReportGrower,
  type IssueReportInput,
  type IssueReportPriority,
} from "@/types/issueReport";

type IssueReportFormDialogProps = {
  mode: "create" | "edit";
  report?: IssueReport;
  growers: IssueReportGrower[];
  onClose: () => void;
  onSubmit: (input: IssueReportInput) => Promise<void>;
};

function validCategory(value: string): IssueReportCategory {
  return ISSUE_REPORT_CATEGORIES.includes(value as IssueReportCategory)
    ? (value as IssueReportCategory)
    : ISSUE_REPORT_CATEGORIES[0];
}

function validPriority(value: string): IssueReportPriority {
  return ISSUE_REPORT_PRIORITIES.includes(value as IssueReportPriority)
    ? (value as IssueReportPriority)
    : ISSUE_REPORT_PRIORITIES[1];
}

function readableError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "The issue report could not be saved.";
}

export function IssueReportFormDialog({
  mode,
  report,
  growers,
  onClose,
  onSubmit,
}: IssueReportFormDialogProps) {
  const initialGrowerUid = useMemo(() => {
    if (!report) return "";
    return (
      growers.find(
        (grower) =>
          grower.uid === report.userUid || grower.userId === report.userId,
      )?.uid ?? ""
    );
  }, [growers, report]);
  const [title, setTitle] = useState(report?.title ?? "");
  const [description, setDescription] = useState(report?.description ?? "");
  const [category, setCategory] = useState<IssueReportCategory>(
    validCategory(report?.category ?? ""),
  );
  const [priority, setPriority] = useState<IssueReportPriority>(
    validPriority(report?.priority ?? ""),
  );
  const [growerUid, setGrowerUid] = useState(initialGrowerUid);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isSavingRef = useRef(isSaving);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialogElement = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const initialFocusable = dialogElement?.querySelector<HTMLElement>(
      focusableSelector,
    );
    (initialFocusable ?? dialogElement)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSavingRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogElement) return;

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !growerUid) {
      setFormError("Complete the title, description, and grower fields.");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        growerUid,
      });
    } catch (error) {
      setFormError(readableError(error));
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-labelledby="issue-report-dialog-title"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              {report ? `Issue #${report.displayId}` : "New farmer issue"}
            </p>
            <h2
              className="mt-1 text-xl font-semibold text-slate-950"
              id="issue-report-dialog-title"
            >
              {mode === "create" ? "Create issue report" : "Edit issue report"}
            </h2>
          </div>
          <button
            aria-label="Close issue report form"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
          {formError ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Grower <span className="text-red-600">*</span>
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              disabled={isSaving}
              onChange={(event) => setGrowerUid(event.target.value)}
              required
              value={growerUid}
            >
              <option value="">Select a grower</option>
              {growers.map((grower) => (
                <option key={grower.uid} value={grower.uid}>
                  {grower.userId} - {grower.name}
                  {grower.email ? ` (${grower.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Title <span className="text-red-600">*</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              disabled={isSaving}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Category <span className="text-red-600">*</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                disabled={isSaving}
                onChange={(event) =>
                  setCategory(event.target.value as IssueReportCategory)
                }
                required
                value={category}
              >
                {ISSUE_REPORT_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Priority <span className="text-red-600">*</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                disabled={isSaving}
                onChange={(event) =>
                  setPriority(event.target.value as IssueReportPriority)
                }
                required
                value={priority}
              >
                {ISSUE_REPORT_PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description <span className="text-red-600">*</span>
            <textarea
              className="mt-1.5 min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              disabled={isSaving}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              required
              value={description}
            />
          </label>

          <p className="text-xs leading-5 text-slate-500">
            Saving only updates the stored issue report. It does not trigger any
            hardware or ESP32 action.
          </p>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || growers.length === 0}
              type="submit"
            >
              {isSaving
                ? "Saving..."
                : mode === "create"
                  ? "Create report"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
