import { HarvestRecordsSection } from "@/components/harvest/HarvestRecordsSection";
import { GrowthStatusHistorySection } from "@/components/growth-status/GrowthStatusHistorySection";
import { MonitoringHistorySection } from "@/components/monitoring/MonitoringHistorySection";
import { EnergyStatusSection } from "@/components/energy/EnergyStatusSection";
import type { AssignedSystem } from "@/types/system";
import type { GrowerCollectionName } from "@/types/grower";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AssignedSystemsListProps = {
  growerUid: string;
  growerName: string;
  growerEmail: string;
  systems: AssignedSystem[];
  sourceCollection: GrowerCollectionName;
};

export function AssignedSystemsList({
  growerUid,
  growerName,
  growerEmail,
  systems,
  sourceCollection,
}: AssignedSystemsListProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Assigned Systems</h2>
          <p className="mt-1 text-sm text-slate-600">
            Read-only systems currently stored for this grower.
          </p>
        </div>
        <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm">Source: {sourceCollection}/&#123;uid&#125;/systems</p>
      </div>

      {systems.length === 0 ? (
        <StatePanel
          description="No system documents were found under the primary or compatibility path."
          title="No assigned systems"
        />
      ) : (
        <div className="space-y-5">
          {systems.map((system) => {
            return (
              <article
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
                key={`${system.sourceCollection}-${system.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/60 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-cyan-700">Aquaponics system</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">
                      {system.systemName}
                    </h3>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      System ID: {system.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                      Review details below
                    </span>
                    <StatusBadge tone={system.isActive ? "success" : "neutral"}>
                      {system.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Hardware UID
                    </dt>
                    <dd className="mt-1 break-all text-slate-800">
                      {system.hardwareUid || "Pending"}
                    </dd>
                  </div>
                  {system.provisionCode ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Provision code
                      </dt>
                      <dd className="mt-1 text-slate-800">{system.provisionCode}</dd>
                    </div>
                  ) : null}
                  {system.activeFishId ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Active fish ID
                      </dt>
                      <dd className="mt-1 break-all text-slate-800">{system.activeFishId}</dd>
                    </div>
                  ) : null}
                  {system.activePlantId ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Active plant ID
                      </dt>
                      <dd className="mt-1 break-all text-slate-800">{system.activePlantId}</dd>
                    </div>
                  ) : null}
                </dl>

                <EnergyStatusSection growerUid={growerUid} system={system} />

                <MonitoringHistorySection
                  growerEmail={growerEmail}
                  growerName={growerName}
                  growerUid={growerUid}
                  system={system}
                />
                <HarvestRecordsSection
                  growerEmail={growerEmail}
                  growerName={growerName}
                  growerUid={growerUid}
                  system={system}
                />
                <GrowthStatusHistorySection
                  growerEmail={growerEmail}
                  growerName={growerName}
                  growerUid={growerUid}
                  system={system}
                />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
