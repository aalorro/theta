import type {
  Recommendation,
  RecommendationMetrics,
  RecommendationFlags,
  MCResult,
  MCConfig,
  OptionLeg,
  OptionChain,
  AppConfig,
  DataAdapter,
  Position,
} from '@/types';
import { DAYS_PER_YEAR } from '@/lib/constants';
import { runMC } from './mc-engine';
import { edgePerContract } from './edge';
import { vrp } from './vrp';
import { ivRank as computeIVRank } from './iv-rank';
import { logReturns } from './stats';

// ── Lens scoring ──────────────────────────────────────────────

/** Lens 1: annualized expected total return ($) */
export function scoreLens1(mc: MCResult, dte: number): number {
  if (dte <= 0) return 0;
  return mc.expectedReturn / (dte / DAYS_PER_YEAR);
}

/** Lens 2: annualized yield, -Infinity if assignment risk exceeds threshold */
export function scoreLens2(
  premium: number,
  costBasis: number,
  dte: number,
  pAssignment: number,
  threshold: number,
): number {
  if (pAssignment > threshold) return -Infinity;
  if (costBasis <= 0 || dte <= 0) return 0;
  return (premium / costBasis) * (DAYS_PER_YEAR / dte);
}

/** Lens 3: risk-adjusted return (Sharpe-like) */
export function scoreLens3(mc: MCResult): number {
  if (mc.stdDev <= 0) return 0;
  return mc.expectedReturn / mc.stdDev;
}

// ── Pareto frontier ───────────────────────────────────────────

export type ScoredCandidate = Recommendation & {
  scores: [number, number, number]; // [lens1, lens2, lens3]
};

/**
 * Marks `paretoOptimal` on each candidate.
 * A candidate is Pareto-optimal if no other candidate dominates it on all 3 lenses.
 * O(n²) — fine for typical candidate sets of 10-30.
 */
export function computePareto(candidates: ScoredCandidate[]): void {
  for (const c of candidates) {
    c.flags.paretoOptimal = !candidates.some(
      (d) =>
        d !== c &&
        d.scores[0] >= c.scores[0] &&
        d.scores[1] >= c.scores[1] &&
        d.scores[2] >= c.scores[2] &&
        (d.scores[0] > c.scores[0] || d.scores[1] > c.scores[1] || d.scores[2] > c.scores[2]),
    );
  }
}

// ── Candidate filtering ───────────────────────────────────────

const DELTA_TOLERANCE = 0.05;

function isDeltaCandidate(delta: number, candidateDeltas: number[]): boolean {
  return candidateDeltas.some((target) => Math.abs(Math.abs(delta) - target) <= DELTA_TOLERANCE);
}

function isInMoneynessRange(
  strike: number,
  spot: number,
  range: { min: number; max: number },
): boolean {
  const moneyness = strike / spot - 1;
  return moneyness >= range.min && moneyness <= range.max;
}

function checkLiquidity(
  leg: OptionLeg,
  config: AppConfig,
): boolean {
  if (leg.mid <= 0) return false;
  const spreadPct = (leg.ask - leg.bid) / leg.mid;
  if (spreadPct > config.maxSpreadPctOfMid) return false;
  if (leg.openInterest < config.minOpenInterest) return false;
  return true;
}

// ── Main engine ───────────────────────────────────────────────

export type RankResult = {
  candidates: ScoredCandidate[];
  lens1Top3: ScoredCandidate[];
  lens2Top3: ScoredCandidate[];
  lens3Top3: ScoredCandidate[];
  lensesAgree: boolean;
};

/**
 * Generate and rank covered call candidates for a single holding.
 */
export async function rankCandidates(
  position: Position,
  adapter: DataAdapter,
  config: AppConfig,
): Promise<RankResult> {
  const spot = (await adapter.getQuote(position.symbol)).last;
  const costBasis = position.costBasis > 0 ? position.costBasis : spot;

  // Fetch data in parallel
  const [expirations, historicalPrices, ivHistory, earningsResult] = await Promise.all([
    adapter.getExpirations(position.symbol),
    adapter.getHistoricalPrices(position.symbol, config.bootstrapWindow),
    adapter.getHistoricalIV(position.symbol, 252),
    adapter.getNextEarnings(position.symbol),
  ]);

  const histReturns = logReturns(historicalPrices.map((p) => p.close));
  const ivRankValue = computeIVRank(ivHistory);
  let rv30: number;
  try {
    rv30 = await adapter.getRealizedVol(position.symbol, 30);
  } catch {
    rv30 = 0;
  }

  // Filter expirations to match candidateDTEs (with tolerance)
  const now = Date.now();
  const targetExps = expirations.filter((exp) => {
    const dte = Math.round((new Date(exp).getTime() - now) / (1000 * 60 * 60 * 24));
    return config.candidateDTEs.some((target) => Math.abs(dte - target) <= 7) && dte > 0;
  });

  const candidates: ScoredCandidate[] = [];

  for (const expiration of targetExps) {
    let chain: OptionChain;
    try {
      chain = await adapter.getChain(position.symbol, expiration);
    } catch {
      continue;
    }

    const dte = Math.max(1, Math.round(
      (new Date(expiration).getTime() - now) / (1000 * 60 * 60 * 24),
    ));

    for (const call of chain.calls) {
      // Delta filter
      if (!isDeltaCandidate(call.delta, config.candidateDeltas)) continue;

      // Moneyness filter
      if (!isInMoneynessRange(call.strike, spot, config.moneynessRange)) continue;

      // Skip zero-premium options
      if (call.mid <= 0) continue;

      const premium = call.mid;
      const iv = call.iv > 0 ? call.iv : 0.25; // fallback

      // Run MC simulation
      const mcConfig: MCConfig = {
        spotPrice: spot,
        strike: call.strike,
        iv,
        dte,
        premium,
        shares: position.shares,
        costBasis,
        paths: config.mcPaths,
        model: config.mcModel,
        historicalReturns: config.mcModel === 'bootstrap' ? histReturns : undefined,
      };

      let mc: MCResult;
      try {
        mc = runMC(mcConfig);
      } catch {
        continue;
      }

      // Compute metrics
      const edge = edgePerContract(premium, mc.expectedPayoutShort);
      const vrpValue = vrp(iv, rv30);
      const moneyness = call.strike / spot - 1;

      const s1 = scoreLens1(mc, dte);
      const s2 = scoreLens2(premium, costBasis, dte, mc.pAssignment, config.assignmentThreshold);
      const s3 = scoreLens3(mc);

      // Earnings flag
      const earningsRisk =
        earningsResult != null &&
        new Date(earningsResult.date).getTime() >= now &&
        new Date(earningsResult.date).getTime() <= new Date(expiration).getTime();

      // Liquidity flag
      const liquidityOk = checkLiquidity(call, config);

      const metrics: RecommendationMetrics = {
        expectedReturn: mc.expectedReturn,
        annualizedYield: costBasis > 0 ? (premium / costBasis) * (DAYS_PER_YEAR / dte) : 0,
        riskAdjustedReturn: mc.stdDev > 0 ? mc.expectedReturn / mc.stdDev : 0,
        edgePerContract: edge,
        vrp: vrpValue ?? 0,
      };

      const flags: RecommendationFlags = {
        earningsRisk,
        earningsDate: earningsRisk ? earningsResult!.date : undefined,
        paretoOptimal: false, // set below
        liquidityWarning: !liquidityOk || undefined,
      };

      candidates.push({
        symbol: position.symbol,
        strike: call.strike,
        expiration,
        dte,
        premium,
        delta: call.delta,
        iv,
        ivRank: ivRankValue,
        moneyness,
        mc,
        metrics,
        flags,
        scores: [s1, s2, s3],
      });
    }
  }

  // Compute Pareto frontier
  computePareto(candidates);

  // Rank per lens
  const byLens1 = [...candidates].sort((a, b) => b.scores[0] - a.scores[0]);
  const byLens2 = [...candidates].sort((a, b) => b.scores[1] - a.scores[1]);
  const byLens3 = [...candidates].sort((a, b) => b.scores[2] - a.scores[2]);

  const lens1Top3 = byLens1.slice(0, 3);
  const lens2Top3 = byLens2.slice(0, 3);
  const lens3Top3 = byLens3.slice(0, 3);

  // Check if all three lenses agree on the top pick
  const lensesAgree =
    lens1Top3.length > 0 &&
    lens2Top3.length > 0 &&
    lens3Top3.length > 0 &&
    lens1Top3[0]!.strike === lens2Top3[0]!.strike &&
    lens1Top3[0]!.strike === lens3Top3[0]!.strike &&
    lens1Top3[0]!.expiration === lens2Top3[0]!.expiration;

  return { candidates, lens1Top3, lens2Top3, lens3Top3, lensesAgree };
}
