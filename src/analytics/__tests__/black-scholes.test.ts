import { describe, it, expect } from 'vitest';
import { bsCallPrice, bsDelta } from '../black-scholes';

describe('bsCallPrice', () => {
  it('returns intrinsic value when T=0 and ITM', () => {
    expect(bsCallPrice(110, 100, 0, 0, 0.3)).toBe(10);
  });

  it('returns 0 when T=0 and OTM', () => {
    expect(bsCallPrice(90, 100, 0, 0, 0.3)).toBe(0);
  });

  it('ATM call has correct value', () => {
    // BS ATM call with S=K=100, T=1, r=0.05, sigma=0.2
    // Known value ≈ 10.45
    const price = bsCallPrice(100, 100, 1, 0.05, 0.2);
    expect(price).toBeCloseTo(10.45, 1);
  });

  it('call price increases with volatility', () => {
    const low = bsCallPrice(100, 100, 0.5, 0, 0.2);
    const high = bsCallPrice(100, 100, 0.5, 0, 0.4);
    expect(high).toBeGreaterThan(low);
  });

  it('deep ITM call approaches intrinsic', () => {
    const price = bsCallPrice(200, 100, 0.1, 0, 0.2);
    expect(price).toBeCloseTo(100, 0);
  });

  it('deep OTM call approaches zero', () => {
    const price = bsCallPrice(50, 100, 0.1, 0, 0.2);
    expect(price).toBeCloseTo(0, 2);
  });

  it('zero-drift short-dated ATM call', () => {
    // S=100, K=100, T=30/365, r=0, sigma=0.30
    const price = bsCallPrice(100, 100, 30 / 365, 0, 0.30);
    // BS value ≈ $3.43
    expect(price).toBeCloseTo(3.43, 1);
  });
});

describe('bsDelta', () => {
  it('ATM call has delta near 0.5', () => {
    const delta = bsDelta(100, 100, 1, 0, 0.2);
    expect(delta).toBeCloseTo(0.54, 1);
  });

  it('deep ITM call has delta near 1', () => {
    const delta = bsDelta(200, 100, 1, 0, 0.2);
    expect(delta).toBeCloseTo(1.0, 1);
  });

  it('deep OTM call has delta near 0', () => {
    const delta = bsDelta(50, 100, 1, 0, 0.2);
    expect(delta).toBeCloseTo(0.0, 1);
  });

  it('delta = 1 when expired ITM', () => {
    expect(bsDelta(110, 100, 0, 0, 0.2)).toBe(1);
  });

  it('delta = 0 when expired OTM', () => {
    expect(bsDelta(90, 100, 0, 0, 0.2)).toBe(0);
  });
});
