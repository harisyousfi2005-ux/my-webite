const STARBURST_SHAPE =
  "polygon(50.0% 0.0%, 59.8% 13.3%, 75.0% 6.7%, 76.9% 23.1%, 93.3% 25.0%, 86.7% 40.2%, 100.0% 50.0%, 86.7% 59.8%, 93.3% 75.0%, 76.9% 76.9%, 75.0% 93.3%, 59.8% 86.7%, 50.0% 100.0%, 40.2% 86.7%, 25.0% 93.3%, 23.1% 76.9%, 6.7% 75.0%, 13.3% 59.8%, 0.0% 50.0%, 13.3% 40.2%, 6.7% 25.0%, 23.1% 23.1%, 25.0% 6.7%, 40.2% 13.3%)";

export function DiscountBadge({ percentOff }: { percentOff: number }) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 flex h-14 w-14 rotate-[8deg] items-center justify-center sm:h-16 sm:w-16">
      <div
        className="absolute inset-0 bg-ink"
        style={{ clipPath: STARBURST_SHAPE }}
      />
      <span className="relative -rotate-[8deg] text-center font-mono text-[0.65rem] font-bold uppercase leading-tight text-paper sm:text-xs">
        -{percentOff}%
        <br />
        off
      </span>
    </div>
  );
}
