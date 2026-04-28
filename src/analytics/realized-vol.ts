import { stdDev } from './stats';
import { TRADING_DAYS_PER_YEAR } from '@/lib/constants';

/**
 * Annualized realized volatility from daily closing prices.
 * Uses log returns and population std dev, annualized by sqrt(252).
 */
export function realizedVol(prices: number[]): number {
  if (prices.length < 2) return 0;
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i]! / prices[i - 1]!));
  }
  return stdDev(logReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}
