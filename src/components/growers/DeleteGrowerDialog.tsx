"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { growerAccountErrorMessage } from "@/lib/growerAccounts";
import type { DeleteGrowerResult, Grower } from "@/types/grower";

type DeleteGrowerDialogProps = {
  grower: Grower;
  onClose: () => void;
  onConfirm: (confirmation: string) => Promise<DeleteGrowerResult>;
};

export function DeleteGrowerDialog({
  grower,
  onClose,
  onConfirm,
}: DeleteGrowerDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const isDeletingRef = useRef(isDeleting);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isDeletingRef.current = isDeleting;
  }, [isDeleting]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    inputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeletingRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
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
    if (confirmation.trim() !== "DELETE") {
      setFormError("Type DELETE exactly to confirm this permanent action.");
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(confirmation.trim());
    } catch (error) {
      setFormError(
        growerAccountErrorMessage(
          error,
          "The grower account could not be deleted.",
        ),
      );
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-describedby="delete-grower-description"
        aria-labelledby="delete-grower-title"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div className="border-b border-red-100 bg-red-50/70 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
            Permanent account deletion
          </p>
          <h2
            className="mt-1 text-xl font-semibold text-slate-950"
            id="delete-grower-title"
          >
            Delete {grower.name}?
          </h2>
        </div>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
          <div
            className="space-y-3 text-sm leading-6 text-slate-700"
            id="delete-grower-description"
          >
            <p>
              This permanently removes the Firebase sign-in account, the
              <span className="font-semibold"> {grower.sourceCollection}/&#123;uid&#125;</span>
              profile, assigned systems, and every nested monitoring, harvest,
              plant, and aquaculture record.
            </p>
            <p>
              Environmental alerts and active/resolved issue reports are retained
              as administrative audit records. This action cannot be undone.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-semibold text-slate-900">{grower.name}</p>
              <p className="break-all text-xs text-slate-600">
                {grower.email || grower.uid}
              </p>
            </div>
          </div>

          {formError ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Type <span className="font-bold text-red-700">DELETE</span> to confirm
            <input
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:opacity-70"
              disabled={isDeleting}
              onChange={(event) => setConfirmation(event.target.value)}
              ref={inputRef}
              spellCheck={false}
              value={confirmation}
            />
          </label>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting || confirmation.trim() !== "DELETE"}
              type="submit"
            >
              {isDeleting ? "Deleting account..." : "Delete grower permanently"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
