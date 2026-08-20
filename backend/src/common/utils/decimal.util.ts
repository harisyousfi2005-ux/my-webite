import { Prisma } from '@prisma/client';

/** Converts a Prisma Decimal (or null) to a plain JS number for JSON responses. */
export function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : value.toNumber();
}
