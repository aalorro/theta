import { describe, it, expect } from 'vitest';
import { realizedVol } from '../realized-vol';

describe('realizedVol', () => {
  it('returns 0 for fewer than 2 prices', () => {
    expect(realizedVol([])).toBe(0);
    expect(realizedVol([100])).toBe(0);
  });

  it('returns 0 for constant prices', () => {
    expect(realizedVol([100, 100, 100, 100])).toBe(0);
  });

  it('computes annualized realized vol correctly', () => {
    // 20 prices with known daily returns
    // If daily returns have stddev of ~0.01, annualized ≈ 0.01 * sqrt(252) ≈ 0.159
    const prices: number[] = [100];
    const dailyReturns = [
      0.01, -0.005, 0.008, -0.012, 0.003,
      0.015, -0.007, 0.002, -0.01, 0.006,
      0.01, -0.005, 0.008, -0.012, 0.003,
      0.015, -0.007, 0.002, -0.01, 0.006,
    ];
    for (const r of dailyReturns) {
      prices.push(prices[prices.length - 1]! * Math.exp(r));
    }

    const rv = realizedVol(prices);
    // Should be roughly 0.13-0.16 annualized
    expect(rv).toBeGreaterThan(0.10);
    expect(rv).toBeLessThan(0.20);
  });

  it('higher volatility prices produce higher realized vol', () => {
    // Low vol series
    const lowVol = [100, 100.5, 100.2, 100.8, 100.3, 100.6];
    // High vol series
    const highVol = [100, 105, 95, 108, 92, 103];

    expect(realizedVol(highVol)).toBeGreaterThan(realizedVol(lowVol));
  });
});
