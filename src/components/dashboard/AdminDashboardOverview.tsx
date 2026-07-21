"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { RecentMessages } from "@/components/dashboard/RecentMessages";
import { StatePanel } from "@/components/ui/StatePanel";
import { loadAdminDashboard } from "@/lib/dashboard";
import { db } from "@/lib/firebase";
import type { AdminDashboardData } from "@/types/dashboard";

function readableError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

export function AdminDashboardOverview() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const firestore = db;
    let cancelled = false;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;

      if (!firestore) {
        setLoadError(
          "Firebase is unavailable. Check .env.local and restart the development server.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const nextData = await loadAdminDashboard(firestore);
        if (cancelled) return;
        setData(nextData);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;
        setLoadError(readableError(error, "The dashboard overview could not be loaded."));
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function retry() {
    setData(null);
    setLoadError(null);
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  if (isLoading) {
    return <StatePanel title="Loading dashboard overview..." tone="loading" />;
  }

  if (loadError) {
    return (
      <StatePanel
        actionLabel="Retry dashboard"
        description={loadError}
        onAction={retry}
        title="Dashboard overview could not be loaded"
        tone="error"
      />
    );
  }

  if (!data) return null;

  const quickActions = [
    {
      href: "/admin/growers",
      title: "Manage Growers",
      description: "Search growers and review their assigned systems.",
    },
    {
      href: "/admin/messages",
      title: "View Messages",
      description: "Review contact and inquiry submissions.",
    },
    {
      href: "/admin/reports",
      title: "View Issue Reports",
      description: "Review farmer-reported system problems and resolved history.",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardSummaryCards summary={data.summary} />

      <section aria-labelledby="quick-actions-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-950" id="quick-actions-heading">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-600">Move directly to common admin tasks.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              href={action.href}
              key={action.href}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-800">{action.title}</p>
                <span className="text-lg text-emerald-600 transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <RecentAlerts alerts={data.recentAlerts} />
        <RecentMessages messages={data.recentMessages} />
      </div>
    </div>
  );
}
