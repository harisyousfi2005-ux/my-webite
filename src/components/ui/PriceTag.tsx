export function PriceTag({
  price,
  compareAtPrice,
  size = "sm",
}: {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "lg";
}) {
  const onSale = compareAtPrice !== undefined && compareAtPrice > price;
  const percentOff = onSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const priceClass = size === "lg" ? "text-xl" : "text-sm";

  return (
    <span className="inline-flex items-baseline gap-2 font-mono">
      <span className={`${priceClass} text-clay`}>${price}</span>
      {onSale && (
        <>
          <span className="text-xs text-ink-soft line-through">
            ${compareAtPrice}
          </span>
          <span className="text-xs uppercase tracking-[0.1em] text-clay">
            [ -{percentOff}% ]
          </span>
        </>
      )}
    </span>
  );
}
