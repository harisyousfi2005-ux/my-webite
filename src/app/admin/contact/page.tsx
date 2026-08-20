import { authedBackendFetch } from "@/lib/server/session";
import { ContactAdmin } from "@/components/admin/ContactAdmin";
import type { ContactMessage, PaginatedResult } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const messages = await authedBackendFetch<PaginatedResult<ContactMessage>>("/contact?limit=20");

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Contact Messages</h2>
      <div className="mt-8">
        <ContactAdmin initialMessages={messages} />
      </div>
    </div>
  );
}
