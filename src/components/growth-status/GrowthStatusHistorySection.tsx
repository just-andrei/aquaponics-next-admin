"use client";

import { useMemo, useState } from "react";
import { AquacultureStatusRecordsPanel } from "@/components/growth-status/AquacultureStatusRecordsPanel";
import { PlantStatusRecordsPanel } from "@/components/growth-status/PlantStatusRecordsPanel";
import type { AssignedSystem } from "@/types/system";

type GrowthStatusHistorySectionProps = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  system: AssignedSystem;
};

export function GrowthStatusHistorySection({
  growerUid,
  growerName,
  growerEmail,
  system,
}: GrowthStatusHistorySectionProps) {
  const [activeTab, setActiveTab] = useState<"plant" | "aquaculture">("plant");
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

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-950">Growth / Status History</h4>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Review and manually record plant and aquaculture status observations.
        </p>
      </div>

      <div className="mt-4 grid gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:grid-cols-2" role="tablist">
        <button
          aria-selected={activeTab === "plant"}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
            activeTab === "plant"
              ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("plant")}
          role="tab"
          type="button"
        >
          Plant Status Records
        </button>
        <button
          aria-selected={activeTab === "aquaculture"}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
            activeTab === "aquaculture"
              ? "bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("aquaculture")}
          role="tab"
          type="button"
        >
          Aquaculture Status Records
        </button>
      </div>

      <div className="mt-4" role="tabpanel">
        {activeTab === "plant" ? (
          <PlantStatusRecordsPanel context={context} />
        ) : (
          <AquacultureStatusRecordsPanel context={context} />
        )}
      </div>
    </section>
  );
}
