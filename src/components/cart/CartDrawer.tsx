"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/CartContext";
import { PRODUCTS } from "@/lib/data";
import { BrushButton } from "@/components/ui/BrushButton";

type Status = "idle" | "submitting" | "done" | "error";

export function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    isOpen,
    closeCart,
  } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          address: form.get("address"),
          paymentMethod: form.get("paymentMethod"),
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("done");
      clearCart();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-ink/50"
      />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase text-ink">Cart</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
          >
            [ Close ]
          </button>
        </div>

        {items.length === 0 && status !== "done" && (
          <p className="mt-8 text-sm text-ink-soft">
            Your cart is empty.
          </p>
        )}

        {status === "done" ? (
          <div className="mt-8 border border-ink px-6 py-8">
            <p className="font-mono text-sm uppercase tracking-[0.1em] text-clay">
              [ Order received ]
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Thanks — we&apos;ll contact you shortly to confirm your order.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-1 flex-col gap-6">
              {items.map((item) => {
                const product = PRODUCTS.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.productId} className="flex gap-4">
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-paper-dim">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <h3 className="font-display text-sm uppercase text-ink">
                        {product.name}
                      </h3>
                      <span className="font-mono text-xs text-clay">
                        ${product.price}
                      </span>
                      <div className="mt-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="h-6 w-6 border border-ink text-xs text-ink transition-opacity hover:opacity-60"
                        >
                          −
                        </button>
                        <span className="font-mono text-xs text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="h-6 w-6 border border-ink text-xs text-ink transition-opacity hover:opacity-60"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-clay"
                        >
                          [ Remove ]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <div className="mt-6 border-t border-ink pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                    Subtotal
                  </span>
                  <span className="font-mono text-lg text-clay">
                    ${totalPrice}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Name"
                    className="border-b border-ink bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
                  />
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Phone"
                    className="border-b border-ink bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
                  />
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="Delivery address"
                    className="border-b border-ink bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
                  />

                  <fieldset className="flex flex-col gap-2">
                    <legend className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                      Payment method
                    </legend>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        defaultChecked
                        className="accent-ink"
                      />
                      Cash on delivery
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        className="accent-ink"
                      />
                      Card on delivery (POS at your door)
                    </label>
                  </fieldset>

                  {status === "error" && (
                    <p className="font-mono text-xs text-clay">[ {error} ]</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-2 w-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    <BrushButton className="w-full">
                      {status === "submitting"
                        ? "[ Placing order… ]"
                        : "[ Checkout ]"}
                    </BrushButton>
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
