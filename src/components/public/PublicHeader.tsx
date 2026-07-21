"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePublicTheme } from "@/components/public/PublicThemeProvider";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact Us" },
  { href: "/inquiry", label: "Inquiry" },
];

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20.354 15.354A9 9 0 0 1 8.646 3.646a9 9 0 1 0 11.708 11.708Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75V5.25M12 18.75V21.25M21.25 12H18.75M5.25 12H2.75M18.54 5.46L16.77 7.23M7.23 16.77L5.46 18.54M18.54 18.54L16.77 16.77M7.23 7.23L5.46 5.46"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PublicHeader({ immersive = false }: { immersive?: boolean }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = usePublicTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/80 backdrop-blur-xl dark:border-slate-800 ${
        immersive
          ? "bg-white/80 dark:bg-slate-950/80"
          : "bg-white/95 dark:bg-slate-950/95"
      }`}
    >
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Aquaponics home"
          className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          href="/"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
              Aquaponics
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-700">
              Hybrid power + IoT
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            aria-controls="public-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
          className={`${isMenuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          id="public-navigation"
        >
          <nav aria-label="Public navigation" className="flex flex-col gap-1 md:flex-row md:items-center">
            {navigationItems.map((item) => {
              const isCurrent =
                item.href === "/" ? pathname === "/" : pathname === item.href;

              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 md:py-2 ${
                    isCurrent
                      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:ring-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
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
          <Link
            aria-current={pathname === "/login" ? "page" : undefined}
            className="mt-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:bg-emerald-600 dark:hover:bg-emerald-500 md:mt-0"
            href="/login"
            onClick={() => setIsMenuOpen(false)}
          >
            Admin Login
          </Link>
          <button
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="mt-2 hidden size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:mt-0 md:ml-4 md:inline-flex"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
