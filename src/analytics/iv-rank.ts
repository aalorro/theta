import type { IVPoint } from '@/types';

/**
 * IV Rank: where current IV sits relative to its 52-week range.
 * 0 = at the low, 1 = at the high.
 */
export function ivRank(history: IVPoint[]): number {
  if (history.length < 2) return 0;
  const ivs = history.map((h) => h.iv);
  const ivNow = ivs[ivs.length - 1]!;
  const ivMin = Math.min(...ivs);
  const ivMax = Math.max(...ivs);
  const range = ivMax - ivMin;
  if (range === 0) return 0.5;
  return (ivNow - ivMin) / range;
}

/**
 * IV Percentile: what % of historical readings were below current IV.
 */
export function ivPercentile(history: IVPoint[]): number {
  if (history.length < 2) return 0;
  const ivs = history.map((h) => h.iv);
  const ivNow = ivs[ivs.length - 1]!;
  let below = 0;
  for (const iv of ivs) {
    if (iv < ivNow) below++;
  }
  return below / ivs.length;
}
