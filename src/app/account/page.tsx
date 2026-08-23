import Link from "next/link";
import { requireServerUser, authedBackendFetch } from "@/lib/server/session";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/account/LogoutButton";
import type { Order, PaginatedResult } from "@/types";

export default async function AccountPage() {
  const user = await requireServerUser("/account");
  const orders = await authedBackendFetch<PaginatedResult<Order>>(
    "/orders/me?limit=20",
  );

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-ink sm:text-5xl">
            Account
          </h1>
          <LogoutButton />
        </div>

        <div className="mt-8 border border-line p-6">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            Profile
          </span>
          <p className="mt-2 text-sm text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-ink-soft">{user.email}</p>
          {user.phone && <p className="text-sm text-ink-soft">{user.phone}</p>}
          {user.role === "SUPER_ADMIN" && (
            <Link
              href="/admin"
              className="mt-3 inline-block font-mono text-xs uppercase tracking-[0.1em] text-ink underline underline-offset-4 hover:opacity-70"
            >
              [ Admin Dashboard ]
            </Link>
          )}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl uppercase text-ink">Order History</h2>

          {orders.items.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              You haven&apos;t placed any orders yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {orders.items.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border border-line px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.05em] text-ink">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {new Date(order.createdAt).toLocaleDateString()} —{" "}
                      {order.status}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-soft/70">
                      {order.paymentMethod.replace(/_/g, " ")} — payment{" "}
                      {order.paymentStatus.toLowerCase()}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-clay">
                    PKR {order.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
