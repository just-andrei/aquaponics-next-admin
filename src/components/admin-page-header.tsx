type AdminPageHeaderProps = {
  title: string;
  description: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <header className="border-b border-slate-200/90 bg-white/90 px-4 py-5 backdrop-blur sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          <span aria-hidden="true" className="h-px w-6 bg-emerald-500" />
          Hybrid Power-Driven Aquaponics
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </header>
  );
}
