import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminDashboardOverview } from "@/components/dashboard/AdminDashboardOverview";

export default function DashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Read-only overview of growers, assigned systems, environmental alerts, and incoming messages."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AdminDashboardOverview />
      </section>
    </>
  );
}
