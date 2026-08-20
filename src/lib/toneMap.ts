import type { Tone } from "@/types";

const CATEGORY_TONE_MAP: Record<string, Tone> = {
  abaya: "ink",
  burqa: "navy",
  niqab: "ink",
  kids: "navy",
  hijab: "clay",
};

const TONE_CYCLE: Tone[] = ["ink", "navy", "clay", "sand", "dune"];

function hash(value: string): number {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) sum += value.charCodeAt(i);
  return sum;
}

/**
 * Cosmetic per-category color theme. Not a backend field — the product
 * catalog has no concept of "tone", so it's derived here, keyed by the
 * category slug (stable/unique) with a deterministic fallback for any
 * category not in the hand-picked map, so new categories never crash or
 * silently collapse to one look.
 */
export function toneForCategory(slug: string): Tone {
  return CATEGORY_TONE_MAP[slug] ?? TONE_CYCLE[hash(slug) % TONE_CYCLE.length];
}
