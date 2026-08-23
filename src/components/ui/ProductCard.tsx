"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, Tone } from "@/types";
import { PriceTag } from "@/components/ui/PriceTag";
import { BrushButton } from "@/components/ui/BrushButton";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { DiscountBadge } from "@/components/ui/DiscountBadge";
import { SizeSelector } from "@/components/ui/SizeSelector";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useCart } from "@/lib/CartContext";

const EASE = [0.16, 1, 0.3, 1] as const;

const TONE_CLASSES: Record<Tone, string> = {
  ink: "bg-ink",
  navy: "bg-navy",
  clay: "bg-clay",
  sand: "bg-sand",
  dune: "bg-dune",
};

export function ProductCard({ product }: { product: Product }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [showFlat, setShowFlat] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showShopNow, setShowShopNow] = useState(false);
  const [imageRevealed, setImageRevealed] = useState(false);
  const [pickingSize, setPickingSize] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  async function handleQuickAddSize(size: string) {
    setPickingSize(false);
    try {
      await addToCart(product.id, size);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // Errors (e.g. out of stock) are rare here since size is only offered
      // via SizeSelector, which is already scoped to product.sizes; a fuller
      // message is available on the product detail page's AddToCartButton.
    }
  }

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Force a paint of the hidden state before flipping to visible,
          // otherwise the transition has nothing to animate from when the
          // element is already in view on mount.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setImageRevealed(true)),
          );
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="group flex flex-col gap-4">
      <div
        ref={frameRef}
        onMouseEnter={() => {
          setShowFlat(true);
          setHovering(true);
        }}
        onMouseLeave={() => {
          setShowFlat(false);
          setHovering(false);
          setShowShopNow(false);
        }}
        onClick={() => setShowShopNow((v) => !v)}
        data-cursor-zone
        className={`relative aspect-[4/5] w-full cursor-pointer overflow-hidden ${TONE_CLASSES[product.tone]}`}
      >
        <div
          className="absolute inset-0 transition-[clip-path] duration-[900ms] ease-out"
          style={{
            clipPath: imageRevealed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          }}
        >
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-[opacity,transform] duration-[700ms] ease-out ${
              showFlat ? "opacity-0" : "opacity-100"
            } ${imageRevealed ? (hovering ? "scale-[1.08]" : "scale-100") : "scale-110"}`}
          />
          <Image
            src={product.flatImage}
            alt={`${product.name} — product only`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-[opacity,transform] duration-[700ms] ease-out ${
              showFlat ? "opacity-100" : "opacity-0"
            } ${imageRevealed ? (hovering ? "scale-[1.08]" : "scale-100") : "scale-110"}`}
          />
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4">
          <CategoryPill className="border-paper bg-paper/90 text-ink">
            {product.category.name}
          </CategoryPill>
        </div>

        <WishlistButton
          productId={product.id}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink"
        />

        {product.compareAtPrice !== undefined && (
          <DiscountBadge
            percentOff={Math.round(
              ((product.compareAtPrice - product.price) /
                product.compareAtPrice) *
                100,
            )}
          />
        )}

        <AnimatePresence>
          {showShopNow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-0 flex items-center justify-center bg-ink/50"
            >
              <Link
                href={`/products/${product.slug}`}
                onClick={(event) => event.stopPropagation()}
                className="transition-transform hover:scale-105"
              >
                <BrushButton>[ Shop Now ]</BrushButton>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 font-display text-lg uppercase text-ink transition-opacity hover:opacity-70">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 max-w-xs text-sm text-ink-soft">
            {product.description}
          </p>
        </div>
        <div className="flex-shrink-0 whitespace-nowrap text-right">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
      {pickingSize ? (
        <div className="mt-1 flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            Select size
          </span>
          <SizeSelector
            sizes={product.sizes}
            selected={null}
            onSelect={handleQuickAddSize}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickingSize(true)}
          className="mt-1 w-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.1em] text-paper transition-all duration-300 hover:opacity-80 hover:tracking-[0.15em]"
        >
          {added ? "Added" : "+ Quick Add"}
        </button>
      )}
    </article>
  );
}
