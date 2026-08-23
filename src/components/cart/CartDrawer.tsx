"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { BrushButton } from "@/components/ui/BrushButton";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    status,
    isOpen,
    closeCart,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="absolute inset-0 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper p-6"
          >
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

            {status === "loading" ? (
              <div className="mt-8 flex flex-col gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex animate-pulse gap-4">
                    <div className="h-24 w-20 flex-shrink-0 bg-paper-dim" />
                    <div className="flex flex-1 flex-col gap-2 pt-1">
                      <div className="h-3 w-2/3 bg-paper-dim" />
                      <div className="h-3 w-1/3 bg-paper-dim" />
                      <div className="h-3 w-1/4 bg-paper-dim" />
                    </div>
                  </div>
                ))}
              </div>
            ) : status === "error" ? (
              <p className="mt-8 text-sm text-clay">
                Couldn&apos;t load your cart. Try reopening it.
              </p>
            ) : items.length === 0 ? (
              <div className="mt-8 flex flex-col gap-3">
                <p className="text-sm text-ink-soft">Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-1 flex-col gap-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex gap-4 overflow-hidden"
                      >
                        <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-paper-dim">
                          <Image
                            src={item.product.images[0]?.url ?? ""}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-display text-sm uppercase text-ink">
                            {item.product.name}
                          </h3>
                          <span className="font-mono text-xs uppercase tracking-[0.05em] text-ink-soft">
                            Size {item.size}
                          </span>
                          <span className="font-mono text-xs text-clay">
                            PKR {item.product.price}
                          </span>
                          <div className="mt-auto flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="h-6 w-6 border border-ink text-xs text-ink transition-all duration-150 hover:opacity-60 active:scale-90"
                            >
                              −
                            </button>
                            <span className="font-mono text-xs text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="h-6 w-6 border border-ink text-xs text-ink transition-all duration-150 hover:opacity-60 active:scale-90"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="ml-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-clay"
                            >
                              [ Remove ]
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="mt-6 border-t border-ink pt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                      Subtotal
                    </span>
                    <span className="font-mono text-lg text-clay">PKR {subtotal}</span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="mt-6 block w-full transition-opacity hover:opacity-80"
                  >
                    <BrushButton className="w-full">[ Proceed to Checkout ]</BrushButton>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
