export function CategoryPill({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block w-fit rounded-full border border-ink px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-ink ${className}`}
    >
      {children}
    </span>
  );
}
