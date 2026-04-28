import type { Quote, OptionChain, DailyBar, IVPoint } from './market-data';
import type { Position } from './position';

export interface DataAdapter {
  getQuote(symbol: string): Promise<Quote>;
  getChain(symbol: string, expiration?: string): Promise<OptionChain>;
  getExpirations(symbol: string): Promise<string[]>;
  getHistoricalPrices(symbol: string, days: number): Promise<DailyBar[]>;
  getHistoricalIV(symbol: string, days: number): Promise<IVPoint[]>;
  getRealizedVol(symbol: string, days: number): Promise<number>;
  getPositions(accountId: string): Promise<Position[]>;
  getVIXSeries(days: number): Promise<DailyBar[]>;
  getVIXTermStructure(): Promise<{ vix9d: number; vix: number; vix3m: number }>;
  getMacroSeries(seriesId: string, days: number): Promise<DailyBar[]>;
  getNextEarnings(symbol: string): Promise<{ date: string } | null>;
}
