import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthProvider>
      <ProtectedAdminRoute>
        <div className="admin-shell min-h-screen lg:flex">
          <AdminSidebar />
          <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </ProtectedAdminRoute>
    </AuthProvider>
  );
}
