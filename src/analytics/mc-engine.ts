import type { MCConfig, MCResult } from '@/types';
import { mean, stdDev, percentiles as computePercentiles } from './stats';
import { coveredCallPnL, expectedPayoutShort } from './mc-pnl';
import { createRng } from '@/lib/seedrandom';

/**
 * Box-Muller transform: generates a standard normal variate from two uniform variates.
 */
function boxMuller(rng: () => number): number {
  let u1 = rng();
  // Avoid log(0)
  while (u1 === 0) u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Geometric Brownian Motion Monte Carlo.
 * S(t+dt) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
 * Uses zero drift (mu=0) for conservative estimation.
 */
export function runGBM(config: MCConfig): MCResult {
  const { spotPrice, strike, iv, dte, premium, shares, costBasis, paths, seed } = config;
  const rng = createRng(seed);
  const dt = 1 / 252;
  const steps = Math.round(dte * 252 / 365); // convert calendar days to trading days
  const sigma = iv;
  const drift = -0.5 * sigma * sigma * dt;
  const diffusion = sigma * Math.sqrt(dt);

  const terminalPrices = new Array<number>(paths);

  for (let i = 0; i < paths; i++) {
    let S = spotPrice;
    for (let t = 0; t < steps; t++) {
      const Z = boxMuller(rng);
      S *= Math.exp(drift + diffusion * Z);
    }
    terminalPrices[i] = S;
  }

  return buildResult(config, terminalPrices, spotPrice, strike, premium, shares, costBasis, paths);
}

/**
 * Bootstrap Monte Carlo: resample from historical log returns.
 * Captures fat tails and real-world distribution.
 */
export function runBootstrap(config: MCConfig): MCResult {
  const { spotPrice, strike, dte, premium, shares, costBasis, paths, historicalReturns, seed } = config;

  if (!historicalReturns || historicalReturns.length === 0) {
    throw new Error('Bootstrap mode requires historicalReturns');
  }

  const rng = createRng(seed);
  const terminalPrices = new Array<number>(paths);
  const n = historicalReturns.length;

  for (let i = 0; i < paths; i++) {
    let cumReturn = 0;
    for (let t = 0; t < dte; t++) {
      const idx = Math.floor(rng() * n);
      cumReturn += historicalReturns[idx]!;
    }
    terminalPrices[i] = spotPrice * Math.exp(cumReturn);
  }

  return buildResult(config, terminalPrices, spotPrice, strike, premium, shares, costBasis, paths);
}

/**
 * Dispatcher: runs the appropriate MC model.
 */
export function runMC(config: MCConfig): MCResult {
  return config.model === 'gbm' ? runGBM(config) : runBootstrap(config);
}

function buildResult(
  _config: MCConfig,
  terminalPrices: number[],
  _spotPrice: number,
  strike: number,
  premium: number,
  shares: number,
  costBasis: number,
  paths: number,
): MCResult {
  const terminalPnL = new Array<number>(paths);
  let assignedCount = 0;

  for (let i = 0; i < paths; i++) {
    const S_T = terminalPrices[i]!;
    terminalPnL[i] = coveredCallPnL(S_T, costBasis, strike, premium, shares);
    if (S_T > strike) assignedCount++;
  }

  const epShort = expectedPayoutShort(terminalPrices, strike);

  return {
    paths,
    terminalPrices,
    terminalPnL,
    expectedReturn: mean(terminalPnL),
    stdDev: stdDev(terminalPnL),
    pAssignment: assignedCount / paths,
    expectedPayoutShort: epShort,
    percentiles: computePercentiles(terminalPnL),
  };
}
