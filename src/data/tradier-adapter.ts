import type { DataAdapter, Quote, OptionChain, OptionLeg, DailyBar, IVPoint, Position } from '@/types';
import { realizedVol } from '@/analytics/realized-vol';

const SANDBOX_BASE = 'https://sandbox.tradier.com/v1';
const PROD_BASE = 'https://api.tradier.com/v1';

export class TradierAdapter implements DataAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, sandbox = true) {
    this.apiKey = apiKey;
    this.baseUrl = sandbox ? SANDBOX_BASE : PROD_BASE;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Tradier API error: ${res.status} ${res.statusText} for ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async getQuote(symbol: string): Promise<Quote> {
    type TradierQuoteResponse = {
      quotes: {
        quote: {
          symbol: string;
          last: number;
          bid: number;
          ask: number;
          volume: number;
          trade_date: string;
        };
      };
    };

    const data = await this.request<TradierQuoteResponse>('/markets/quotes', {
      symbols: symbol,
      greeks: 'false',
    });

    const q = data.quotes.quote;
    return {
      symbol: q.symbol,
      last: q.last,
      bid: q.bid,
      ask: q.ask,
      volume: q.volume,
      timestamp: Date.now(),
    };
  }

  async getChain(symbol: string, expiration?: string): Promise<OptionChain> {
    if (!expiration) {
      const exps = await this.getExpirations(symbol);
      if (exps.length === 0) throw new Error(`No expirations found for ${symbol}`);
      expiration = exps[0];
    }

    type TradierOption = {
      symbol: string;
      underlying: string;
      strike: number;
      expiration_date: string;
      option_type: 'call' | 'put';
      bid: number;
      ask: number;
      last: number;
      volume: number;
      open_interest: number;
      greeks?: {
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        mid_iv: number;
      };
    };

    type TradierChainResponse = {
      options: {
        option: TradierOption | TradierOption[];
      } | null;
    };

    const data = await this.request<TradierChainResponse>('/markets/options/chains', {
      symbol,
      expiration: expiration!,
      greeks: 'true',
    });

    const options = data.options?.option;
    const optionList: TradierOption[] = !options ? [] : Array.isArray(options) ? options : [options];

    const mapLeg = (o: TradierOption): OptionLeg => ({
      symbol: o.symbol,
      underlying: o.underlying,
      strike: o.strike,
      expiration: o.expiration_date,
      type: o.option_type,
      bid: o.bid ?? 0,
      ask: o.ask ?? 0,
      mid: ((o.bid ?? 0) + (o.ask ?? 0)) / 2,
      last: o.last ?? 0,
      volume: o.volume ?? 0,
      openInterest: o.open_interest ?? 0,
      iv: o.greeks?.mid_iv ?? 0,
      delta: o.greeks?.delta ?? 0,
      gamma: o.greeks?.gamma ?? 0,
      theta: o.greeks?.theta ?? 0,
      vega: o.greeks?.vega ?? 0,
    });

    return {
      underlying: symbol,
      expiration: expiration!,
      calls: optionList.filter((o) => o.option_type === 'call').map(mapLeg),
      puts: optionList.filter((o) => o.option_type === 'put').map(mapLeg),
    };
  }

  async getExpirations(symbol: string): Promise<string[]> {
    type TradierExpResponse = {
      expirations: {
        date: string | string[];
      } | null;
    };

    const data = await this.request<TradierExpResponse>('/markets/options/expirations', {
      symbol,
    });

    const dates = data.expirations?.date;
    if (!dates) return [];
    return Array.isArray(dates) ? dates : [dates];
  }

  async getHistoricalPrices(symbol: string, days: number): Promise<DailyBar[]> {
    const end = new Date();
    const start = new Date();
    // Add buffer for weekends/holidays
    start.setDate(start.getDate() - Math.ceil(days * 1.5));

    type TradierHistoryResponse = {
      history: {
        day: {
          date: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }[];
      } | null;
    };

    const data = await this.request<TradierHistoryResponse>('/markets/history', {
      symbol,
      interval: 'daily',
      start: formatDate(start),
      end: formatDate(end),
    });

    const bars = data.history?.day ?? [];
    // Return only the requested number of days (most recent)
    const mapped: DailyBar[] = bars.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    return mapped.slice(-days);
  }

  async getHistoricalIV(symbol: string, days: number): Promise<IVPoint[]> {
    // Tradier doesn't provide historical IV directly.
    // We approximate using ATM option IV from the chain for the current day,
    // and return a single-point series. Full historical IV requires a premium data source.
    // For now, return an empty array — IV rank will be computed when more data is available.
    void symbol;
    void days;
    return [];
  }

  async getRealizedVol(symbol: string, days: number): Promise<number> {
    const prices = await this.getHistoricalPrices(symbol, days + 1);
    const closes = prices.map((p) => p.close);
    return realizedVol(closes);
  }

  async getPositions(_accountId: string): Promise<Position[]> {
    // Tradier brokerage positions require a funded account + OAuth.
    // For Phase 2, positions come from manual input only.
    return [];
  }

  async getVIXSeries(days: number): Promise<DailyBar[]> {
    // VIX is available as a regular symbol on Tradier
    return this.getHistoricalPrices('VIX', days);
  }

  async getVIXTermStructure(): Promise<{ vix9d: number; vix: number; vix3m: number }> {
    // Tradier may not have VIX9D/VIX3M as quotable symbols on sandbox.
    // Try to fetch; fall back to approximation.
    try {
      type MultiQuoteResponse = {
        quotes: {
          quote: { symbol: string; last: number }[];
        };
      };
      const data = await this.request<MultiQuoteResponse>('/markets/quotes', {
        symbols: 'VIX,VIX9D,VIX3M',
      });
      const quotes = Array.isArray(data.quotes.quote)
        ? data.quotes.quote
        : [data.quotes.quote];
      const bySymbol = new Map(quotes.map((q) => [q.symbol, q.last]));
      return {
        vix: bySymbol.get('VIX') ?? 0,
        vix9d: bySymbol.get('VIX9D') ?? bySymbol.get('VIX') ?? 0,
        vix3m: bySymbol.get('VIX3M') ?? bySymbol.get('VIX') ?? 0,
      };
    } catch {
      return { vix9d: 0, vix: 0, vix3m: 0 };
    }
  }

  async getMacroSeries(_seriesId: string, _days: number): Promise<DailyBar[]> {
    // FRED macro data not available via Tradier — deferred to a FRED adapter.
    return [];
  }

  async getNextEarnings(_symbol: string): Promise<{ date: string } | null> {
    // Tradier calendar endpoint provides market calendar, not earnings.
    // Earnings data will come from a separate source in a future phase.
    return null;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}
