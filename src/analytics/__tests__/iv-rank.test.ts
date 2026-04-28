import { describe, it, expect } from 'vitest';
import { ivRank, ivPercentile } from '../iv-rank';
import type { IVPoint } from '@/types';

function makeHistory(ivs: number[]): IVPoint[] {
  return ivs.map((iv, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, iv }));
}

describe('ivRank', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(ivRank([])).toBe(0);
    expect(ivRank(makeHistory([0.3]))).toBe(0);
  });

  it('returns 0 when current IV is at the low', () => {
    expect(ivRank(makeHistory([0.40, 0.35, 0.30, 0.20]))).toBe(0);
  });

  it('returns 1 when current IV is at the high', () => {
    expect(ivRank(makeHistory([0.20, 0.25, 0.30, 0.40]))).toBe(1);
  });

  it('returns 0.5 when current IV is at midpoint', () => {
    expect(ivRank(makeHistory([0.20, 0.40, 0.30]))).toBeCloseTo(0.5, 5);
  });

  it('returns 0.5 when all IVs are equal', () => {
    expect(ivRank(makeHistory([0.30, 0.30, 0.30]))).toBe(0.5);
  });
});

describe('ivPercentile', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(ivPercentile([])).toBe(0);
  });

  it('returns 0 when current IV is the lowest', () => {
    expect(ivPercentile(makeHistory([0.40, 0.35, 0.30, 0.20]))).toBe(0);
  });

  it('returns high percentile when current IV is near top', () => {
    // [0.10, 0.20, 0.30, 0.40] — current is 0.40, 3 of 4 are below = 0.75
    expect(ivPercentile(makeHistory([0.10, 0.20, 0.30, 0.40]))).toBe(0.75);
  });

  it('returns 0.5 for middle value in sorted set', () => {
    // [0.10, 0.20, 0.30, 0.40, 0.25] — current is 0.25, 2 of 5 below = 0.40
    expect(ivPercentile(makeHistory([0.10, 0.20, 0.30, 0.40, 0.25]))).toBeCloseTo(0.40, 5);
  });
});
