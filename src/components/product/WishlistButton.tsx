"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWishlist } from "@/lib/WishlistContext";

export function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [pending, setPending] = useState(false);
  const active = isWishlisted(productId);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await toggleWishlist(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 ${className}`}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={active ? "currentColor" : "none"}
        animate={active ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <path
          d="M12 20.5s-7.5-4.6-10-9.3C.4 7.9 2 4.5 5.4 4c2-.3 3.9.7 5 2.4a5.6 5.6 0 0 1 5-2.4c3.4.5 5 3.9 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </button>
  );
}
