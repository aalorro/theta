import type { DataAdapter, Quote, OptionChain, OptionLeg, DailyBar, IVPoint, Position } from '@/types';
import { realizedVol } from '@/analytics/realized-vol';
import { bsDelta } from '@/analytics/black-scholes';

/**
 * Mock data adapter for testing and offline development.
 * Returns realistic synthetic data for any symbol.
 */
export class MockAdapter implements DataAdapter {
  private basePrices: Record<string, number> = {
    AAPL: 175,
    MSFT: 420,
    GOOGL: 170,
    NVDA: 880,
    SPY: 520,
    QQQ: 440,
    TSLA: 175,
    AMZN: 185,
    META: 500,
  };

  private getBasePrice(symbol: string): number {
    return this.basePrices[symbol] ?? 100;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const price = this.getBasePrice(symbol);
    const spread = price * 0.001;
    return {
      symbol,
      last: price,
      bid: price - spread / 2,
      ask: price + spread / 2,
      volume: 5_000_000 + Math.floor(Math.random() * 10_000_000),
      timestamp: Date.now(),
    };
  }

  async getChain(symbol: string, expiration?: string): Promise<OptionChain> {
    const spot = this.getBasePrice(symbol);
    if (!expiration) {
      const exps = await this.getExpirations(symbol);
      expiration = exps[0]!;
    }

    const dte = Math.max(1, Math.round(
      (new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ));
    const T = dte / 365;
    const baseIV = 0.25 + Math.random() * 0.15;

    // Generate strikes around the spot price
    const strikeStep = spot < 50 ? 1 : spot < 200 ? 2.5 : spot < 500 ? 5 : 10;
    const strikes: number[] = [];
    for (let k = spot * 0.85; k <= spot * 1.15; k += strikeStep) {
      strikes.push(Math.round(k / strikeStep) * strikeStep);
    }

    const makeLeg = (strike: number, type: 'call' | 'put'): OptionLeg => {
      const moneyness = (strike / spot - 1);
      const skewAdj = type === 'call' ? moneyness * -0.3 : moneyness * 0.3;
      const iv = Math.max(0.05, baseIV + skewAdj);
      const delta = type === 'call'
        ? bsDelta(spot, strike, T, 0, iv)
        : bsDelta(spot, strike, T, 0, iv) - 1;
      const mid = Math.max(0.01, spot * iv * Math.sqrt(T) * 0.4 * Math.exp(-moneyness * moneyness * 5));
      const spread = mid * (0.02 + Math.random() * 0.08);

      return {
        symbol: `${symbol}${expiration!.replace(/-/g, '')}${type === 'call' ? 'C' : 'P'}${String(strike).padStart(8, '0')}`,
        underlying: symbol,
        strike,
        expiration: expiration!,
        type,
        bid: Math.max(0, mid - spread / 2),
        ask: mid + spread / 2,
        mid,
        last: mid + (Math.random() - 0.5) * spread,
        volume: Math.floor(Math.random() * 5000),
        openInterest: Math.floor(100 + Math.random() * 10000),
        iv,
        delta: Math.abs(delta) < 0.001 ? 0 : delta,
        gamma: 0.02 + Math.random() * 0.03,
        theta: -(mid / dte) * (0.8 + Math.random() * 0.4),
        vega: spot * Math.sqrt(T) * 0.01,
      };
    };

    return {
      underlying: symbol,
      expiration: expiration!,
      calls: strikes.map((k) => makeLeg(k, 'call')),
      puts: strikes.map((k) => makeLeg(k, 'put')),
    };
  }

  async getExpirations(symbol: string): Promise<string[]> {
    void symbol;
    const exps: string[] = [];
    const now = new Date();
    // Generate ~6 monthly + some weekly expirations
    for (let i = 1; i <= 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i * 7);
      // Find next Friday
      while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
      exps.push(d.toISOString().split('T')[0]!);
    }
    return exps;
  }

  async getHistoricalPrices(symbol: string, days: number): Promise<DailyBar[]> {
    const base = this.getBasePrice(symbol);
    const bars: DailyBar[] = [];
    let price = base * (0.85 + Math.random() * 0.15);

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const ret = (Math.random() - 0.48) * 0.03; // slight upward bias
      price *= 1 + ret;
      const dayRange = price * 0.015;
      bars.push({
        date: d.toISOString().split('T')[0]!,
        open: price - dayRange * (Math.random() - 0.5),
        high: price + dayRange * Math.random(),
        low: price - dayRange * Math.random(),
        close: price,
        volume: 1_000_000 + Math.floor(Math.random() * 5_000_000),
      });
    }
    return bars.slice(-days);
  }

  async getHistoricalIV(_symbol: string, days: number): Promise<IVPoint[]> {
    const points: IVPoint[] = [];
    let iv = 0.20 + Math.random() * 0.15;

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      iv += (Math.random() - 0.5) * 0.02;
      iv = Math.max(0.08, Math.min(iv, 0.80));
      points.push({
        date: d.toISOString().split('T')[0]!,
        iv,
      });
    }
    return points;
  }

  async getRealizedVol(symbol: string, days: number): Promise<number> {
    const prices = await this.getHistoricalPrices(symbol, days + 1);
    return realizedVol(prices.map((p) => p.close));
  }

  async getPositions(_accountId: string): Promise<Position[]> {
    return [];
  }

  async getVIXSeries(days: number): Promise<DailyBar[]> {
    const bars: DailyBar[] = [];
    let vix = 16 + Math.random() * 5;

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      vix += (Math.random() - 0.52) * 1.5;
      vix = Math.max(10, Math.min(vix, 45));
      bars.push({
        date: d.toISOString().split('T')[0]!,
        open: vix,
        high: vix + Math.random() * 2,
        low: vix - Math.random() * 2,
        close: vix,
        volume: 0,
      });
    }
    return bars.slice(-days);
  }

  async getVIXTermStructure(): Promise<{ vix9d: number; vix: number; vix3m: number }> {
    const vix = 16 + Math.random() * 5;
    return {
      vix9d: vix * (0.92 + Math.random() * 0.12),
      vix,
      vix3m: vix * (1.02 + Math.random() * 0.08),
    };
  }

  async getMacroSeries(_seriesId: string, _days: number): Promise<DailyBar[]> {
    return [];
  }

  async getNextEarnings(symbol: string): Promise<{ date: string } | null> {
    void symbol;
    // ~30% chance of upcoming earnings
    if (Math.random() < 0.3) {
      const d = new Date();
      d.setDate(d.getDate() + Math.floor(Math.random() * 45));
      return { date: d.toISOString().split('T')[0]! };
    }
    return null;
  }
}
