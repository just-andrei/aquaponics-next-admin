"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  loadAdminMessages,
  messageStatuses,
  updateAdminMessageStatus,
} from "@/lib/messages";
import type {
  AdminMessage,
  MessageCollectionName,
  MessageKind,
  MessageStatus,
} from "@/types/message";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

type MessagesTableProps = {
  kind: MessageKind;
  title: string;
  collectionName: MessageCollectionName;
};

type StatusFilter = "all" | MessageStatus;

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

function formatDate(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function statusTone(status: MessageStatus): StatusTone {
  switch (status) {
    case "resolved":
      return "success";
    case "reviewed":
      return "info";
    default:
      return "info";
  }
}

function InquiryFields({ message }: { message: AdminMessage }) {
  const details = message.inquiryDetails;
  if (!details) return null;

  const fields = [
    ["Contact number", details.contactNumber],
    ["Company", details.companyName],
    ["Location", details.location],
    ["Inquiry type", details.inquiryType],
    ["Farm size", details.farmSizeSqm ? `${details.farmSizeSqm} sqm` : ""],
    ["Setup location", details.setupLocation],
    ["Budget range", details.budgetRange],
    ["Preferred setup date", details.preferredSetupDate ? formatDate(details.preferredSetupDate) : ""],
  ].filter((field) => field[1]);

  if (fields.length === 0) return null;

  return (
    <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {fields.map(([fieldLabel, value]) => (
        <div key={fieldLabel}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {fieldLabel}
          </dt>
          <dd className="mt-1 break-words text-slate-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MessagesTable({ kind, title, collectionName }: MessagesTableProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let cancelled = false;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;

      if (!firestore) {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextMessages = await loadAdminMessages(firestore, kind);
        if (cancelled) return;
        setMessages(nextMessages);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;
        setLoadError(readableError(error, `${title} could not be loaded.`));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, refreshKey, title]);

  const filteredMessages = useMemo(
    () =>
      statusFilter === "all"
        ? messages
        : messages.filter((message) => message.status === statusFilter),
    [messages, statusFilter],
  );

  function retry() {
    setMessages([]);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  async function handleStatusUpdate(message: AdminMessage, status: MessageStatus) {
    const firestore = db;
    if (!firestore || updatingId || status === message.status) return;

    setUpdatingId(message.id);
    setOperationMessage(null);
    try {
      await updateAdminMessageStatus(firestore, kind, message.id, status);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, status } : item)),
      );
      setOperationMessage({
        tone: "success",
        text: `Message status updated to ${status}.`,
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: readableError(error, "Message status could not be updated."),
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review public submissions and manually update follow-up status.
          </p>
          <p className="mt-1 text-xs text-slate-500">Collection: {collectionName}</p>
        </div>
        <label className="w-full text-sm font-medium text-slate-700 sm:w-auto">
          Status filter
          <select
            className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm capitalize text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-w-44"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All</option>
            {messageStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {operationMessage ? (
        <p
          aria-live="polite"
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
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
          <StatePanel title={`Loading ${title.toLowerCase()}...`} tone="loading" />
        ) : loadError ? (
          <StatePanel actionLabel={`Retry ${title.toLowerCase()}`} description={loadError} onAction={retry} title={`${title} could not be loaded`} tone="error" />
        ) : messages.length === 0 ? (
          <StatePanel title={`No ${title.toLowerCase()} found.`} />
        ) : filteredMessages.length === 0 ? (
          <StatePanel description="Choose a different status to see more submissions." title="No messages match the selected status." />
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <article
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-6"
                key={message.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {message.name}
                      </h3>
                      <StatusBadge tone={statusTone(message.status)}>{message.status}</StatusBadge>
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">
                      {message.email || "Email not provided"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(message.createdAt)}
                      {message.source ? ` · Source: ${message.source}` : ""}
                    </p>
                  </div>

                  <label className="w-full text-xs font-medium text-slate-600 sm:w-auto">
                    Update status
                    <select
                      className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 sm:min-w-40"
                      disabled={updatingId !== null}
                      onChange={(event) =>
                        void handleStatusUpdate(
                          message,
                          event.target.value as MessageStatus,
                        )
                      }
                      value={message.status}
                    >
                      {messageStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Subject
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {message.subject || "Not provided"}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {message.message}
                  </p>
                </div>

                <InquiryFields message={message} />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
