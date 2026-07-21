type StatePanelProps = {
  title: string;
  description?: string;
  tone?: "loading" | "empty" | "error";
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function StatePanel({
  title,
  description,
  tone = "empty",
  actionLabel,
  onAction,
  compact = false,
}: StatePanelProps) {
  const isError = tone === "error";
  return (
    <div
      className={`rounded-xl border text-sm ${
        compact ? "p-4" : "p-6 text-center"
      } ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50/80 text-slate-600"
      }`}
      role={isError ? "alert" : "status"}
    >
      <div className={`flex ${compact ? "items-start" : "flex-col items-center"} gap-3`}>
        {tone === "loading" ? (
          <span
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isError ? "bg-red-100 text-red-700" : "bg-white text-slate-400 shadow-sm"
            }`}
          >
            {isError ? "!" : "—"}
          </span>
        )}
        <div className={compact ? "min-w-0" : "max-w-xl"}>
          <p className={`font-semibold ${isError ? "text-red-900" : "text-slate-800"}`}>
            {title}
          </p>
          {description ? <p className="mt-1 leading-6">{description}</p> : null}
          {actionLabel && onAction ? (
            <button
              className={`mt-3 rounded-lg border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 ${
                isError
                  ? "border-red-300 text-red-800 hover:bg-red-100 focus-visible:ring-red-200"
                  : "border-slate-300 text-slate-700 hover:bg-white focus-visible:ring-slate-200"
              }`}
              onClick={onAction}
              type="button"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
