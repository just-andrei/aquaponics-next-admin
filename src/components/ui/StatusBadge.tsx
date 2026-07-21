import type { ReactNode } from "react";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "water"
  | "neutral"
  | "violet";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  showDot?: boolean;
};

const toneClasses: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  water: "border-cyan-200 bg-cyan-50 text-cyan-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  water: "bg-cyan-500",
  neutral: "bg-slate-400",
  violet: "bg-violet-500",
};

export function StatusBadge({
  children,
  tone = "neutral",
  showDot = true,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${toneClasses[tone]}`}
    >
      {showDot ? (
        <span aria-hidden="true" className={`size-1.5 rounded-full ${dotClasses[tone]}`} />
      ) : null}
      {children}
    </span>
  );
}
