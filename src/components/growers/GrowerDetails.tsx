"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AssignedSystemsList } from "@/components/growers/AssignedSystemsList";
import { db } from "@/lib/firebase";
import { loadGrowerDetails, type GrowerDetailsData } from "@/lib/growerDetails";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type GrowerDetailsProps = {
  growerUid: string;
};

function formatDate(value: Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function readableError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Grower details could not be loaded. Please try again.";
}

function BackToGrowersLink() {
  return (
    <Link
      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
      href="/admin/growers"
    >
      ← Back to growers
    </Link>
  );
}

export function GrowerDetails({ growerUid }: GrowerDetailsProps) {
  const [data, setData] = useState<GrowerDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let isCancelled = false;

    async function load() {
      await Promise.resolve();
      if (isCancelled) return;

      if (!firestore) {
        setError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextData = await loadGrowerDetails(firestore, growerUid);
        if (isCancelled) return;
        setData(nextData);
        setError(null);
        setIsLoading(false);
      } catch (loadError) {
        if (isCancelled) return;
        setError(readableError(loadError));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [growerUid, retryKey]);

  function retry() {
    setData(null);
    setError(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackToGrowersLink />
        <StatePanel title="Loading grower details and assigned systems..." tone="loading" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackToGrowersLink />
        <StatePanel
          actionLabel="Retry grower details"
          description={error || "Grower details are unavailable."}
          onAction={retry}
          title="Grower profile could not be loaded"
          tone="error"
        />
      </div>
    );
  }

  const { grower, assignedSystems } = data;

  return (
    <div>
      <BackToGrowersLink />

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Grower profile
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{grower.name}</h2>
            <p className="mt-1 break-all text-sm text-slate-500">UID: {grower.uid}</p>
          </div>
          <StatusBadge tone={grower.isActive ? "success" : "neutral"}>
            {grower.isActive ? "Active" : "Inactive"}
          </StatusBadge>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 break-all text-slate-800">{grower.email || "Not available"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
            <dd className="mt-1 text-slate-800">{grower.address || "Not available"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
            <dd className="mt-1 capitalize text-slate-800">{grower.status}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</dt>
            <dd className="mt-1 text-slate-800">{formatDate(grower.createdAt)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Updated</dt>
            <dd className="mt-1 text-slate-800">{formatDate(grower.updatedAt)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Profile source</dt>
            <dd className="mt-1 text-slate-800">{grower.sourceCollection}/{grower.uid}</dd>
          </div>
        </dl>
        </div>
      </section>

      <AssignedSystemsList
        growerEmail={grower.email}
        growerName={grower.name}
        growerUid={grower.uid}
        sourceCollection={assignedSystems.sourceCollection}
        systems={assignedSystems.systems}
      />
    </div>
  );
}
