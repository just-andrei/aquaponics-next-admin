"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isActiveAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isActiveAdmin) {
      router.replace("/login");
    }
  }, [isActiveAdmin, isLoading, router]);

  if (isLoading || !isActiveAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-slate-600">Checking administrator access...</p>
      </main>
    );
  }

  return <>{children}</>;
}
