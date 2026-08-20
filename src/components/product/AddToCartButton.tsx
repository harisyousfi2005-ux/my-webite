"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { ApiError } from "@/lib/api";
import { BrushButton } from "@/components/ui/BrushButton";
import { SizeSelector } from "@/components/ui/SizeSelector";

export function AddToCartButton({
  productId,
  sizes,
}: {
  productId: string;
  sizes: string[];
}) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [needsSize, setNeedsSize] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!size) {
      setNeedsSize(true);
      return;
    }
    setError("");
    setPending(true);
    try {
      await addToCart(productId, size, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add to cart");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Size{size ? ` — ${size}` : ""}
        </span>
        <SizeSelector
          sizes={sizes}
          selected={size}
          onSelect={(next) => {
            setSize(next);
            setNeedsSize(false);
          }}
        />
        {needsSize && (
          <span className="font-mono text-xs text-clay">
            [ Please select a size ]
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Quantity
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="h-7 w-7 border border-ink text-sm text-ink transition-all duration-150 hover:opacity-60 active:scale-90"
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-sm text-ink">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          aria-label="Increase quantity"
          className="h-7 w-7 border border-ink text-sm text-ink transition-all duration-150 hover:opacity-60 active:scale-90"
        >
          +
        </button>
      </div>

      {error && <span className="font-mono text-xs text-clay">[ {error} ]</span>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={pending}
        className="w-fit transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        <BrushButton>
          {pending ? "[ Adding… ]" : added ? "[ Added ]" : "[ Add to Cart ]"}
        </BrushButton>
      </button>
    </div>
  );
}
