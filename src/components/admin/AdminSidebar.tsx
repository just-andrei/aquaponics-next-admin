"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";

const navigationItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/growers", label: "Growers" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/reports", label: "Issue Reports" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      if (auth) {
        await signOut(auth);
      }
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <aside className="border-b border-slate-200/90 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-4 lg:px-5 lg:py-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Aquaponics
          </p>
          <p className="truncate text-base font-semibold text-slate-950">Admin Portal</p>
          <p className="truncate text-xs text-slate-500">Stored-data management</p>
        </div>

        <button
          aria-controls="admin-navigation-panel"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close admin menu" : "Open admin menu"}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 lg:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0.5 h-0.5 w-5 rounded-full bg-current transition ${
                isMenuOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute bottom-0.5 left-0 h-0.5 w-5 rounded-full bg-current transition ${
                isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`${isMenuOpen ? "block" : "hidden"} lg:flex lg:min-h-0 lg:flex-1 lg:flex-col`}
        id="admin-navigation-panel"
      >
        <nav
          aria-label="Admin navigation"
          className="grid gap-2 px-3 py-3 sm:grid-cols-2 lg:flex lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-5"
        >
          {navigationItems.map((item) => {
            const isCurrent =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={`group flex items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${
                  isCurrent
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-3 lg:mt-auto lg:p-4">
          <button
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleLogout}
            type="button"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
