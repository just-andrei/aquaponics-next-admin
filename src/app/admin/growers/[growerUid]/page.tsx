import { AdminPageHeader } from "@/components/admin-page-header";
import { GrowerDetails } from "@/components/growers/GrowerDetails";

type GrowerDetailsPageProps = {
  params: Promise<{
    growerUid: string;
  }>;
};

export default async function GrowerDetailsPage({
  params,
}: GrowerDetailsPageProps) {
  const { growerUid } = await params;

  return (
    <>
      <AdminPageHeader
        title="Grower Details"
        description="Review the grower profile and assigned systems stored in Firebase."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <GrowerDetails growerUid={growerUid} />
      </section>
    </>
  );
}
