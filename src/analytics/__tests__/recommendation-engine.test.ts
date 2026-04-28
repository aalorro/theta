import { describe, it, expect } from 'vitest';
import {
  scoreLens1,
  scoreLens2,
  scoreLens3,
  computePareto,
  type ScoredCandidate,
} from '../recommendation-engine';
import type { MCResult, Recommendation } from '@/types';

function makeMC(overrides: Partial<MCResult> = {}): MCResult {
  return {
    paths: 1000,
    terminalPrices: [],
    terminalPnL: [],
    expectedReturn: 500,
    stdDev: 200,
    pAssignment: 0.20,
    expectedPayoutShort: 2.0,
    percentiles: { p5: -300, p25: 100, p50: 400, p75: 700, p95: 1100 },
    ...overrides,
  };
}

function makeCandidate(
  scores: [number, number, number],
  overrides: Partial<Recommendation> = {},
): ScoredCandidate {
  return {
    symbol: 'TEST',
    strike: 100,
    expiration: '2025-06-20',
    dte: 30,
    premium: 3.0,
    delta: 0.25,
    iv: 0.30,
    ivRank: 0.50,
    moneyness: 0.05,
    mc: makeMC(),
    metrics: {
      expectedReturn: 500,
      annualizedYield: 0.12,
      riskAdjustedReturn: 2.5,
      edgePerContract: 100,
      vrp: 0.20,
    },
    flags: { earningsRisk: false, paretoOptimal: false },
    scores,
    ...overrides,
  } as ScoredCandidate;
}

describe('scoreLens1', () => {
  it('annualizes expected return', () => {
    const mc = makeMC({ expectedReturn: 500 });
    // 500 / (30/365) = 6083.33
    expect(scoreLens1(mc, 30)).toBeCloseTo(6083.33, 0);
  });

  it('returns 0 for dte <= 0', () => {
    expect(scoreLens1(makeMC(), 0)).toBe(0);
  });

  it('higher expected return → higher score', () => {
    expect(scoreLens1(makeMC({ expectedReturn: 1000 }), 30))
      .toBeGreaterThan(scoreLens1(makeMC({ expectedReturn: 500 }), 30));
  });
});

describe('scoreLens2', () => {
  it('computes annualized yield', () => {
    // (3 / 100) * (365/30) = 0.365
    expect(scoreLens2(3, 100, 30, 0.10, 0.30)).toBeCloseTo(0.365, 2);
  });

  it('returns -Infinity when pAssignment exceeds threshold', () => {
    expect(scoreLens2(3, 100, 30, 0.35, 0.30)).toBe(-Infinity);
  });

  it('returns 0 when costBasis is 0', () => {
    expect(scoreLens2(3, 0, 30, 0.10, 0.30)).toBe(0);
  });

  it('returns 0 when dte is 0', () => {
    expect(scoreLens2(3, 100, 0, 0.10, 0.30)).toBe(0);
  });

  it('exactly at threshold is still valid', () => {
    expect(scoreLens2(3, 100, 30, 0.30, 0.30)).not.toBe(-Infinity);
  });
});

describe('scoreLens3', () => {
  it('computes risk-adjusted return', () => {
    const mc = makeMC({ expectedReturn: 500, stdDev: 200 });
    expect(scoreLens3(mc)).toBeCloseTo(2.5, 5);
  });

  it('returns 0 when stdDev is 0', () => {
    expect(scoreLens3(makeMC({ stdDev: 0 }))).toBe(0);
  });

  it('negative return → negative score', () => {
    expect(scoreLens3(makeMC({ expectedReturn: -100, stdDev: 200 }))).toBeLessThan(0);
  });
});

describe('computePareto', () => {
  it('single candidate is always Pareto-optimal', () => {
    const candidates = [makeCandidate([10, 10, 10])];
    computePareto(candidates);
    expect(candidates[0]!.flags.paretoOptimal).toBe(true);
  });

  it('identifies dominated candidates', () => {
    // A dominates B on all dimensions
    const A = makeCandidate([10, 10, 10]);
    const B = makeCandidate([5, 5, 5]);
    const candidates = [A, B];
    computePareto(candidates);
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(false);
  });

  it('both Pareto-optimal when neither dominates', () => {
    // A is better on lens 1, B is better on lens 2
    const A = makeCandidate([10, 5, 7]);
    const B = makeCandidate([5, 10, 7]);
    const candidates = [A, B];
    computePareto(candidates);
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(true);
  });

  it('handles 3-way Pareto frontier correctly', () => {
    const A = makeCandidate([10, 3, 3]); // best lens 1
    const B = makeCandidate([3, 10, 3]); // best lens 2
    const C = makeCandidate([3, 3, 10]); // best lens 3
    const D = makeCandidate([2, 2, 2]);  // dominated by all
    const candidates = [A, B, C, D];
    computePareto(candidates);
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(true);
    expect(C.flags.paretoOptimal).toBe(true);
    expect(D.flags.paretoOptimal).toBe(false);
  });

  it('equal scores: neither dominates', () => {
    const A = makeCandidate([5, 5, 5]);
    const B = makeCandidate([5, 5, 5]);
    const candidates = [A, B];
    computePareto(candidates);
    // Neither strictly dominates the other
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(true);
  });

  it('dominance requires strictly better on at least one', () => {
    // A >= B on all, A > B on lens 1 only
    const A = makeCandidate([10, 5, 5]);
    const B = makeCandidate([9, 5, 5]);
    const candidates = [A, B];
    computePareto(candidates);
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(false);
  });

  it('handles -Infinity scores from lens 2', () => {
    const A = makeCandidate([10, -Infinity, 5]);
    const B = makeCandidate([5, 10, 3]);
    const candidates = [A, B];
    computePareto(candidates);
    // B doesn't dominate A (A has higher lens 1 and lens 3)
    expect(A.flags.paretoOptimal).toBe(true);
    expect(B.flags.paretoOptimal).toBe(true);
  });
});
