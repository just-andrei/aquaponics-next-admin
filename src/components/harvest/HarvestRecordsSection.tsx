"use client";

import { useEffect, useMemo, useState } from "react";
import { HarvestRecordForm } from "@/components/harvest/HarvestRecordForm";
import { auth, db } from "@/lib/firebase";
import {
  createHarvestRecord,
  loadHarvestRecords,
  updateHarvestRecord,
} from "@/lib/harvestRecords";
import type {
  HarvestCondition,
  HarvestRecord,
  HarvestRecordDraft,
} from "@/types/harvest";
import type { AssignedSystem } from "@/types/system";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

type HarvestRecordsSectionProps = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  system: AssignedSystem;
};

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

function formatDateTime(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function conditionTone(condition: HarvestCondition): StatusTone {
  switch (condition) {
    case "poor":
      return "danger";
    case "fair":
      return "warning";
    default:
      return "success";
  }
}

export function HarvestRecordsSection({
  growerUid,
  growerName,
  growerEmail,
  system,
}: HarvestRecordsSectionProps) {
  const context = useMemo(
    () => ({
      sourceCollection: system.sourceCollection,
      growerUid,
      growerName,
      growerEmail,
      systemId: system.id,
      systemName: system.systemName,
      hardwareUid: system.hardwareUid,
    }),
    [
      growerEmail,
      growerName,
      growerUid,
      system.hardwareUid,
      system.id,
      system.sourceCollection,
      system.systemName,
    ],
  );
  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let isCancelled = false;

    async function load() {
      await Promise.resolve();
      if (isCancelled) return;

      if (!firestore) {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextRecords = await loadHarvestRecords(firestore, context);
        if (isCancelled) return;
        setRecords(nextRecords);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        if (isCancelled) return;
        setLoadError(readableError(error, "Harvest records could not be loaded."));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [context, refreshKey]);

  function retry() {
    setRecords([]);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }

  function openAddForm() {
    setEditingRecord(null);
    setOperationMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(record: HarvestRecord) {
    setEditingRecord(record);
    setOperationMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setEditingRecord(null);
    setIsFormOpen(false);
  }

  async function handleSubmit(draft: HarvestRecordDraft) {
    const firestore = db;
    const adminUid = auth?.currentUser?.uid;
    if (!firestore || !adminUid) {
      setOperationMessage({
        tone: "error",
        text: "An authenticated administrator and Firebase connection are required.",
      });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setOperationMessage(null);
    try {
      if (editingRecord) {
        await updateHarvestRecord(firestore, context, editingRecord.id, draft);
      } else {
        await createHarvestRecord(firestore, context, draft, adminUid);
      }
      setOperationMessage({
        tone: "success",
        text: editingRecord ? "Harvest record updated." : "Harvest record added.",
      });
      setEditingRecord(null);
      setIsFormOpen(false);
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: readableError(error, "Harvest record could not be saved."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">Harvest Records</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and manually record plant or aquaculture harvests for this system.
          </p>
        </div>
        {!isFormOpen ? (
          <button
            className="rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            onClick={openAddForm}
            type="button"
          >
            Add Harvest Record
          </button>
        ) : null}
      </div>

      <p className="mt-2 break-all text-xs text-slate-500">
        {system.sourceCollection}/&#123;uid&#125;/systems/{system.id}/harvest_records
      </p>

      {isFormOpen ? (
        <HarvestRecordForm
          initialRecord={editingRecord}
          isSaving={isSaving}
          key={editingRecord?.id ?? "new-harvest-record"}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      {operationMessage ? (
        <p
          aria-live="polite"
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            operationMessage.tone === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {operationMessage.text}
        </p>
      ) : null}

      <div className="mt-4">
        {isLoading ? (
          <StatePanel compact title="Loading harvest records..." tone="loading" />
        ) : loadError ? (
          <StatePanel actionLabel="Retry harvest records" compact description={loadError} onAction={retry} title="Harvest records could not be loaded" tone="error" />
        ) : records.length === 0 ? (
          <StatePanel compact title="No harvest records have been added for this system yet." />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300" key={record.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-950">
                      {record.itemName}
                    </h5>
                    <p className="mt-1 text-sm text-slate-700">
                      {record.quantity} {record.unit} · {formatDate(record.harvestDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge tone="info">{record.recordType}</StatusBadge>
                      <StatusBadge tone={conditionTone(record.condition)}>{record.condition}</StatusBadge>
                    </div>
                  </div>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-60"
                    disabled={isSaving}
                    onClick={() => openEditForm(record)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>

                {record.notes ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">{record.notes}</p>
                ) : null}

                <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium">Created</dt>
                    <dd className="mt-0.5">{formatDateTime(record.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Updated</dt>
                    <dd className="mt-0.5">{formatDateTime(record.updatedAt)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium">Created by</dt>
                    <dd className="mt-0.5 break-all">{record.createdBy || "Not available"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
