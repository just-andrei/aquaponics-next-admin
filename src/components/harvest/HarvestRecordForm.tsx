"use client";

import { useState, type FormEvent } from "react";
import type {
  HarvestCondition,
  HarvestRecord,
  HarvestRecordDraft,
  HarvestRecordType,
} from "@/types/harvest";

type HarvestRecordFormProps = {
  initialRecord: HarvestRecord | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: HarvestRecordDraft) => Promise<void>;
};

const recordTypes: HarvestRecordType[] = ["plant", "aquaculture"];
const standardUnits = ["kg", "g", "pcs", "bundles"];
const conditions: HarvestCondition[] = ["good", "fair", "poor"];
const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500";

function dateInputValue(value: Date | null) {
  const date = value ?? new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function HarvestRecordForm({
  initialRecord,
  isSaving,
  onCancel,
  onSubmit,
}: HarvestRecordFormProps) {
  const [recordType, setRecordType] = useState<HarvestRecordType>(
    initialRecord?.recordType ?? "plant",
  );
  const [itemName, setItemName] = useState(initialRecord?.itemName ?? "");
  const [quantity, setQuantity] = useState(
    initialRecord ? String(initialRecord.quantity) : "",
  );
  const [unit, setUnit] = useState(initialRecord?.unit || standardUnits[0]);
  const [harvestDate, setHarvestDate] = useState(
    dateInputValue(initialRecord?.harvestDate ?? null),
  );
  const [condition, setCondition] = useState<HarvestCondition>(
    initialRecord?.condition ?? "good",
  );
  const [notes, setNotes] = useState(initialRecord?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const unitOptions =
    initialRecord?.unit && !standardUnits.includes(initialRecord.unit)
      ? [...standardUnits, initialRecord.unit]
      : standardUnits;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedDate = new Date(`${harvestDate}T00:00:00`);

    if (!itemName.trim()) {
      setValidationError("Item name is required.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setValidationError("Enter a quantity greater than zero.");
      return;
    }
    if (!harvestDate || Number.isNaN(parsedDate.getTime())) {
      setValidationError("Select a valid harvest date.");
      return;
    }

    setValidationError(null);
    await onSubmit({
      recordType,
      itemName: itemName.trim(),
      quantity: parsedQuantity,
      unit,
      harvestDate: parsedDate,
      condition,
      notes: notes.trim(),
    });
  }

  return (
    <form
      className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-base font-semibold text-slate-950">
          {initialRecord ? "Edit Harvest Record" : "Add Harvest Record"}
        </h5>
        <p className="text-xs text-slate-500">Fields marked * are required.</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Record type *
          <select
            className={fieldClasses}
            disabled={isSaving}
            onChange={(event) => setRecordType(event.target.value as HarvestRecordType)}
            value={recordType}
          >
            {recordTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Item name *
          <input
            className={fieldClasses}
            disabled={isSaving}
            onChange={(event) => setItemName(event.target.value)}
            required
            type="text"
            value={itemName}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Quantity *
          <input
            className={fieldClasses}
            disabled={isSaving}
            min="0.01"
            onChange={(event) => setQuantity(event.target.value)}
            required
            step="any"
            type="number"
            value={quantity}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Unit *
          <select
            className={fieldClasses}
            disabled={isSaving}
            onChange={(event) => setUnit(event.target.value)}
            value={unit}
          >
            {unitOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Harvest date *
          <input
            className={fieldClasses}
            disabled={isSaving}
            max="2100-12-31"
            min="2000-01-01"
            onChange={(event) => setHarvestDate(event.target.value)}
            required
            type="date"
            value={harvestDate}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Condition *
          <select
            className={fieldClasses}
            disabled={isSaving}
            onChange={(event) => setCondition(event.target.value as HarvestCondition)}
            value={condition}
          >
            {conditions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Notes
        <textarea
          className={fieldClasses}
          disabled={isSaving}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          value={notes}
        />
      </label>

      {validationError ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
          {validationError}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Grower, system, hardware, creator, and timestamp fields are filled automatically.
      </p>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : initialRecord ? "Update record" : "Save record"}
        </button>
      </div>
    </form>
  );
}
