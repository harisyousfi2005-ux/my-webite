import { authedBackendFetch } from "@/lib/server/session";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import type { Order, PaginatedResult } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await authedBackendFetch<PaginatedResult<Order>>("/orders?limit=20");

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Orders</h2>
      <div className="mt-8">
        <OrdersAdmin initialOrders={orders} />
      </div>
    </div>
  );
}
