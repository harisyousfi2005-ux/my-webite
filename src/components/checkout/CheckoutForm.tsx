"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/lib/CartContext";
import { apiFetch, ApiError } from "@/lib/api";
import { initiatePayment, simulateDemoPayment, submitBankTransferProof } from "@/lib/payments";
import { serializeProduct } from "@/lib/adapters";
import { BrushButton } from "@/components/ui/BrushButton";
import type {
  Address,
  InitiatePaymentResult,
  Order,
  PaymentMethod,
  PaymentSettingsPublic,
  User,
} from "@/types";

type Status =
  | "idle"
  | "submitting"
  | "awaiting_payment"
  | "payment_init_error"
  | "done"
  | "failed"
  | "error";

const inputClass =
  "w-full border border-paper/20 bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-none";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; hint?: string }[] = [
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery" },
  { value: "CARD_ON_DELIVERY", label: "Card on delivery (POS at your door)" },
  { value: "CARD", label: "Debit/Credit Card", hint: "secure checkout" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

// Cash on delivery and card-on-delivery-at-door are always available — they
// don't go through a gateway, so there's nothing for Payment Settings to
// configure for them.
const ALWAYS_AVAILABLE: PaymentMethod[] = ["CASH_ON_DELIVERY", "CARD_ON_DELIVERY"];

/** Auto-submits a hidden form to a payment gateway's hosted checkout page. */
function GatewayRedirect({ actionUrl, fields }: { actionUrl: string; fields: Record<string, string> }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft">
        Redirecting to secure checkout…
      </p>
      <form ref={formRef} method="POST" action={actionUrl} className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </div>
  );
}

/** Simple GET redirect to a payment gateway's hosted page (e.g. Stripe Checkout). */
function SimpleGatewayRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);

  return (
    <p className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft">
      Redirecting to secure checkout…
    </p>
  );
}

function BankTransferPanel({
  order,
  result,
}: {
  order: Order;
  result: Extract<InitiatePaymentResult, { type: "bank_transfer" }>;
}) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState(String(order.total));
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("referenceNumber", referenceNumber);
      formData.set("amount", amount);
      if (file) formData.set("file", file);
      await submitBankTransferProof(order.id, formData);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="max-w-sm text-sm text-ink-soft">
        Thanks — we&apos;ve recorded your transfer details. Your order stays{" "}
        <span className="text-clay">pending</span> until we verify the payment against our
        bank statement, then we&apos;ll confirm by email.
      </p>
    );
  }

  const { bankDetails } = result;

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-left">
      <div className="border border-ink p-4">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Transfer to
        </span>
        <p className="mt-2 text-sm text-ink">{bankDetails.accountTitle ?? "—"}</p>
        <p className="text-sm text-ink-soft">{bankDetails.bankName ?? "—"}</p>
        <p className="font-mono text-sm text-ink">{bankDetails.accountNumber ?? "—"}</p>
        {bankDetails.iban && (
          <p className="font-mono text-xs text-ink-soft">IBAN: {bankDetails.iban}</p>
        )}
        <p className="mt-2 font-mono text-sm text-clay">Amount: ${result.amount}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="Transaction/reference number"
          value={referenceNumber}
          onChange={(event) => setReferenceNumber(event.target.value)}
          className="w-full border border-ink bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
        />
        <input
          type="number"
          required
          step="0.01"
          placeholder="Amount transferred"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-full border border-ink bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
        />
        <label className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Payment proof (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs text-ink-soft"
          />
        </label>
        {error && <p className="font-mono text-xs text-clay">[ {error} ]</p>}
        <button
          type="submit"
          disabled={submitting}
          className="transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <BrushButton>{submitting ? "[ Submitting… ]" : "[ Submit Transfer Details ]"}</BrushButton>
        </button>
      </form>
    </div>
  );
}

function DemoPaymentPanel({
  order,
  onResolved,
}: {
  order: Order;
  onResolved: (outcome: "success" | "failure") => void;
}) {
  const [submitting, setSubmitting] = useState<"success" | "failure" | null>(null);
  const [error, setError] = useState("");

  async function handleSimulate(outcome: "success" | "failure") {
    setSubmitting(outcome);
    setError("");
    try {
      await simulateDemoPayment(order.id, outcome);
      onResolved(outcome);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't simulate payment");
      setSubmitting(null);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5 border-2 border-dashed border-clay p-6 text-center">
      <span className="border border-clay px-3 py-1 font-mono text-xs uppercase tracking-[0.15em] text-clay">
        Demo Payment
      </span>
      <p className="text-sm text-ink-soft">
        No real payment provider is contacted and no money moves. Choose an outcome to continue
        as if a real gateway had responded.
      </p>
      {error && <p className="font-mono text-xs text-clay">[ {error} ]</p>}
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSimulate("success")}
          disabled={submitting !== null}
          className="transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <BrushButton className="w-full">
            {submitting === "success" ? "[ Simulating… ]" : "[ Simulate Successful Payment ]"}
          </BrushButton>
        </button>
        <button
          type="button"
          onClick={() => handleSimulate("failure")}
          disabled={submitting !== null}
          className="w-full border border-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          {submitting === "failure" ? "Simulating…" : "Simulate Failed Payment"}
        </button>
      </div>
    </div>
  );
}

export function CheckoutForm({
  user,
  initialAddresses,
  paymentSettings,
}: {
  user: User;
  initialAddresses: Address[];
  paymentSettings: PaymentSettingsPublic;
}) {
  const { items, subtotal, status: cartStatus, clearCart } = useCart();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);

  const [contactEmail, setContactEmail] = useState(user.email);
  const [contactPhone, setContactPhone] = useState(user.phone ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentResult, setPaymentResult] = useState<InitiatePaymentResult | null>(null);

  const enabledMethods = new Set<PaymentMethod>([
    ...ALWAYS_AVAILABLE,
    ...paymentSettings.providers.filter((p) => p.enabled).map((p) => p.provider),
  ]);
  const paymentOptions = PAYMENT_OPTIONS.filter((option) => enabledMethods.has(option.value));

  async function resolveAddressId(form: FormData): Promise<string> {
    if (!addingAddress) return selectedAddressId;

    const newAddress = await apiFetch<Address>("/users/me/addresses", {
      method: "POST",
      body: {
        label: (form.get("label") as string) || undefined,
        line1: form.get("line1") as string,
        line2: (form.get("line2") as string) || undefined,
        city: form.get("city") as string,
        postalCode: (form.get("postalCode") as string) || undefined,
        country: (form.get("country") as string) || undefined,
        phone: form.get("addressPhone") as string,
      },
    });
    setAddresses((prev) => [...prev, newAddress]);
    return newAddress.id;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("submitting");
    setError("");

    let createdOrder: Order;
    try {
      const addressId = await resolveAddressId(form);

      createdOrder = await apiFetch<Order>("/orders", {
        method: "POST",
        body: {
          addressId,
          paymentMethod,
          contactEmail,
          contactPhone,
          discountCode: discountCode.trim() || undefined,
          notes: notes.trim() || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
        },
      });
      setOrder(createdOrder);
      // The order already exists and the backend has cleared the matching
      // cart rows, regardless of what happens with payment next — sync the
      // UI now so it's never left showing a stale cart.
      await clearCart();
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && discountCode.trim()) {
        setError(`${err.message} — you can retry without the discount code.`);
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
      return;
    }

    try {
      const result = await initiatePayment(createdOrder.id);
      setPaymentResult(result);
      setStatus(result.type === "none" ? "done" : "awaiting_payment");
    } catch (err) {
      setStatus("payment_init_error");
      setError(err instanceof ApiError ? err.message : "Couldn't start payment");
    }
  }

  function retryWithoutDiscount() {
    setDiscountCode("");
    setStatus("idle");
    setError("");
  }

  if (cartStatus === "loading") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center py-24">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft">
          Loading…
        </p>
      </section>
    );
  }

  if (
    items.length === 0 &&
    status !== "done" &&
    status !== "awaiting_payment" &&
    status !== "failed"
  ) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft">
          Your cart is empty
        </p>
        <Link href="/#collection" className="transition-opacity hover:opacity-80">
          <BrushButton>[ Back to collection ]</BrushButton>
        </Link>
      </section>
    );
  }

  if (status === "awaiting_payment" && order && paymentResult) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-clay">
          [ Order {order.orderNumber} placed ]
        </p>
        {paymentResult.type === "redirect" && (
          <GatewayRedirect actionUrl={paymentResult.actionUrl} fields={paymentResult.fields} />
        )}
        {paymentResult.type === "redirect_simple" && (
          <SimpleGatewayRedirect url={paymentResult.url} />
        )}
        {paymentResult.type === "bank_transfer" && (
          <BankTransferPanel order={order} result={paymentResult} />
        )}
        {paymentResult.type === "demo" && (
          <DemoPaymentPanel
            order={order}
            onResolved={(outcome) => setStatus(outcome === "success" ? "done" : "failed")}
          />
        )}
      </section>
    );
  }

  if (status === "failed" && order) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-clay">
          [ Payment failed for order {order.orderNumber} ]
        </p>
        <p className="max-w-sm text-sm text-ink-soft">
          The payment wasn&apos;t successful. Your order is saved — you can try again from your
          account page.
        </p>
        <Link href="/#collection" className="mt-2 transition-opacity hover:opacity-80">
          <BrushButton>[ Back to collection ]</BrushButton>
        </Link>
      </section>
    );
  }

  if (status === "payment_init_error" && order) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-clay">
          [ Order {order.orderNumber} placed — payment couldn&apos;t start ]
        </p>
        <p className="max-w-sm text-sm text-ink-soft">{error}</p>
        <p className="max-w-sm text-xs text-ink-soft/70">
          Your order is saved and awaiting payment — contact us and we&apos;ll help you complete
          it another way.
        </p>
        <Link href="/#collection" className="mt-2 transition-opacity hover:opacity-80">
          <BrushButton>[ Back to collection ]</BrushButton>
        </Link>
      </section>
    );
  }

  if (status === "done" && order) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-clay">
          [ Order {order.orderNumber} received ]
        </p>
        <p className="max-w-sm text-sm text-ink-soft">
          Thanks — we&apos;ll contact you shortly to confirm your order of $
          {order.total}.
        </p>
        <Link href="/#collection" className="mt-2 transition-opacity hover:opacity-80">
          <BrushButton>[ Back to collection ]</BrushButton>
        </Link>
      </section>
    );
  }

  const lines = items.map((item) => ({
    item,
    product: serializeProduct(item.product),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <div className="bg-ink px-6 py-12 sm:px-12 lg:py-16">
        <div className="mx-auto max-w-md">
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-10"
          >
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl uppercase text-paper">Contact</h2>
              <input
                type="email"
                required
                placeholder="Email address"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className={inputClass}
              />
              <input
                type="tel"
                required
                placeholder="Phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl uppercase text-paper">Delivery</h2>

              {addresses.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex items-start gap-3 border border-paper/20 px-4 py-3 text-sm text-paper"
                    >
                      <input
                        type="radio"
                        name="addressId"
                        checked={!addingAddress && selectedAddressId === address.id}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setAddingAddress(false);
                        }}
                        className="mt-1 accent-paper"
                      />
                      <span>
                        {address.label && (
                          <span className="block font-mono text-xs uppercase tracking-[0.1em] text-paper/60">
                            {address.label}
                          </span>
                        )}
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                      </span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddingAddress(true)}
                    className="text-left font-mono text-xs uppercase tracking-[0.1em] text-paper/70 underline underline-offset-4 hover:text-paper"
                  >
                    + Add a new address
                  </button>
                </fieldset>
              )}

              {addingAddress && (
                <div className="flex flex-col gap-4 border border-paper/20 p-4">
                  <input
                    name="label"
                    type="text"
                    placeholder="Label (optional, e.g. Home)"
                    className={inputClass}
                  />
                  <input
                    name="line1"
                    type="text"
                    required
                    placeholder="Address"
                    className={inputClass}
                  />
                  <input
                    name="line2"
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      name="city"
                      type="text"
                      required
                      placeholder="City"
                      className={inputClass}
                    />
                    <input
                      name="postalCode"
                      type="text"
                      placeholder="Postal code (optional)"
                      className={inputClass}
                    />
                  </div>
                  <input
                    name="country"
                    type="text"
                    placeholder="Country (default: Pakistan)"
                    className={inputClass}
                  />
                  <input
                    name="addressPhone"
                    type="tel"
                    required
                    placeholder="Phone for delivery"
                    className={inputClass}
                  />
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddingAddress(false)}
                      className="text-left font-mono text-xs uppercase tracking-[0.1em] text-paper/60 underline underline-offset-4 hover:text-paper"
                    >
                      Use a saved address instead
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-xl uppercase text-paper">Payment Method</h2>
              <fieldset className="flex flex-col gap-2">
                {paymentOptions.map((option) => {
                  const isDemoGateway =
                    paymentSettings.mode === "DEMO" && !ALWAYS_AVAILABLE.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 border border-paper/20 px-4 py-3 text-sm text-paper"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="accent-paper"
                      />
                      {option.label}
                      {isDemoGateway ? (
                        <span className="ml-auto border border-clay px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-clay">
                          Demo
                        </span>
                      ) : (
                        option.hint && (
                          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-paper/40">
                            {option.hint}
                          </span>
                        )
                      )}
                    </label>
                  );
                })}
              </fieldset>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-xl uppercase text-paper">
                Notes (optional)
              </h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Delivery instructions, etc."
                rows={3}
                className={inputClass}
              />
            </div>

            {status === "error" && (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-xs text-clay">[ {error} ]</p>
                {discountCode.trim() && (
                  <button
                    type="button"
                    onClick={retryWithoutDiscount}
                    className="w-fit font-mono text-xs uppercase tracking-[0.1em] text-paper/70 underline underline-offset-4 hover:text-paper"
                  >
                    [ Retry without discount code ]
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <BrushButton className="w-full">
                {status === "submitting" ? "[ Placing order… ]" : "[ Place Order ]"}
              </BrushButton>
            </button>
          </form>
        </div>
      </div>

      <div className="bg-paper px-6 py-12 sm:px-12 lg:py-16">
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <div className="flex flex-col gap-5">
            {lines.map(({ item, product }) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-paper-dim">
                  <Image
                    src={product.primaryImage}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-paper">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-ink">{product.name}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.05em] text-ink-soft">
                    {item.size}
                  </span>
                </div>
                <span className="font-mono text-sm text-ink">
                  ${product.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-ink pt-6">
            <input
              type="text"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value)}
              placeholder="Discount code (applied at checkout)"
              className="flex-1 border border-ink bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-ink pt-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                Subtotal
              </span>
              <span className="font-mono text-sm text-ink">${subtotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                Shipping
              </span>
              <span className="font-mono text-sm text-ink">Free</span>
            </div>
            <p className="font-mono text-[11px] text-ink-soft/70">
              Discount, if any, is applied when the order is placed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
