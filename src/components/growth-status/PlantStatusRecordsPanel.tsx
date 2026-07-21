"use client";

import { useEffect, useState, type FormEvent } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createPlantStatusRecord,
  loadPlantStatusRecords,
  updatePlantStatusRecord,
} from "@/lib/growthStatusRecords";
import type {
  GrowthHealthStatus,
  GrowthStatusContext,
  PlantGrowthStage,
  PlantHeightUnit,
  PlantLeafCondition,
  PlantStatusDraft,
  PlantStatusRecord,
} from "@/types/growthStatus";

type Props = { context: GrowthStatusContext };

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100";

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

function formatDate(value: Date | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
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

type PlantFormProps = {
  initialRecord: PlantStatusRecord | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: PlantStatusDraft) => Promise<void>;
};

function PlantStatusForm({ initialRecord, isSaving, onCancel, onSubmit }: PlantFormProps) {
  const [plantName, setPlantName] = useState(initialRecord?.plantName ?? "");
  const [growthStage, setGrowthStage] = useState<PlantGrowthStage>(
    initialRecord?.growthStage ?? "seedling",
  );
  const [heightValue, setHeightValue] = useState(
    initialRecord?.heightValue === null || initialRecord?.heightValue === undefined
      ? ""
      : String(initialRecord.heightValue),
  );
  const [heightUnit, setHeightUnit] = useState<PlantHeightUnit>(
    initialRecord?.heightUnit ?? "cm",
  );
  const [leafCondition, setLeafCondition] = useState<PlantLeafCondition>(
    initialRecord?.leafCondition ?? "healthy",
  );
  const [healthStatus, setHealthStatus] = useState<GrowthHealthStatus>(
    initialRecord?.healthStatus ?? "good",
  );
  const [recordedAt, setRecordedAt] = useState(dateInputValue(initialRecord?.recordedAt ?? null));
  const [notes, setNotes] = useState(initialRecord?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedHeight = heightValue.trim() === "" ? null : Number(heightValue);
    if (!plantName.trim() || !recordedAt) {
      setValidationError("Plant name and recorded date are required.");
      return;
    }
    if (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 0)) {
      setValidationError("Height must be empty or a non-negative number.");
      return;
    }
    setValidationError(null);
    await onSubmit({
      plantName,
      growthStage,
      heightValue: parsedHeight,
      heightUnit,
      leafCondition,
      healthStatus,
      notes,
      recordedAt: new Date(`${recordedAt}T12:00:00`),
    });
  }

  return (
    <form className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm sm:p-5" onSubmit={submit}>
      <h6 className="text-sm font-semibold text-slate-950">
        {initialRecord ? "Edit Plant Status" : "Add Plant Status"}
      </h6>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Plant name <span className="text-red-600">*</span>
          <input className={fieldClasses} onChange={(e) => setPlantName(e.target.value)} required value={plantName} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Growth stage <span className="text-red-600">*</span>
          <select className={fieldClasses} onChange={(e) => setGrowthStage(e.target.value as PlantGrowthStage)} value={growthStage}>
            {(["seedling", "vegetative", "mature", "flowering", "ready_to_harvest"] as PlantGrowthStage[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Height (optional)
          <input className={fieldClasses} min="0" onChange={(e) => setHeightValue(e.target.value)} step="any" type="number" value={heightValue} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Height unit
          <select className={fieldClasses} onChange={(e) => setHeightUnit(e.target.value as PlantHeightUnit)} value={heightUnit}>
            {(["cm", "m", "in"] as PlantHeightUnit[]).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Leaf condition
          <select className={fieldClasses} onChange={(e) => setLeafCondition(e.target.value as PlantLeafCondition)} value={leafCondition}>
            {(["healthy", "yellowing", "wilting", "pest_damage", "nutrient_deficiency", "unknown"] as PlantLeafCondition[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Health status <span className="text-red-600">*</span>
          <select className={fieldClasses} onChange={(e) => setHealthStatus(e.target.value as GrowthHealthStatus)} value={healthStatus}>
            {(["good", "fair", "poor", "critical"] as GrowthHealthStatus[]).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Recorded date <span className="text-red-600">*</span>
          <input className={fieldClasses} onChange={(e) => setRecordedAt(e.target.value)} required type="date" value={recordedAt} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Notes (optional)
          <textarea className={fieldClasses} onChange={(e) => setNotes(e.target.value)} rows={3} value={notes} />
        </label>
      </div>
      {validationError ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{validationError}</p> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60" disabled={isSaving} onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Saving..." : initialRecord ? "Update Plant Status" : "Add Plant Status"}</button>
      </div>
    </form>
  );
}

export function PlantStatusRecordsPanel({ context }: Props) {
  const [records, setRecords] = useState<PlantStatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PlantStatusRecord | null>(null);
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
        const nextRecords = await loadPlantStatusRecords(firestore, context);
        if (!cancelled) {
          setRecords(nextRecords);
          setLoadError(null);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(readableError(error, "Plant status records could not be loaded."));
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

  async function save(draft: PlantStatusDraft) {
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
      if (editingRecord) await updatePlantStatusRecord(firestore, context, editingRecord.id, draft);
      else await createPlantStatusRecord(firestore, context, draft, adminUid);
      setMessage({ tone: "success", text: editingRecord ? "Plant status record updated." : "Plant status record added." });
      setEditingRecord(null);
      setIsFormOpen(false);
      setIsLoading(true);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error, "Plant status record could not be saved.") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-slate-950">Plant Status Records</h5>
          <p className="mt-1 break-all text-xs text-slate-500">{context.sourceCollection}/&#123;uid&#125;/systems/{context.systemId}/plant_status_records</p>
        </div>
        {!isFormOpen ? <button className="rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800" onClick={() => { setEditingRecord(null); setMessage(null); setIsFormOpen(true); }} type="button">Add Plant Status</button> : null}
      </div>

      {isFormOpen ? <PlantStatusForm initialRecord={editingRecord} isSaving={isSaving} key={editingRecord?.id ?? "new-plant-status"} onCancel={() => { if (!isSaving) { setEditingRecord(null); setIsFormOpen(false); } }} onSubmit={save} /> : null}
      {message ? <p aria-live="polite" className={`mt-3 rounded-md px-3 py-2 text-sm ${message.tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{message.text}</p> : null}

      <div className="mt-4">
        {isLoading ? <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading plant status records...</p> : loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{loadError}</p><button className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 font-semibold hover:bg-red-100" onClick={retry} type="button">Retry plant records</button></div>
        ) : records.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">No plant status records have been added yet.</p> : (
          <div className="space-y-3">
            {records.map((record) => (
              <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300" key={record.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h6 className="text-sm font-semibold text-slate-950">{record.plantName}</h6><p className="mt-1 text-sm capitalize text-slate-600">{label(record.growthStage)} · {formatDate(record.recordedAt ?? record.createdAt)}</p><div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${healthClasses(record.healthStatus)}`}>{record.healthStatus}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">{label(record.leafCondition)}</span></div></div>
                  <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={isSaving} onClick={() => { setEditingRecord(record); setMessage(null); setIsFormOpen(true); }} type="button">Edit</button>
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Height</dt><dd className="mt-0.5">{record.heightValue === null ? "Not recorded" : `${record.heightValue} ${record.heightUnit}`}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Created by</dt><dd className="mt-0.5 break-all">{record.createdBy || "Not available"}</dd></div></dl>
                {record.notes ? <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{record.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
