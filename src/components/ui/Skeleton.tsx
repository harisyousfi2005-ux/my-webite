export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-paper-dim ${className}`} />;
}
