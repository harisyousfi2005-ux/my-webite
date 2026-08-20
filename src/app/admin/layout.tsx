import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/server/session";
import { Container } from "@/components/ui/Container";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Gates every /admin/* route in one place: any non-SUPER_ADMIN (including
  // a signed-out visitor) is redirected away before any admin data loads.
  await requireAdmin("/admin");

  return (
    <section className="py-12">
      <Container className="max-w-5xl">
        <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Admin Dashboard</h1>
        <div className="mt-6">
          <AdminNav />
        </div>
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}
