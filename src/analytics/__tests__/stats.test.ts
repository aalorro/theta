import { describe, it, expect } from 'vitest';
import { mean, stdDev, percentile, percentiles, logReturns } from '../stats';

describe('mean', () => {
  it('returns 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('computes mean of single value', () => {
    expect(mean([5])).toBe(5);
  });

  it('computes mean correctly', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('handles negative values', () => {
    expect(mean([-2, 2])).toBe(0);
  });
});

describe('stdDev', () => {
  it('returns 0 for fewer than 2 values', () => {
    expect(stdDev([])).toBe(0);
    expect(stdDev([5])).toBe(0);
  });

  it('computes population std dev', () => {
    // stddev of [2, 4, 4, 4, 5, 5, 7, 9] = 2.0
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 5);
  });

  it('returns 0 for identical values', () => {
    expect(stdDev([3, 3, 3, 3])).toBe(0);
  });
});

describe('percentile', () => {
  it('returns 0 for empty array', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('returns the value for single-element array', () => {
    expect(percentile([42], 50)).toBe(42);
  });

  it('computes median correctly', () => {
    const sorted = [1, 2, 3, 4, 5];
    expect(percentile(sorted, 50)).toBe(3);
  });

  it('interpolates between values', () => {
    const sorted = [10, 20, 30, 40];
    expect(percentile(sorted, 50)).toBeCloseTo(25, 5);
  });
});

describe('percentiles', () => {
  it('computes all five percentiles', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i + 1);
    const p = percentiles(values);
    expect(p.p5).toBeCloseTo(50.95, 0);
    expect(p.p50).toBeCloseTo(500.5, 0);
    expect(p.p95).toBeCloseTo(950.05, 0);
  });
});

describe('logReturns', () => {
  it('returns empty for fewer than 2 prices', () => {
    expect(logReturns([])).toEqual([]);
    expect(logReturns([100])).toEqual([]);
  });

  it('computes log returns correctly', () => {
    const prices = [100, 110, 105];
    const rets = logReturns(prices);
    expect(rets).toHaveLength(2);
    expect(rets[0]).toBeCloseTo(Math.log(110 / 100), 10);
    expect(rets[1]).toBeCloseTo(Math.log(105 / 110), 10);
  });

  it('returns 0 for unchanged prices', () => {
    const rets = logReturns([50, 50, 50]);
    expect(rets[0]).toBe(0);
    expect(rets[1]).toBe(0);
  });
});
