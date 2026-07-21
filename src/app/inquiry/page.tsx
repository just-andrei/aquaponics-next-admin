import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/public/InquiryForm";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Inquiry | Smart Aquaponics",
  description: "Send a system inquiry to the Hybrid Power-Driven Aquaponics project team.",
};

export default function InquiryPage() {
  return (
    <PublicPageShell>
      <main className="bg-slate-50 dark:bg-slate-950">
        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">System Inquiry</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Share the aquaponics setup you are considering</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Provide the same practical project and setup information used by the original inquiry workflow. An administrator can review the submission in Admin Messages.</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-6 text-slate-950 shadow-sm dark:border-slate-800 dark:from-cyan-950 dark:to-slate-950 dark:text-white sm:p-8 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Before submitting</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Useful details to prepare</h2>
            <ul className="mt-6 grid gap-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li className="rounded-2xl border border-cyan-100 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">The type of plant, aquaculture, full-system, or IoT inquiry.</li>
              <li className="rounded-2xl border border-cyan-100 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">Your location and approximate available farm area.</li>
              <li className="rounded-2xl border border-cyan-100 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">Indoor or outdoor placement and an optional preferred date.</li>
            </ul>
            <p className="mt-6 text-sm leading-6 text-slate-600 dark:text-slate-400">For a general question that does not require setup details, use the Contact Us form.</p>
            <Link className="mt-3 inline-flex font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200" href="/contact">Go to Contact Us</Link>
          </aside>
          <InquiryForm />
        </section>
      </main>
    </PublicPageShell>
  );
}
