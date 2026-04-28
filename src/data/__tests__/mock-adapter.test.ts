import { describe, it, expect } from 'vitest';
import { MockAdapter } from '../mock-adapter';

describe('MockAdapter', () => {
  const adapter = new MockAdapter();

  it('returns a quote with valid fields', async () => {
    const quote = await adapter.getQuote('AAPL');
    expect(quote.symbol).toBe('AAPL');
    expect(quote.last).toBeGreaterThan(0);
    expect(quote.bid).toBeGreaterThan(0);
    expect(quote.ask).toBeGreaterThan(quote.bid);
    expect(quote.timestamp).toBeGreaterThan(0);
  });

  it('returns expirations as sorted date strings', async () => {
    const exps = await adapter.getExpirations('AAPL');
    expect(exps.length).toBeGreaterThan(0);
    for (const exp of exps) {
      expect(exp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('returns an option chain with calls and puts', async () => {
    const chain = await adapter.getChain('AAPL');
    expect(chain.underlying).toBe('AAPL');
    expect(chain.calls.length).toBeGreaterThan(0);
    expect(chain.puts.length).toBeGreaterThan(0);

    const call = chain.calls[0]!;
    expect(call.type).toBe('call');
    expect(call.strike).toBeGreaterThan(0);
    expect(call.mid).toBeGreaterThan(0);
    expect(call.iv).toBeGreaterThan(0);
    expect(call.delta).toBeGreaterThan(0);
    expect(call.delta).toBeLessThanOrEqual(1);
  });

  it('returns historical prices with correct structure', async () => {
    const prices = await adapter.getHistoricalPrices('AAPL', 30);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices.length).toBeLessThanOrEqual(30);
    for (const bar of prices) {
      expect(bar.close).toBeGreaterThan(0);
      expect(bar.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('returns realized vol as a positive number', async () => {
    const rv = await adapter.getRealizedVol('AAPL', 30);
    expect(rv).toBeGreaterThan(0);
    expect(rv).toBeLessThan(2); // reasonable bound
  });

  it('returns historical IV points', async () => {
    const ivs = await adapter.getHistoricalIV('AAPL', 252);
    expect(ivs.length).toBeGreaterThan(0);
    for (const pt of ivs) {
      expect(pt.iv).toBeGreaterThan(0);
      expect(pt.iv).toBeLessThan(1);
    }
  });

  it('returns VIX term structure with three values', async () => {
    const ts = await adapter.getVIXTermStructure();
    expect(ts.vix).toBeGreaterThan(0);
    expect(ts.vix9d).toBeGreaterThan(0);
    expect(ts.vix3m).toBeGreaterThan(0);
  });

  it('returns VIX series as daily bars', async () => {
    const bars = await adapter.getVIXSeries(20);
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.close).toBeGreaterThan(5);
      expect(bar.close).toBeLessThan(60);
    }
  });
});
