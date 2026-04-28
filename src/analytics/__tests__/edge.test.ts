import { describe, it, expect } from 'vitest';
import { edgePerContract } from '../edge';
import { bsCallPrice } from '../black-scholes';
import { runGBM } from '../mc-engine';
import type { MCConfig } from '@/types';

describe('edgePerContract', () => {
  it('returns 0 when premium equals expected payout', () => {
    expect(edgePerContract(3.0, 3.0)).toBe(0);
  });

  it('positive edge when premium > expected payout (overpriced option)', () => {
    const edge = edgePerContract(5.0, 3.0);
    expect(edge).toBe(200); // (5 - 3) * 100
  });

  it('negative edge when premium < expected payout (underpriced option)', () => {
    const edge = edgePerContract(2.0, 3.0);
    expect(edge).toBe(-100); // (2 - 3) * 100
  });

  it('edge is approximately 0 when premium equals Black-Scholes fair value', () => {
    const S = 100, K = 100, T = 30 / 365, r = 0, sigma = 0.30;
    const bsPrice = bsCallPrice(S, K, T, r, sigma);

    // Run MC to get expected payout
    const config: MCConfig = {
      spotPrice: S,
      strike: K,
      iv: sigma,
      dte: 30,
      premium: bsPrice,
      shares: 1,
      costBasis: S,
      paths: 50000,
      model: 'gbm',
      seed: 999,
    };
    const result = runGBM(config);

    // Edge should be near zero (within $30 per contract for 50K paths)
    const edge = edgePerContract(bsPrice, result.expectedPayoutShort);
    expect(Math.abs(edge)).toBeLessThan(30);
  });
});
