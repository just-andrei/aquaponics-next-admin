import type { ReactNode } from "react";
import type { StatusTone } from "@/components/ui/StatusBadge";

type SummaryCardProps = {
  label: string;
  value: ReactNode;
  tone?: StatusTone;
  helper?: string;
};

const accentClasses: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  water: "bg-cyan-500",
  neutral: "bg-slate-400",
  violet: "bg-violet-500",
};

export function SummaryCard({
  label,
  value,
  tone = "neutral",
  helper,
}: SummaryCardProps) {
  const displayValue =
    typeof value === "number" ? new Intl.NumberFormat("en-PH").format(value) : value;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accentClasses[tone]}`} />
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`size-2 rounded-full ${accentClasses[tone]}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-950">
        {displayValue}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}
