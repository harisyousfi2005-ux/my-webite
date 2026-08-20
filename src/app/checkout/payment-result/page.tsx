import Link from "next/link";
import { requireServerUser, authedBackendFetch } from "@/lib/server/session";
import { Container } from "@/components/ui/Container";
import { BrushButton } from "@/components/ui/BrushButton";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, { heading: string; tone: string; message: string }> = {
  PAID: {
    heading: "Payment received",
    tone: "text-clay",
    message: "Your payment was verified and your order is confirmed.",
  },
  FAILED: {
    heading: "Payment failed",
    tone: "text-clay",
    message: "The payment didn't go through. You can try again from your account page.",
  },
  PROCESSING: {
    heading: "Payment processing",
    tone: "text-ink-soft",
    message: "We're still waiting on confirmation from the payment provider.",
  },
  PENDING: {
    heading: "Payment pending",
    tone: "text-ink-soft",
    message: "We haven't received a confirmed result for this payment yet.",
  },
};

export default async function PaymentResultPage({
  searchParams,
}: PageProps<"/checkout/payment-result">) {
  const params = await searchParams;
  const orderId = typeof params.orderId === "string" ? params.orderId : undefined;
  const errorParam = typeof params.error === "string" ? params.error : undefined;

  const nextPath = orderId
    ? `/checkout/payment-result?orderId=${orderId}`
    : "/checkout/payment-result";
  await requireServerUser(nextPath);

  if (!orderId) {
    return (
      <ResultShell
        heading="Something went wrong"
        tone="text-clay"
        message={
          errorParam === "invalid_signature"
            ? "We couldn't verify this payment result — please contact us before retrying."
            : "We couldn't find a payment result to show."
        }
      />
    );
  }

  let order: Order | null = null;
  try {
    order = await authedBackendFetch<Order>(`/orders/me/${orderId}`);
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <ResultShell
        heading="Order not found"
        tone="text-clay"
        message="We couldn't load this order — check your account page for its current status."
      />
    );
  }

  // The status shown here always comes from our own database (already
  // updated by the backend's verified callback handler), never from the
  // URL — the orderId is just a pointer to look it up.
  const copy = STATUS_COPY[order.paymentStatus] ?? STATUS_COPY.PENDING;

  return (
    <ResultShell
      heading={`${copy.heading} — Order ${order.orderNumber}`}
      tone={copy.tone}
      message={copy.message}
    />
  );
}

function ResultShell({
  heading,
  tone,
  message,
}: {
  heading: string;
  tone: string;
  message: string;
}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-24">
      <Container className="flex flex-col items-center gap-4 text-center">
        <p className={`font-mono text-sm uppercase tracking-[0.1em] ${tone}`}>[ {heading} ]</p>
        <p className="max-w-sm text-sm text-ink-soft">{message}</p>
        <Link href="/account" className="mt-2 transition-opacity hover:opacity-80">
          <BrushButton>[ View my orders ]</BrushButton>
        </Link>
      </Container>
    </section>
  );
}
