import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminMessagesPage } from "@/components/messages/AdminMessagesPage";

export default function MessagesPage() {
  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Review contact and inquiry submissions and manually update their follow-up status."
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AdminMessagesPage />
      </section>
    </>
  );
}
