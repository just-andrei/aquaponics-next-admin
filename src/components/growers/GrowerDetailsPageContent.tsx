"use client";

import { useSearchParams } from "next/navigation";

import { GrowerDetails } from "@/components/growers/GrowerDetails";
import { StatePanel } from "@/components/ui/StatePanel";

export function GrowerDetailsPageContent() {
  const searchParams = useSearchParams();
  const growerUid = searchParams.get("growerUid")?.trim() ?? "";

  if (!growerUid) {
    return (
      <StatePanel
        description="Return to Grower Management and select a grower to view."
        title="No grower selected"
        tone="error"
      />
    );
  }

  return <GrowerDetails growerUid={growerUid} />;
}
