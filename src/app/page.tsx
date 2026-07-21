import Link from "next/link";
import { FeatureCard } from "@/components/public/FeatureCard";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ThemeAwareLiquidEther } from "@/components/public/ThemeAwareLiquidEther";

const systemFunctions = [
  {
    marker: "Environment",
    title: "Aquaponics Environmental Management",
    description:
      "Brings stored environmental conditions and system status into a clear review workflow for administrators.",
    tone: "plant" as const,
  },
  {
    marker: "Water",
    title: "Water Quality Information",
    description:
      "Organizes pH, water temperature, dissolved oxygen, turbidity, and humidity information for monitoring review.",
    tone: "water" as const,
  },
  {
    marker: "Energy",
    title: "Hybrid Energy Management",
    description:
      "Displays stored power-source, battery, and solar-backup status without operating physical equipment.",
    tone: "energy" as const,
  },
  {
    marker: "Aquaculture",
    title: "Aquaculture Information",
    description:
      "Keeps fish or crustacean growth, health, feeding observations, and harvest records organized by system.",
    tone: "water" as const,
  },
  {
    marker: "Plants",
    title: "Plant Information",
    description:
      "Supports review of plant growth stages, leaf condition, health status, notes, and harvest history.",
    tone: "plant" as const,
  },
];

const beneficiaries = [
  "Small-scale farmers",
  "Aquaponics practitioners",
  "Fisherfolk and community growers",
  "Schools and research teams",
];

export default function Home() {
  return (
    <PublicPageShell background={<ThemeAwareLiquidEther />}>
      <main>
        <section className="relative overflow-hidden bg-slate-50/40 backdrop-blur-[1px] dark:bg-slate-950/45">
          <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl items-center px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Sustainable agriculture + IoT monitoring
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Hybrid Power-Driven Aquaponics with IoT Environmental Control System
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                A capstone system that combines aquaponics, environmental sensing,
                stored water-quality information, fish and plant records, and hybrid
                energy status to support informed system management.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  href="#about"
                >
                  Learn More
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  href="/login"
                >
                  Admin Login
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2" aria-label="System focus areas">
                {[
                  "Water quality",
                  "Growth records",
                  "Environmental alerts",
                  "Solar backup status",
                ].map((item) => (
                  <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-24 bg-white/75 py-18 backdrop-blur-md dark:bg-slate-950/75 sm:py-24" id="about">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">About the project</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                One practical view of water, growth, records, and energy status
              </h2>
            </div>
            <div className="space-y-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              <p>
                The project combines aquaculture and hydroponics in a recirculating
                environment where aquatic waste can provide nutrients for plants and
                plants help support water filtration.
              </p>
              <p>
                IoT sensors and connected system components provide environmental data.
                The web application gives administrators a place to review stored
                monitoring information, manage growers, examine records, handle public
                messages, and prepare reports.
              </p>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-100">
                Physical automation—including pumps, feeders, relays, valves, and power
                switching—belongs to the system hardware and firmware, not this public
                website or admin interface.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50/75 py-18 backdrop-blur-md dark:bg-slate-900/75 sm:py-24" aria-labelledby="functions-heading">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Main system functions</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl" id="functions-heading">
                Information that supports healthier aquaponics operations
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                The capstone connects environmental, aquaculture, plant, and energy
                information while keeping each application within its proper role.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {systemFunctions.map((feature) => (
                <FeatureCard {...feature} key={feature.title} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/80 py-18 backdrop-blur-md dark:bg-slate-950/80 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 dark:border-cyan-900 dark:bg-cyan-950/40 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">Special feature</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Aquaculture Automatic Feeding</h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                  The overall system supports feeding schedules and feeding-related
                  information. Actual feeder activation remains a hardware and firmware responsibility.
                </p>
              </article>
              <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Special feature</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Solar Backup Energy</h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                  Stored battery, solar, backup availability, and power-source data can
                  be reviewed by administrators. Switching remains outside the web application.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-slate-950/90 py-18 text-white backdrop-blur-md sm:py-24" aria-labelledby="helps-heading">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">How the system helps</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="helps-heading">
                A clearer path from stored readings to informed review
              </h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["01", "Gather information", "Sensors and connected components provide environmental and energy data."],
                ["02", "Store history", "Monitoring summaries, system records, alerts, harvests, and growth status are retained in Firebase."],
                ["03", "Review conditions", "Administrators inspect current summaries, weekly logs, warning states, and system records."],
                ["04", "Support decisions", "Reports and organized history help teams plan follow-up and document capstone operation."],
              ].map(([number, title, description]) => (
                <li className="rounded-2xl border border-slate-800 bg-slate-900 p-5" key={number}>
                  <span className="text-sm font-bold text-cyan-300">{number}</span>
                  <h3 className="mt-4 font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white/75 py-18 backdrop-blur-md dark:bg-slate-950/75 sm:py-24" aria-labelledby="beneficiaries-heading">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Target users</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl" id="beneficiaries-heading">
                Built for learning, administration, and practical aquaponics support
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Public visitors can learn about the system and contact the project team.
                Protected administration remains limited to active admin accounts.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {beneficiaries.map((beneficiary) => (
                <li className="flex min-h-20 items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" key={beneficiary}>
                  <span aria-hidden="true" className="mr-3 size-2 rounded-full bg-emerald-500" />
                  {beneficiary}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-emerald-700/90 py-16 text-white backdrop-blur-md dark:bg-emerald-800/90 sm:py-20">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-100">Connect with the project</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Have a question or a system inquiry?</h2>
            <p className="mt-4 max-w-2xl leading-7 text-emerald-50">
              Send a general message or provide details about the aquaponics setup you are considering.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40" href="/contact">
                Contact Us
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300 px-5 text-sm font-semibold text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30" href="/inquiry">
                Send an Inquiry
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
