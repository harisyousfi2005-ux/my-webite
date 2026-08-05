"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { BrushButton } from "@/components/ui/BrushButton";

export function AddToCartButton({ productId }: { productId: string }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(productId, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Quantity
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="h-7 w-7 border border-ink text-sm text-ink transition-opacity hover:opacity-60"
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
          className="h-7 w-7 border border-ink text-sm text-ink transition-opacity hover:opacity-60"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="w-fit transition-opacity hover:opacity-80"
      >
        <BrushButton>
          {added ? "[ Added ]" : "[ Add to Cart ]"}
        </BrushButton>
      </button>
    </div>
  );
}
