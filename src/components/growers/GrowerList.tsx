"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DeleteGrowerDialog } from "@/components/growers/DeleteGrowerDialog";
import { GrowerFormDialog } from "@/components/growers/GrowerFormDialog";
import { resolveGrowerCollectionName, subscribeToGrowers } from "@/lib/growers";
import {
  createGrowerAccount,
  deleteGrowerAccount,
} from "@/lib/growerAccounts";
import { db } from "@/lib/firebase";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  CreateGrowerInput,
  Grower,
  GrowerCollectionName,
  GrowerStatus,
} from "@/types/grower";

type StatusFilter = "all" | GrowerStatus;

function formatCreatedAt(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function readableError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return "Growers could not be loaded. Please try again.";
}

export function GrowerList() {
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [sourceCollection, setSourceCollection] =
    useState<GrowerCollectionName | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [growerToDelete, setGrowerToDelete] = useState<Grower | null>(null);
  const [operationMessage, setOperationMessage] = useState<{
    tone: "success" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    const firestore = db;
    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function startSubscription() {
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
        const collectionName = await resolveGrowerCollectionName(firestore);
        if (isCancelled) return;

        setSourceCollection(collectionName);
        unsubscribe = subscribeToGrowers(
          firestore,
          collectionName,
          (nextGrowers) => {
            if (isCancelled) return;
            setGrowers(nextGrowers);
            setError(null);
            setIsLoading(false);
          },
          (subscriptionError) => {
            if (isCancelled) return;
            setError(readableError(subscriptionError));
            setIsLoading(false);
          },
        );
      } catch (subscriptionError) {
        if (isCancelled) return;
        setError(readableError(subscriptionError));
        setIsLoading(false);
      }
    }

    void startSubscription();

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [retryKey]);

  const filteredGrowers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return growers.filter((grower) => {
      const matchesSearch =
        !query ||
        grower.name.toLowerCase().includes(query) ||
        grower.email.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || grower.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [growers, search, statusFilter]);

  function retry() {
    setError(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  async function handleCreateGrower(input: CreateGrowerInput) {
    setOperationMessage(null);
    const result = await createGrowerAccount(input);
    setIsCreateOpen(false);
    setOperationMessage({
      tone: result.passwordResetEmailSent ? "success" : "warning",
      text: result.passwordResetEmailSent
        ? `Grower #${result.userId} was created and a password-reset email was sent to ${result.email}.`
        : `Grower #${result.userId} was created, but the password-reset email could not be sent. Send a reset email from Firebase Authentication before the grower signs in.`,
    });
    return result;
  }

  async function handleDeleteGrower(confirmation: string) {
    if (!growerToDelete) {
      throw new Error("Select a grower before deleting.");
    }
    setOperationMessage(null);
    const growerName = growerToDelete.name;
    const result = await deleteGrowerAccount({
      uid: growerToDelete.uid,
      collectionName: growerToDelete.sourceCollection,
      confirmation,
    });
    setGrowerToDelete(null);
    setOperationMessage({
      tone: "success",
      text: `${growerName}'s sign-in account, profile, systems, and nested records were permanently deleted. Issue reports and global alerts were retained for audit.`,
    });
    return result;
  }

  if (isLoading) {
    return <StatePanel title="Loading grower accounts..." tone="loading" />;
  }

  if (error) {
    return (
      <StatePanel
        actionLabel="Retry growers"
        description={error}
        onAction={retry}
        title="Grower accounts could not be loaded"
        tone="error"
      />
    );
  }

  return (
    <div className="space-y-4">
      {operationMessage ? (
        <div
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            operationMessage.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
          role="status"
        >
          {operationMessage.text}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Find a grower</h2>
            <p className="mt-1 text-sm text-slate-600">
              Search account details or narrow the list by status.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {filteredGrowers.length} of {growers.length} shown
            </p>
            <button
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!sourceCollection}
              onClick={() => {
                setOperationMessage(null);
                setIsCreateOpen(true);
              }}
              type="button"
            >
              Add new grower
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="grower-search">
              Search growers
            </label>
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              id="grower-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
              type="search"
              value={search}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="status-filter">
              Account status
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              id="status-filter"
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              value={statusFilter}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>{sourceCollection ? `Data source: ${sourceCollection}` : "Data source unavailable"}</p>
          {search || statusFilter !== "all" ? (
            <button
              className="font-semibold text-emerald-700 hover:text-emerald-900"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filteredGrowers.length === 0 ? (
        <StatePanel
          description={
            growers.length === 0
              ? "The selected grower collection does not contain any grower accounts yet."
              : "Try a different name, email address, or account-status filter."
          }
          title={growers.length === 0 ? "No growers found" : "No matching growers"}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/90 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold" scope="col">Name</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Email</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Address</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Created</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGrowers.map((grower) => (
                  <tr className="transition hover:bg-cyan-50/35" key={`${grower.sourceCollection}-${grower.uid}`}>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">
                      {grower.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {grower.email || "Not available"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge tone={grower.isActive ? "success" : "neutral"}>
                        {grower.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="min-w-56 px-4 py-3">
                      {grower.address || "Not available"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCreatedAt(grower.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:border-emerald-300 hover:bg-emerald-100"
                          href={{
                            pathname: "/admin/growers/details",
                            query: { growerUid: grower.uid },
                          }}
                        >
                          View details
                        </Link>
                        <button
                          className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:border-red-300 hover:bg-red-100"
                          onClick={() => {
                            setOperationMessage(null);
                            setGrowerToDelete(grower);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateOpen && sourceCollection ? (
        <GrowerFormDialog
          collectionName={sourceCollection}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateGrower}
        />
      ) : null}

      {growerToDelete ? (
        <DeleteGrowerDialog
          grower={growerToDelete}
          onClose={() => setGrowerToDelete(null)}
          onConfirm={handleDeleteGrower}
        />
      ) : null}
    </div>
  );
}
