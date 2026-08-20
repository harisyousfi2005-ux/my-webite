export function SizeSelector({
  sizes,
  selected,
  onSelect,
}: {
  sizes: string[];
  selected: string | null;
  onSelect: (size: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSelect(size)}
          className={`h-9 min-w-9 border px-2 font-mono text-xs uppercase tracking-[0.05em] transition-all duration-200 active:scale-95 ${
            selected === size
              ? "border-ink bg-ink text-paper"
              : "border-ink text-ink hover:bg-ink/5"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
