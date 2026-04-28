import { describe, it, expect } from 'vitest';
import { runGBM, runBootstrap, runMC } from '../mc-engine';
import { bsCallPrice } from '../black-scholes';
import { logReturns } from '../stats';
import type { MCConfig } from '@/types';

const baseConfig: MCConfig = {
  spotPrice: 100,
  strike: 100,
  iv: 0.30,
  dte: 30,
  premium: 3.0,
  shares: 100,
  costBasis: 100,
  paths: 10000,
  model: 'gbm',
  seed: 42,
};

describe('runGBM', () => {
  it('produces the correct number of paths', () => {
    const result = runGBM(baseConfig);
    expect(result.paths).toBe(10000);
    expect(result.terminalPrices).toHaveLength(10000);
    expect(result.terminalPnL).toHaveLength(10000);
  });

  it('is reproducible with seed', () => {
    const r1 = runGBM(baseConfig);
    const r2 = runGBM(baseConfig);
    expect(r1.terminalPrices[0]).toBe(r2.terminalPrices[0]);
    expect(r1.expectedReturn).toBe(r2.expectedReturn);
  });

  it('produces different results with different seeds', () => {
    const r1 = runGBM({ ...baseConfig, seed: 1 });
    const r2 = runGBM({ ...baseConfig, seed: 2 });
    expect(r1.expectedReturn).not.toBe(r2.expectedReturn);
  });

  it('expectedPayoutShort converges to Black-Scholes call price', () => {
    // High path count for convergence
    const config: MCConfig = {
      ...baseConfig,
      paths: 100000,
      seed: 12345,
    };
    const result = runGBM(config);
    const bsPrice = bsCallPrice(100, 100, 30 / 365, 0, 0.30);

    // Should be within 5% of BS price
    const relError = Math.abs(result.expectedPayoutShort - bsPrice) / bsPrice;
    expect(relError).toBeLessThan(0.05);
  });

  it('pAssignment is between 0 and 1', () => {
    const result = runGBM(baseConfig);
    expect(result.pAssignment).toBeGreaterThanOrEqual(0);
    expect(result.pAssignment).toBeLessThanOrEqual(1);
  });

  it('percentiles are ordered correctly', () => {
    const result = runGBM(baseConfig);
    expect(result.percentiles.p5).toBeLessThanOrEqual(result.percentiles.p25);
    expect(result.percentiles.p25).toBeLessThanOrEqual(result.percentiles.p50);
    expect(result.percentiles.p50).toBeLessThanOrEqual(result.percentiles.p75);
    expect(result.percentiles.p75).toBeLessThanOrEqual(result.percentiles.p95);
  });

  it('deep OTM call has low pAssignment', () => {
    const result = runGBM({ ...baseConfig, strike: 130 }); // 30% OTM
    expect(result.pAssignment).toBeLessThan(0.10);
  });

  it('deep ITM call has high pAssignment', () => {
    const result = runGBM({ ...baseConfig, strike: 80 }); // 20% ITM
    expect(result.pAssignment).toBeGreaterThan(0.90);
  });
});

describe('runBootstrap', () => {
  // Generate synthetic historical returns with known properties
  const syntheticPrices: number[] = [];
  let price = 100;
  for (let i = 0; i < 253; i++) {
    syntheticPrices.push(price);
    price *= Math.exp(0.0003 + 0.01 * Math.sin(i)); // deterministic variation
  }
  const historicalReturns = logReturns(syntheticPrices);

  const bootstrapConfig: MCConfig = {
    ...baseConfig,
    model: 'bootstrap',
    historicalReturns,
    paths: 10000,
    seed: 42,
  };

  it('produces the correct number of paths', () => {
    const result = runBootstrap(bootstrapConfig);
    expect(result.paths).toBe(10000);
    expect(result.terminalPrices).toHaveLength(10000);
  });

  it('is reproducible with seed', () => {
    const r1 = runBootstrap(bootstrapConfig);
    const r2 = runBootstrap(bootstrapConfig);
    expect(r1.terminalPrices[0]).toBe(r2.terminalPrices[0]);
  });

  it('throws without historicalReturns', () => {
    expect(() => runBootstrap({ ...bootstrapConfig, historicalReturns: undefined })).toThrow(
      'Bootstrap mode requires historicalReturns',
    );
  });

  it('terminal prices are positive', () => {
    const result = runBootstrap(bootstrapConfig);
    for (const p of result.terminalPrices) {
      expect(p).toBeGreaterThan(0);
    }
  });
});

describe('runMC dispatcher', () => {
  it('dispatches to GBM for model=gbm', () => {
    const result = runMC({ ...baseConfig, model: 'gbm' });
    expect(result.paths).toBe(baseConfig.paths);
  });

  it('dispatches to Bootstrap for model=bootstrap', () => {
    const returns = logReturns(Array.from({ length: 253 }, (_, i) => 100 + i * 0.1));
    const result = runMC({
      ...baseConfig,
      model: 'bootstrap',
      historicalReturns: returns,
    });
    expect(result.paths).toBe(baseConfig.paths);
  });
});
