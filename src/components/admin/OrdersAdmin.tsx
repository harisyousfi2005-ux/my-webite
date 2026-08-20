"use client";

import { useState } from "react";
import { adminListOrders, updateOrderStatus, verifyPayment } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { Order, OrderStatus, PaginatedResult } from "@/types";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const selectClass =
  "border border-ink/20 bg-transparent px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none";
const ghostButtonClass =
  "border border-ink/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50";

function money(n: number): string {
  return `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrderRow({ order, onChange }: { order: Order; onChange: (updated: Order) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(status: OrderStatus) {
    setStatusBusy(true);
    setError("");
    try {
      const updated = await updateOrderStatus(order.id, status);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleVerify(approve: boolean) {
    if (!order.payment) return;
    setVerifyBusy(true);
    setError("");
    try {
      await verifyPayment(order.payment.id, approve);
      onChange({
        ...order,
        payment: { ...order.payment, status: approve ? "PAID" : "FAILED" },
        paymentStatus: approve ? "PAID" : "FAILED",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify payment");
    } finally {
      setVerifyBusy(false);
    }
  }

  const needsVerification =
    order.paymentMethod === "BANK_TRANSFER" &&
    (order.paymentStatus === "PENDING" || order.paymentStatus === "PROCESSING") &&
    order.payment?.proofImageUrl;

  return (
    <div className="border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-left text-sm text-ink underline underline-offset-4 hover:opacity-70"
          >
            {order.orderNumber}
          </button>
          <p className="mt-1 text-xs text-ink-soft">
            {order.user?.email ?? order.contactEmail} · {money(order.total)} ·{" "}
            {/* Explicit locale avoids a hydration mismatch between the
                server-rendered date and the browser's own default locale. */}
            {new Date(order.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
            Payment: {order.paymentStatus}
          </span>
          <select
            value={order.status}
            disabled={statusBusy}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className={selectClass}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-2 font-mono text-xs text-clay">{error}</p>}

      {expanded && (
        <div className="mt-4 flex flex-col gap-3 border-t border-line/60 pt-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">Items</p>
            <ul className="mt-1 flex flex-col gap-1">
              {order.items.map((item) => (
                <li key={item.id} className="text-sm text-ink">
                  {item.productName} — Size {item.size} × {item.quantity} ({money(item.price)} each)
                </li>
              ))}
            </ul>
          </div>
          {order.address && (
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                Shipping to
              </p>
              <p className="mt-1 text-sm text-ink">
                {order.address.line1}, {order.address.city}
                {order.address.postalCode ? `, ${order.address.postalCode}` : ""} ·{" "}
                {order.address.phone}
              </p>
            </div>
          )}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
              Payment method
            </p>
            <p className="mt-1 text-sm text-ink">{order.paymentMethod.replaceAll("_", " ")}</p>
          </div>
          {needsVerification && (
            <div className="border border-line p-3">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                Bank transfer proof
              </p>
              {order.payment?.proofImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- admin tool, arbitrary Cloudinary URL
                <img
                  src={order.payment.proofImageUrl}
                  alt="Payment proof"
                  className="mt-2 max-h-64 border border-line"
                />
              )}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => handleVerify(true)}
                  className={ghostButtonClass}
                >
                  Approve — Mark Paid
                </button>
                <button
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => handleVerify(false)}
                  className={ghostButtonClass}
                >
                  Reject — Mark Failed
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OrdersAdmin({ initialOrders }: { initialOrders: PaginatedResult<Order> }) {
  const [result, setResult] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(false);

  async function loadPage(nextPage: number, status: OrderStatus | "") {
    setLoading(true);
    try {
      const next = await adminListOrders(nextPage, 20, status || undefined);
      setResult(next);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  function handleOrderChange(updated: Order) {
    setResult((prev) => ({
      ...prev,
      items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Filter by status
        </span>
        <select
          value={statusFilter}
          onChange={(e) => {
            const status = e.target.value as OrderStatus | "";
            setStatusFilter(status);
            loadPage(1, status);
          }}
          className={selectClass}
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {result.items.length === 0 ? (
        <p className="text-sm text-ink-soft">No orders found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((order) => (
            <OrderRow key={order.id} order={order} onChange={handleOrderChange} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => loadPage(page - 1, statusFilter)}
          className={ghostButtonClass}
        >
          Previous
        </button>
        <span className="font-mono text-xs text-ink-soft">
          Page {result.meta.page} of {result.meta.totalPages}
        </span>
        <button
          type="button"
          disabled={loading || page >= result.meta.totalPages}
          onClick={() => loadPage(page + 1, statusFilter)}
          className={ghostButtonClass}
        >
          Next
        </button>
      </div>
    </div>
  );
}
