import type { ReactNode } from "react";

const BRUSH_SHAPE =
  "polygon(3% 18%, 9% 3%, 27% 10%, 47% 1%, 67% 11%, 88% 2%, 97% 20%, 100% 42%, 93% 58%, 100% 80%, 89% 97%, 68% 88%, 46% 100%, 24% 91%, 7% 100%, 0% 76%, 6% 54%, 0% 30%)";

export function BrushButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center px-8 py-4 ${className}`}
    >
      <span
        className="absolute inset-0 bg-ink"
        style={{ clipPath: BRUSH_SHAPE }}
      />
      <span className="relative font-mono text-xs uppercase tracking-[0.1em] text-paper">
        {children}
      </span>
    </span>
  );
}
