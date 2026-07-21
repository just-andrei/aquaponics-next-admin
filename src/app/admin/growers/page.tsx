import { AdminPageHeader } from "@/components/admin-page-header";
import { GrowerList } from "@/components/growers/GrowerList";

export default function GrowersPage() {
  return (
    <>
      <AdminPageHeader
        title="Grower Management"
        description="Review existing grower accounts, search by name or email, and filter by account status."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <GrowerList />
      </section>
    </>
  );
}
