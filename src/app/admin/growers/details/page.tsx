import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin-page-header";
import { GrowerDetailsPageContent } from "@/components/growers/GrowerDetailsPageContent";
import { StatePanel } from "@/components/ui/StatePanel";

export default function GrowerDetailsPage() {
  return (
    <>
      <AdminPageHeader
        title="Grower Details"
        description="Review the grower profile and assigned systems stored in Firebase."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense
          fallback={(
            <StatePanel
              description="Preparing the selected grower record."
              title="Loading grower details"
              tone="loading"
            />
          )}
        >
          <GrowerDetailsPageContent />
        </Suspense>
      </section>
    </>
  );
}
