import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminReportsPage } from "@/components/reports/AdminReportsPage";

export default function ReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="System Issue Reports"
        description="Review farmer-reported system problems, prioritize active issues, and track resolved report history."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AdminReportsPage />
      </section>
    </>
  );
}
