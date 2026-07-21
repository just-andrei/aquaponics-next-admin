"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { growerAccountErrorMessage } from "@/lib/growerAccounts";
import type {
  CreateGrowerInput,
  CreateGrowerResult,
  GrowerCollectionName,
} from "@/types/grower";

type GrowerFormDialogProps = {
  collectionName: GrowerCollectionName;
  onClose: () => void;
  onSubmit: (input: CreateGrowerInput) => Promise<CreateGrowerResult>;
};

export function GrowerFormDialog({
  collectionName,
  onClose,
  onSubmit,
}: GrowerFormDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
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
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSavingRef.current) {
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

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !address.trim()
    ) {
      setFormError("Complete all required grower fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        collectionName,
      });
    } catch (error) {
      setFormError(
        growerAccountErrorMessage(
          error,
          "The grower account could not be created.",
        ),
      );
      setIsSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:opacity-70";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-labelledby="create-grower-title"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              New grower account
            </p>
            <h2
              className="mt-1 text-xl font-semibold text-slate-950"
              id="create-grower-title"
            >
              Add new grower
            </h2>
          </div>
          <button
            aria-label="Close add-grower form"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              First name <span className="text-red-600">*</span>
              <input
                autoComplete="given-name"
                className={inputClass}
                disabled={isSaving}
                maxLength={80}
                onChange={(event) => setFirstName(event.target.value)}
                required
                value={firstName}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Last name <span className="text-red-600">*</span>
              <input
                autoComplete="family-name"
                className={inputClass}
                disabled={isSaving}
                maxLength={80}
                onChange={(event) => setLastName(event.target.value)}
                required
                value={lastName}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Email address <span className="text-red-600">*</span>
            <input
              autoComplete="email"
              className={inputClass}
              disabled={isSaving}
              inputMode="email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number <span className="text-red-600">*</span>
            <input
              autoComplete="tel"
              className={inputClass}
              disabled={isSaving}
              inputMode="tel"
              maxLength={40}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              type="tel"
              value={phoneNumber}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Address <span className="text-red-600">*</span>
            <textarea
              autoComplete="street-address"
              className={`${inputClass} min-h-24 resize-y`}
              disabled={isSaving}
              maxLength={300}
              onChange={(event) => setAddress(event.target.value)}
              required
              value={address}
            />
          </label>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-xs leading-5 text-slate-700">
            The account will be active with the grower role and saved under
            <span className="font-semibold"> {collectionName}/&#123;uid&#125;</span>.
            A password-reset email will be requested after creation.
          </div>

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
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Creating..." : "Create grower"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
