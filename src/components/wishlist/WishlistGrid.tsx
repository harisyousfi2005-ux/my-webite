"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/WishlistContext";
import { serializeProduct } from "@/lib/adapters";
import { ProductCard } from "@/components/ui/ProductCard";
import { BrushButton } from "@/components/ui/BrushButton";

export function WishlistGrid() {
  const { items, status } = useWishlist();

  if (status === "loading") {
    return <p className="text-sm text-ink-soft">Loading your wishlist…</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-clay">Couldn&apos;t load your wishlist.</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-ink-soft">Your wishlist is empty.</p>
        <Link href="/#collection" className="transition-opacity hover:opacity-80">
          <BrushButton>[ Browse the collection ]</BrushButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ProductCard key={item.id} product={serializeProduct(item.product)} />
      ))}
    </div>
  );
}
