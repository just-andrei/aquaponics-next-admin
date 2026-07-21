"use client";

import { useState, type FormEvent } from "react";
import { initializeFirebaseClientServices, isFirebaseConfigured } from "@/lib/firebase";
import { createInquirySubmission } from "@/lib/publicSubmissions";
import type { InquirySubmissionDraft } from "@/types/publicSubmission";

const inquiryOptions = [
  "Plant Only",
  "Aquaculture Only",
  "Full Aquaponics Setup",
  "Custom System Consultation",
  "IoT Monitoring System",
  "Bulk Order",
];

const budgetOptions = ["PHP 10,000-PHP 50,000", "PHP 50,000-PHP 100,000", "PHP 100,000+"];

const initialForm: InquirySubmissionDraft = {
  name: "",
  email: "",
  contactNumber: "",
  companyName: "",
  location: "",
  inquiryType: "",
  farmSizeSqm: "",
  setupLocation: "Indoor",
  budgetRange: "",
  preferredSetupDate: "",
  message: "",
};

type InquiryErrors = Partial<Record<keyof InquirySubmissionDraft, string>>;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40 dark:disabled:bg-slate-900";

function validate(form: InquirySubmissionDraft) {
  const errors: InquiryErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  else if (form.name.trim().length > 120) errors.name = "Use 120 characters or fewer.";
  if (!form.email.trim()) errors.email = "Email address is required.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";

  const contactLength = form.contactNumber.replace(/[^0-9+]/g, "").length;
  if (!form.contactNumber.trim()) errors.contactNumber = "Contact number is required.";
  else if (contactLength < 10) errors.contactNumber = "Enter a valid contact number.";
  else if (form.contactNumber.trim().length > 32) errors.contactNumber = "Use 32 characters or fewer.";

  if (form.companyName.trim().length > 160) errors.companyName = "Use 160 characters or fewer.";
  if (!form.location.trim()) errors.location = "Location or address is required.";
  else if (form.location.trim().length > 240) errors.location = "Use 240 characters or fewer.";
  if (!form.inquiryType) errors.inquiryType = "Inquiry type is required.";

  if (form.farmSizeSqm.trim()) {
    const farmSize = Number(form.farmSizeSqm);
    if (!Number.isFinite(farmSize) || farmSize < 0) errors.farmSizeSqm = "Enter a non-negative farm size.";
    else if (form.farmSizeSqm.trim().length > 40) errors.farmSizeSqm = "Use 40 characters or fewer.";
  }
  if (form.message.trim().length > 4000) errors.message = "Use 4,000 characters or fewer.";
  return errors;
}

export function InquiryForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function updateField<K extends keyof InquirySubmissionDraft>(
    field: K,
    value: InquirySubmissionDraft[K],
  ) {
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
      setResult({ tone: "error", message: "The inquiry form is temporarily unavailable. Please try again later." });
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      await createInquirySubmission(db, form);
      setForm(initialForm);
      setErrors({});
      setResult({ tone: "success", message: "Your inquiry has been submitted successfully." });
    } catch {
      setResult({ tone: "error", message: "Your inquiry could not be submitted. Please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const minimumDate = new Date().toISOString().slice(0, 10);

  return (
    <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7" noValidate onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Inquiry details</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Tell us about your planned setup</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Required fields are marked with an asterisk. Optional details help administrators understand the request.</p>
      </div>

      {result ? (
        <div aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${result.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"}`} role={result.tone === "error" ? "alert" : "status"}>
          {result.message}
        </div>
      ) : null}

      <fieldset className="mt-7">
        <legend className="text-base font-bold text-slate-950 dark:text-white">Basic information</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="inquiry-name">
            Full name <span className="text-red-600" aria-hidden="true">*</span>
            <input aria-describedby={errors.name ? "inquiry-name-error" : undefined} aria-invalid={Boolean(errors.name)} autoComplete="name" className={fieldClasses} disabled={isSubmitting} id="inquiry-name" maxLength={120} onChange={(event) => updateField("name", event.target.value)} required value={form.name} />
            {errors.name ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-name-error">{errors.name}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="inquiry-email">
            Email address <span className="text-red-600" aria-hidden="true">*</span>
            <input aria-describedby={errors.email ? "inquiry-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={fieldClasses} disabled={isSubmitting} id="inquiry-email" maxLength={254} onChange={(event) => updateField("email", event.target.value)} required type="email" value={form.email} />
            {errors.email ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-email-error">{errors.email}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="inquiry-contact">
            Contact number <span className="text-red-600" aria-hidden="true">*</span>
            <input aria-describedby={errors.contactNumber ? "inquiry-contact-error" : undefined} aria-invalid={Boolean(errors.contactNumber)} autoComplete="tel" className={fieldClasses} disabled={isSubmitting} id="inquiry-contact" maxLength={32} onChange={(event) => updateField("contactNumber", event.target.value)} required type="tel" value={form.contactNumber} />
            {errors.contactNumber ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-contact-error">{errors.contactNumber}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="inquiry-company">
            Company name <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
            <input aria-describedby={errors.companyName ? "inquiry-company-error" : undefined} aria-invalid={Boolean(errors.companyName)} autoComplete="organization" className={fieldClasses} disabled={isSubmitting} id="inquiry-company" maxLength={160} onChange={(event) => updateField("companyName", event.target.value)} value={form.companyName} />
            {errors.companyName ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-company-error">{errors.companyName}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2" htmlFor="inquiry-location">
            Location or address <span className="text-red-600" aria-hidden="true">*</span>
            <input aria-describedby={errors.location ? "inquiry-location-error" : undefined} aria-invalid={Boolean(errors.location)} autoComplete="street-address" className={fieldClasses} disabled={isSubmitting} id="inquiry-location" maxLength={240} onChange={(event) => updateField("location", event.target.value)} required value={form.location} />
            {errors.location ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-location-error">{errors.location}</span> : null}
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-8 border-t border-slate-200 pt-7 dark:border-slate-800">
        <legend className="text-base font-bold text-slate-950 dark:text-white">System requirements</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2" htmlFor="inquiry-type">
            Inquiry type <span className="text-red-600" aria-hidden="true">*</span>
            <select aria-describedby={errors.inquiryType ? "inquiry-type-error" : undefined} aria-invalid={Boolean(errors.inquiryType)} className={fieldClasses} disabled={isSubmitting} id="inquiry-type" onChange={(event) => updateField("inquiryType", event.target.value)} required value={form.inquiryType}>
              <option value="">Select an inquiry type</option>
              {inquiryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {errors.inquiryType ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="inquiry-type-error">{errors.inquiryType}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="farm-size">
            Estimated farm size in sqm <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
            <input aria-describedby={errors.farmSizeSqm ? "farm-size-error" : undefined} aria-invalid={Boolean(errors.farmSizeSqm)} className={fieldClasses} disabled={isSubmitting} id="farm-size" inputMode="decimal" onChange={(event) => updateField("farmSizeSqm", event.target.value)} placeholder="Example: 120" value={form.farmSizeSqm} />
            {errors.farmSizeSqm ? <span className="mt-1.5 block text-xs font-medium text-red-700 dark:text-red-300" id="farm-size-error">{errors.farmSizeSqm}</span> : null}
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="budget-range">
            Budget range <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
            <select className={fieldClasses} disabled={isSubmitting} id="budget-range" onChange={(event) => updateField("budgetRange", event.target.value)} value={form.budgetRange}>
              <option value="">Not specified</option>
              {budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Setup location</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(["Indoor", "Outdoor"] as const).map((location) => (
                <label className={`flex min-w-32 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${form.setupLocation === location ? "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-100" : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}`} key={location}>
                  <input checked={form.setupLocation === location} disabled={isSubmitting} name="setup-location" onChange={() => updateField("setupLocation", location)} type="radio" value={location} />
                  {location}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2" htmlFor="preferred-date">
            Preferred setup date <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
            <input className={fieldClasses} disabled={isSubmitting} id="preferred-date" min={minimumDate} onChange={(event) => updateField("preferredSetupDate", event.target.value)} type="date" value={form.preferredSetupDate} />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-8 border-t border-slate-200 pt-7 dark:border-slate-800">
        <legend className="text-base font-bold text-slate-950 dark:text-white">Additional details</legend>
        <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="inquiry-message">
          Message or special request <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
          <textarea aria-describedby={errors.message ? "inquiry-message-error" : undefined} aria-invalid={Boolean(errors.message)} className={fieldClasses} disabled={isSubmitting} id="inquiry-message" maxLength={4000} onChange={(event) => updateField("message", event.target.value)} rows={6} value={form.message} />
          <span className="mt-1.5 flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{errors.message ? <span className="font-medium text-red-700 dark:text-red-300" id="inquiry-message-error">{errors.message}</span> : "Optional"}</span>
            <span>{form.message.length}/4,000</span>
          </span>
        </label>
      </fieldset>

      <button className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting inquiry..." : "Submit Inquiry"}
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Submission occurs only when you select Submit Inquiry.</p>
    </form>
  );
}
