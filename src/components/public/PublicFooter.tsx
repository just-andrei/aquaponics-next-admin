import Image from "next/image";
import Link from "next/link";

export function PublicFooter({ immersive = false }: { immersive?: boolean }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <footer
      className={`${immersive ? "border-t border-slate-700/70 bg-slate-950/90 backdrop-blur-xl" : "bg-slate-950"} text-slate-300`}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              alt=""
              className="size-12 object-contain"
              height={48}
              src={`${basePath}/aquaponics-logo.png`}
              width={48}
            />
            <div>
              <p className="font-semibold text-white">Smart Aquaponics</p>
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-300">Capstone project</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            A hybrid power-driven aquaponics system supporting environmental monitoring,
            stored records, and sustainable food production.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Quick links</h2>
          <nav aria-label="Footer navigation" className="mt-4 grid gap-2 text-sm">
            <Link className="w-fit hover:text-emerald-300" href="/">Home</Link>
            <Link className="w-fit hover:text-emerald-300" href="/#about">About the project</Link>
            <Link className="w-fit hover:text-emerald-300" href="/contact">Contact Us</Link>
            <Link className="w-fit hover:text-emerald-300" href="/inquiry">Inquiry</Link>
            <Link className="w-fit hover:text-emerald-300" href="/login">Admin Login</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Project scope</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            The public website provides project information and inquiry channels. The
            protected web portal is reserved for active administrators.
          </p>
          <p className="mt-3 text-sm text-slate-400">Bulacan, Philippines</p>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
        Hybrid Power-Driven Aquaponics with IoT Environmental Control System
      </div>
    </footer>
  );
}
