import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/public/ContactForm";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Contact Us | Smart Aquaponics",
  description: "Contact the Hybrid Power-Driven Aquaponics capstone project team.",
};

export default function ContactPage() {
  return (
    <PublicPageShell>
      <main className="bg-slate-50 dark:bg-slate-950">
        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Contact Us</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Start a conversation about the project</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Reach out for project questions, implementation details, or information about the smart aquaponics system.</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <aside className="h-fit self-start rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Project contact</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">How can we help?</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Use this form for general questions about the capstone, its web administration workflow, or project presentation.</p>
            <dl className="mt-8 grid gap-5 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <dt className="font-semibold text-slate-950 dark:text-white">Location</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Bulacan, Philippines</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <dt className="font-semibold text-slate-950 dark:text-white">System inquiries</dt>
                <dd className="mt-1 leading-6 text-slate-600 dark:text-slate-400">For setup-specific details, use the structured Inquiry form.</dd>
                <Link className="mt-3 inline-flex font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200" href="/inquiry">Open Inquiry form</Link>
              </div>
            </dl>
          </aside>
          <ContactForm />
        </section>
      </main>
    </PublicPageShell>
  );
}
