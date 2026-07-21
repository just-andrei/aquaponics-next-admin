"use client";

import { useState } from "react";
import { MessagesTable } from "@/components/messages/MessagesTable";

export function AdminMessagesPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "inquiry">("contact");

  return (
    <div>
      <div className="mb-6 grid gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 sm:grid-cols-2" role="tablist">
        <button
          aria-selected={activeTab === "contact"}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            activeTab === "contact"
              ? "bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("contact")}
          role="tab"
          type="button"
        >
          Contact Messages
        </button>
        <button
          aria-selected={activeTab === "inquiry"}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            activeTab === "inquiry"
              ? "bg-white text-violet-800 shadow-sm ring-1 ring-violet-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("inquiry")}
          role="tab"
          type="button"
        >
          Inquiry Messages
        </button>
      </div>

      <div role="tabpanel">
        {activeTab === "contact" ? (
          <MessagesTable
            collectionName="contact_submissions"
            kind="contact"
            title="Contact Messages"
          />
        ) : (
          <MessagesTable
            collectionName="inquiry_submissions"
            kind="inquiry"
            title="Inquiry Messages"
          />
        )}
      </div>
    </div>
  );
}
