type FeatureCardProps = {
  marker: string;
  title: string;
  description: string;
  tone?: "plant" | "water" | "energy";
};

const markerClasses = {
  plant: "bg-emerald-100 text-emerald-800",
  water: "bg-cyan-100 text-cyan-800",
  energy: "bg-amber-100 text-amber-800",
};

export function FeatureCard({ marker, title, description, tone = "plant" }: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <span className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold uppercase tracking-[0.12em] ${markerClasses[tone]}`}>
        {marker}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}
