"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import type { Product, Tone } from "@/types";
import { PriceTag } from "@/components/ui/PriceTag";
import { BrushButton } from "@/components/ui/BrushButton";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { useCart } from "@/lib/CartContext";

const TONE_CLASSES: Record<Tone, string> = {
  ink: "bg-ink",
  navy: "bg-navy",
  clay: "bg-clay",
  sand: "bg-sand",
  dune: "bg-dune",
};

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [activeAngle, setActiveAngle] = useState(0);
  const angleCount = product.images.length;
  const { addToCart } = useCart();

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (angleCount <= 1 || !frameRef.current) return;
    const { left, width } = frameRef.current.getBoundingClientRect();
    const ratio = (event.clientX - left) / width;
    const next = Math.min(
      angleCount - 1,
      Math.max(0, Math.floor(ratio * angleCount)),
    );
    setActiveAngle(next);
  }

  return (
    <article className="flex flex-col gap-4">
      <div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setActiveAngle(0)}
        className={`relative aspect-[4/5] w-full overflow-hidden ${TONE_CLASSES[product.tone]}`}
      >
        {product.images.map((src, angleIndex) => (
          <Image
            key={src}
            src={src}
            alt={`${product.name} — angle ${angleIndex + 1}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-opacity duration-200 ease-out ${
              angleIndex === activeAngle ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <span className="pointer-events-none absolute left-4 top-4 font-mono text-xs uppercase tracking-[0.1em] text-paper [text-shadow:0_1px_6px_rgb(0_0_0_/_0.5)]">
          N°{String(index + 1).padStart(2, "0")}
        </span>
        <div className="pointer-events-none absolute bottom-4 left-4">
          <CategoryPill className="border-paper bg-paper/90 text-ink">
            {product.category}
          </CategoryPill>
        </div>

        {product.compareAtPrice !== undefined && (
          <span className="pointer-events-none absolute right-4 top-4 bg-clay px-2 py-1 font-mono text-xs uppercase tracking-[0.1em] text-paper">
            -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
          </span>
        )}

        {angleCount > 1 && (
          <div className="pointer-events-none absolute bottom-4 right-4 flex gap-1.5">
            {product.images.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  dotIndex === activeAngle ? "bg-paper" : "bg-paper/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-display text-lg uppercase text-ink transition-opacity hover:opacity-70">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 max-w-xs text-sm text-ink-soft">
            {product.description}
          </p>
        </div>
        <div className="flex-shrink-0 whitespace-nowrap text-right">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => addToCart(product.id)}
        className="mt-1 inline-block w-fit transition-opacity hover:opacity-80"
      >
        <BrushButton>[ Add to Cart ]</BrushButton>
      </button>
    </article>
  );
}
