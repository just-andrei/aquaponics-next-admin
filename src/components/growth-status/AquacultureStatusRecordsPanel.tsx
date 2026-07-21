"use client";

import { useEffect, useState, type FormEvent } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createAquacultureStatusRecord,
  loadAquacultureStatusRecords,
  updateAquacultureStatusRecord,
} from "@/lib/growthStatusRecords";
import type {
  AquacultureGrowthStage,
  AquacultureStatusDraft,
  AquacultureStatusRecord,
  AverageWeightUnit,
  BehaviorObservation,
  FeedingObservation,
  GrowthHealthStatus,
  GrowthStatusContext,
} from "@/types/growthStatus";

type Props = { context: GrowthStatusContext };

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100";

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) return String(error.message);
  return fallback;
}

function formatDate(value: Date | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" }).format(value);
}

function dateInputValue(value: Date | null) {
  const date = value ?? new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function healthClasses(status: GrowthHealthStatus) {
  if (status === "critical") return "bg-red-50 text-red-700";
  if (status === "poor") return "bg-red-50 text-red-700";
  if (status === "fair") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

type AquacultureFormProps = {
  initialRecord: AquacultureStatusRecord | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: AquacultureStatusDraft) => Promise<void>;
};

function AquacultureStatusForm({ initialRecord, isSaving, onCancel, onSubmit }: AquacultureFormProps) {
  const [speciesName, setSpeciesName] = useState(initialRecord?.speciesName ?? "");
  const [growthStage, setGrowthStage] = useState<AquacultureGrowthStage>(initialRecord?.growthStage ?? "small");
  const [fishCount, setFishCount] = useState(initialRecord?.fishCount === null || initialRecord?.fishCount === undefined ? "" : String(initialRecord.fishCount));
  const [averageWeightValue, setAverageWeightValue] = useState(initialRecord?.averageWeightValue === null || initialRecord?.averageWeightValue === undefined ? "" : String(initialRecord.averageWeightValue));
  const [averageWeightUnit, setAverageWeightUnit] = useState<AverageWeightUnit>(initialRecord?.averageWeightUnit ?? "g");
  const [healthStatus, setHealthStatus] = useState<GrowthHealthStatus>(initialRecord?.healthStatus ?? "good");
  const [feedingObservation, setFeedingObservation] = useState<FeedingObservation>(initialRecord?.feedingObservation ?? "normal");
  const [behaviorObservation, setBehaviorObservation] = useState<BehaviorObservation>(initialRecord?.behaviorObservation ?? "normal");
  const [recordedAt, setRecordedAt] = useState(dateInputValue(initialRecord?.recordedAt ?? null));
  const [notes, setNotes] = useState(initialRecord?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCount = fishCount.trim() === "" ? null : Number(fishCount);
    const parsedWeight = averageWeightValue.trim() === "" ? null : Number(averageWeightValue);
    if (!speciesName.trim() || !recordedAt) {
      setValidationError("Species name and recorded date are required.");
      return;
    }
    if (parsedCount !== null && (!Number.isInteger(parsedCount) || parsedCount < 0)) {
      setValidationError("Fish count must be empty or a non-negative whole number.");
      return;
    }
    if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 0)) {
      setValidationError("Average weight must be empty or a non-negative number.");
      return;
    }
    setValidationError(null);
    await onSubmit({
      speciesName,
      growthStage,
      fishCount: parsedCount,
      averageWeightValue: parsedWeight,
      averageWeightUnit,
      healthStatus,
      feedingObservation,
      behaviorObservation,
      notes,
      recordedAt: new Date(`${recordedAt}T12:00:00`),
    });
  }

  return (
    <form className="mt-4 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white p-4 shadow-sm sm:p-5" onSubmit={submit}>
      <h6 className="text-sm font-semibold text-slate-950">{initialRecord ? "Edit Aquaculture Status" : "Add Aquaculture Status"}</h6>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Species name <span className="text-red-600">*</span><input className={fieldClasses} onChange={(e) => setSpeciesName(e.target.value)} required value={speciesName} /></label>
        <label className="text-sm font-medium text-slate-700">Growth stage <span className="text-red-600">*</span><select className={fieldClasses} onChange={(e) => setGrowthStage(e.target.value as AquacultureGrowthStage)} value={growthStage}>{(["small", "medium", "large", "harvest_ready"] as AquacultureGrowthStage[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Fish count (optional)<input className={fieldClasses} min="0" onChange={(e) => setFishCount(e.target.value)} step="1" type="number" value={fishCount} /></label>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <label className="text-sm font-medium text-slate-700">Average weight (optional)<input className={fieldClasses} min="0" onChange={(e) => setAverageWeightValue(e.target.value)} step="any" type="number" value={averageWeightValue} /></label>
          <label className="text-sm font-medium text-slate-700">Unit<select className={fieldClasses} onChange={(e) => setAverageWeightUnit(e.target.value as AverageWeightUnit)} value={averageWeightUnit}>{(["g", "kg"] as AverageWeightUnit[]).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        <label className="text-sm font-medium text-slate-700">Health status <span className="text-red-600">*</span><select className={fieldClasses} onChange={(e) => setHealthStatus(e.target.value as GrowthHealthStatus)} value={healthStatus}>{(["good", "fair", "poor", "critical"] as GrowthHealthStatus[]).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Feeding observation<select className={fieldClasses} onChange={(e) => setFeedingObservation(e.target.value as FeedingObservation)} value={feedingObservation}>{(["normal", "low_appetite", "overfeeding_signs", "missed_feeding", "unknown"] as FeedingObservation[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Behavior observation<select className={fieldClasses} onChange={(e) => setBehaviorObservation(e.target.value as BehaviorObservation)} value={behaviorObservation}>{(["normal", "sluggish", "gasping", "hiding", "aggressive", "mortality_observed", "unknown"] as BehaviorObservation[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Recorded date <span className="text-red-600">*</span><input className={fieldClasses} onChange={(e) => setRecordedAt(e.target.value)} required type="date" value={recordedAt} /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes (optional)<textarea className={fieldClasses} onChange={(e) => setNotes(e.target.value)} rows={3} value={notes} /></label>
      </div>
      {validationError ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{validationError}</p> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60" disabled={isSaving} onClick={onCancel} type="button">Cancel</button><button className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Saving..." : initialRecord ? "Update Aquaculture Status" : "Add Aquaculture Status"}</button></div>
    </form>
  );
}

export function AquacultureStatusRecordsPanel({ context }: Props) {
  const [records, setRecords] = useState<AquacultureStatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AquacultureStatusRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      if (!firestore) {
        setLoadError("Firebase is unavailable. Check .env.local and restart the server.");
        setIsLoading(false);
        return;
      }
      try {
        const nextRecords = await loadAquacultureStatusRecords(firestore, context);
        if (!cancelled) {
          setRecords(nextRecords);
          setLoadError(null);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(readableError(error, "Aquaculture status records could not be loaded."));
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [context, refreshKey]);

  function retry() {
    setRecords([]);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  async function save(draft: AquacultureStatusDraft) {
    const firestore = db;
    const adminUid = auth?.currentUser?.uid;
    if (!firestore || !adminUid) {
      setMessage({ tone: "error", text: "An authenticated administrator and Firebase connection are required." });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    setMessage(null);
    try {
      if (editingRecord) await updateAquacultureStatusRecord(firestore, context, editingRecord.id, draft);
      else await createAquacultureStatusRecord(firestore, context, draft, adminUid);
      setMessage({ tone: "success", text: editingRecord ? "Aquaculture status record updated." : "Aquaculture status record added." });
      setEditingRecord(null);
      setIsFormOpen(false);
      setIsLoading(true);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error, "Aquaculture status record could not be saved.") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h5 className="text-sm font-semibold text-slate-950">Aquaculture Status Records</h5><p className="mt-1 break-all text-xs text-slate-500">{context.sourceCollection}/&#123;uid&#125;/systems/{context.systemId}/aquaculture_status_records</p></div>
        {!isFormOpen ? <button className="rounded-xl bg-cyan-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800" onClick={() => { setEditingRecord(null); setMessage(null); setIsFormOpen(true); }} type="button">Add Aquaculture Status</button> : null}
      </div>

      {isFormOpen ? <AquacultureStatusForm initialRecord={editingRecord} isSaving={isSaving} key={editingRecord?.id ?? "new-aquaculture-status"} onCancel={() => { if (!isSaving) { setEditingRecord(null); setIsFormOpen(false); } }} onSubmit={save} /> : null}
      {message ? <p aria-live="polite" className={`mt-3 rounded-md px-3 py-2 text-sm ${message.tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{message.text}</p> : null}

      <div className="mt-4">
        {isLoading ? <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading aquaculture status records...</p> : loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{loadError}</p><button className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 font-semibold hover:bg-red-100" onClick={retry} type="button">Retry aquaculture records</button></div>
        ) : records.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">No aquaculture status records have been added yet.</p> : (
          <div className="space-y-3">
            {records.map((record) => (
              <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300" key={record.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h6 className="text-sm font-semibold text-slate-950">{record.speciesName}</h6><p className="mt-1 text-sm capitalize text-slate-600">{label(record.growthStage)} · {formatDate(record.recordedAt ?? record.createdAt)}</p><div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${healthClasses(record.healthStatus)}`}>{record.healthStatus}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">Feeding: {label(record.feedingObservation)}</span><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold capitalize text-violet-700">Behavior: {label(record.behaviorObservation)}</span></div></div>
                  <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={isSaving} onClick={() => { setEditingRecord(record); setMessage(null); setIsFormOpen(true); }} type="button">Edit</button>
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3"><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Fish count</dt><dd className="mt-0.5">{record.fishCount ?? "Not recorded"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Average weight</dt><dd className="mt-0.5">{record.averageWeightValue === null ? "Not recorded" : `${record.averageWeightValue} ${record.averageWeightUnit}`}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Created by</dt><dd className="mt-0.5 break-all">{record.createdBy || "Not available"}</dd></div></dl>
                {record.notes ? <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{record.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
