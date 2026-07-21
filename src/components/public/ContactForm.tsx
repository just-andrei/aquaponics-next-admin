"use client";

import { useState, type FormEvent } from "react";
import { initializeFirebaseClientServices, isFirebaseConfigured } from "@/lib/firebase";
import { createContactSubmission } from "@/lib/publicSubmissions";
import type { ContactSubmissionDraft } from "@/types/publicSubmission";

const initialForm: ContactSubmissionDraft = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40 dark:disabled:bg-slate-900";

function validate(form: ContactSubmissionDraft) {
  const errors: Partial<Record<keyof ContactSubmissionDraft, string>> = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  else if (form.name.trim().length > 120) errors.name = "Use 120 characters or fewer.";
  if (!form.email.trim()) errors.email = "Email address is required.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.subject.trim()) errors.subject = "Subject is required.";
  else if (form.subject.trim().length > 160) errors.subject = "Use 160 characters or fewer.";
  if (!form.message.trim()) errors.message = "Message is required.";
  else if (form.message.trim().length > 4000) errors.message = "Use 4,000 characters or fewer.";
  return errors;
}

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactSubmissionDraft, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function updateField(field: keyof ContactSubmissionDraft, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setResult({ tone: "error", message: "Please correct the highlighted fields." });
      return;
    }

    const { db } = initializeFirebaseClientServices();
    if (!isFirebaseConfigured || !db) {
      setResult({ tone: "error", message: "The contact form is temporarily unavailable. Please try again later." });
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      await createContactSubmission(db, form);
      setForm(initialForm);
      setErrors({});
      setResult({ tone: "success", message: "Your message has been submitted successfully." });
    } catch {
      setResult({ tone: "error", message: "Your message could not be submitted. Please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7" noValidate onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Send us a message</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Tell us what you need and we will review your message.</p>

      {result ? (
        <div
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${result.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"}`}
          role={result.tone === "error" ? "alert" : "status"}
        >
          {result.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="contact-name">
          Full name <span className="text-red-600" aria-hidden="true">*</span>
          <input aria-describedby={errors.name ? "contact-name-error" : undefined} aria-invalid={Boolean(errors.name)} autoComplete="name" className={fieldClasses} disabled={isSubmitting} id="contact-name" maxLength={120} onChange={(event) => updateField("name", event.target.value)} required value={form.name} />
          {errors.name ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="contact-name-error">{errors.name}</span> : null}
        </label>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="contact-email">
          Email address <span className="text-red-600" aria-hidden="true">*</span>
          <input aria-describedby={errors.email ? "contact-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={fieldClasses} disabled={isSubmitting} id="contact-email" maxLength={254} onChange={(event) => updateField("email", event.target.value)} required type="email" value={form.email} />
          {errors.email ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="contact-email-error">{errors.email}</span> : null}
        </label>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="contact-subject">
          Subject <span className="text-red-600" aria-hidden="true">*</span>
          <input aria-describedby={errors.subject ? "contact-subject-error" : undefined} aria-invalid={Boolean(errors.subject)} className={fieldClasses} disabled={isSubmitting} id="contact-subject" maxLength={160} onChange={(event) => updateField("subject", event.target.value)} required value={form.subject} />
          {errors.subject ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="contact-subject-error">{errors.subject}</span> : null}
        </label>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="contact-message">
          Message <span className="text-red-600" aria-hidden="true">*</span>
          <textarea aria-describedby={errors.message ? "contact-message-error" : undefined} aria-invalid={Boolean(errors.message)} className={fieldClasses} disabled={isSubmitting} id="contact-message" maxLength={4000} onChange={(event) => updateField("message", event.target.value)} required rows={6} value={form.message} />
          <span className="mt-1.5 flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{errors.message ? <span className="font-medium text-red-700 dark:text-red-300" id="contact-message-error">{errors.message}</span> : "Required"}</span>
            <span>{form.message.length}/4,000</span>
          </span>
        </label>
      </div>

      <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending message..." : "Send Message"}
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Submission occurs only when you select Send Message.</p>
    </form>
  );
}
