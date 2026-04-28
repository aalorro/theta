import { describe, it, expect } from 'vitest';
import { vrp } from '../vrp';

describe('vrp', () => {
  it('returns 0 when IV equals realized vol', () => {
    expect(vrp(0.25, 0.25)).toBe(0);
  });

  it('returns 1.0 when IV is double realized vol', () => {
    expect(vrp(0.50, 0.25)).toBe(1.0);
  });

  it('returns negative when IV is below realized vol', () => {
    const result = vrp(0.15, 0.25);
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-0.4, 5);
  });

  it('returns null when realized vol is zero', () => {
    expect(vrp(0.25, 0)).toBeNull();
  });

  it('returns null when realized vol is negative', () => {
    expect(vrp(0.25, -0.1)).toBeNull();
  });

  it('returns ~0.20 for typical favorable VRP', () => {
    // IV = 0.30, RV = 0.25 → (0.30-0.25)/0.25 = 0.20
    expect(vrp(0.30, 0.25)).toBeCloseTo(0.20, 5);
  });
});
