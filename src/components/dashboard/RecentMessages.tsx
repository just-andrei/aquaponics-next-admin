import type { DashboardMessage } from "@/types/dashboard";
import { StatePanel } from "@/components/ui/StatePanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentMessagesProps = {
  messages: DashboardMessage[];
};

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

export function RecentMessages({ messages }: RecentMessagesProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Recent Messages</h2>
        <p className="mt-1 text-xs text-slate-500">
          Combined contact and inquiry submissions
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="mt-4">
          <StatePanel compact title="No contact or inquiry messages have been submitted." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {messages.map((message) => (
            <article
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300"
              key={`${message.kind}-${message.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {message.subject || `${message.kind === "contact" ? "Contact" : "Inquiry"} message`}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {message.name}
                    {message.email ? ` · ${message.email}` : ""} · {formatDate(message.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge tone={message.kind === "contact" ? "water" : "violet"}>{message.kind}</StatusBadge>
                  <StatusBadge tone={message.status === "resolved" ? "success" : "info"}>{message.status}</StatusBadge>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{message.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
