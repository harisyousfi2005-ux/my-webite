import Link from "next/link";
import { authedBackendFetch } from "@/lib/server/session";
import type { ApiProduct, ContactMessage, Order, PaginatedResult, User } from "@/types";

const cardClass = "border border-line p-6 transition-opacity hover:opacity-80";

async function safeTotal(promise: Promise<PaginatedResult<unknown>>): Promise<number | null> {
  try {
    const result = await promise;
    return result.meta.total;
  } catch {
    return null;
  }
}

export default async function AdminOverviewPage() {
  const [productCount, orderCount, unreadCount, userCount] = await Promise.all([
    safeTotal(authedBackendFetch<PaginatedResult<ApiProduct>>("/products/admin/all?limit=1")),
    safeTotal(authedBackendFetch<PaginatedResult<Order>>("/orders?limit=1")),
    safeTotal(authedBackendFetch<PaginatedResult<ContactMessage>>("/contact?limit=1")),
    safeTotal(authedBackendFetch<PaginatedResult<User>>("/users?limit=1")),
  ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Orders", value: orderCount, href: "/admin/orders" },
    { label: "Contact Messages", value: unreadCount, href: "/admin/contact" },
    { label: "User Accounts", value: userCount, href: "/admin/users" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.href} href={stat.href} className={cardClass}>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            {stat.label}
          </p>
          <p className="mt-2 font-display text-3xl text-ink">{stat.value ?? "—"}</p>
        </Link>
      ))}
    </div>
  );
}
