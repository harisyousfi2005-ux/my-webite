"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrushButton } from "@/components/ui/BrushButton";
import type { Order, OrderStatus } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export function OrderConfirmation({ order }: { order: Order }) {
  const prefersReducedMotion = useReducedMotion();
  const currentIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((step) => step.key === order.status),
  );
  const isCancelled = order.status === "CANCELLED";

  const cardMotion = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE } };
  const iconMotion = prefersReducedMotion
    ? {}
    : {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.5, ease: EASE, delay: 0.15 },
      };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:py-24">
      <motion.div
        {...cardMotion}
        className="w-full max-w-lg border border-line bg-paper px-6 py-12 text-center sm:px-12"
      >
        <motion.div
          {...iconMotion}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-clay"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-clay" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <h1 className="mt-6 font-display text-3xl uppercase text-ink sm:text-4xl">
          Order Confirmed
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Thank you{order.user?.firstName ? `, ${order.user.firstName}` : ""} — order{" "}
          <span className="text-ink">{order.orderNumber}</span> for{" "}
          <span className="text-ink">PKR {order.total}</span> is confirmed. We&apos;ll email you at{" "}
          {order.contactEmail} with updates.
        </p>

        {!isCancelled && (
          <div className="mt-10 flex items-center justify-center">
            {STATUS_STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${index <= currentIndex ? "bg-clay" : "bg-line"}`}
                  />
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                      index <= currentIndex ? "text-ink" : "text-ink-soft/60"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STATUS_STEPS.length - 1 && (
                  <span
                    className={`mx-2 h-px w-8 sm:w-12 ${index < currentIndex ? "bg-clay" : "bg-line"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-8 text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">
                {item.productName}{" "}
                <span className="text-ink-soft">
                  — Size {item.size} × {item.quantity}
                </span>
              </span>
              <span className="text-ink-soft">PKR {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="font-mono uppercase tracking-[0.1em] text-ink-soft">Total</span>
            <span className="text-ink">PKR {order.total}</span>
          </div>
        </div>

        {order.address && (
          <div className="mt-8 border-t border-line pt-6 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
              Shipping to
            </p>
            <p className="mt-1 text-sm text-ink">
              {order.address.line1}, {order.address.city}
              {order.address.postalCode ? `, ${order.address.postalCode}` : ""}
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/account" className="transition-opacity hover:opacity-80">
            <BrushButton>[ View My Orders ]</BrushButton>
          </Link>
          <Link
            href="/#collection"
            className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
