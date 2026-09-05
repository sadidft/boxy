import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/** Fractional ordering: keys sort lexicographically and never need mass renumbering. */
export function keyBetween(a: string | null | undefined, b: string | null | undefined): string {
  return generateKeyBetween(a ?? null, b ?? null);
}

export function keysBetween(a: string | null | undefined, b: string | null | undefined, n: number): string[] {
  return generateNKeysBetween(a ?? null, b ?? null, n);
}

export function keyAfterAll(keys: string[]): string {
  const sorted = [...keys].sort();
  return keyBetween(sorted[sorted.length - 1] ?? null, null);
}

export function keyBeforeAll(keys: string[]): string {
  const sorted = [...keys].sort();
  return keyBetween(null, sorted[0] ?? null);
}

export function sortByOrder<T extends { order: string }>(items: T[]): T[] {
  return [...items].sort((x, y) => (x.order < y.order ? -1 : x.order > y.order ? 1 : 0));
}

/** True when the longest key in a list grew past the rebalance threshold. */
export function needsRebalance(keys: string[], max = 64): boolean {
  return keys.some((k) => k.length > max);
}
