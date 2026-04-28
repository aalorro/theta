import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedAdapter } from '../cache/cache-manager';
import { MockAdapter } from '../mock-adapter';

describe('CachedAdapter', () => {
  let inner: MockAdapter;
  let cached: CachedAdapter;

  beforeEach(() => {
    inner = new MockAdapter();
    cached = new CachedAdapter(inner);
  });

  it('returns data from the inner adapter on first call', async () => {
    const quote = await cached.getQuote('AAPL');
    expect(quote.symbol).toBe('AAPL');
    expect(quote.last).toBeGreaterThan(0);
  });

  it('returns cached data on second call (no second fetch)', async () => {
    const spy = vi.spyOn(inner, 'getQuote');

    const q1 = await cached.getQuote('MSFT');
    const q2 = await cached.getQuote('MSFT');

    // Inner adapter should only be called once
    expect(spy.mock.calls.length).toBe(1);
    // Both results should be identical
    expect(q1.last).toBe(q2.last);
    expect(q1.timestamp).toBe(q2.timestamp);
  });

  it('caches different keys independently', async () => {
    const spy = vi.spyOn(inner, 'getQuote');

    await cached.getQuote('AAPL');
    await cached.getQuote('MSFT');
    await cached.getQuote('AAPL'); // should be cached

    expect(spy.mock.calls.length).toBe(2); // AAPL + MSFT, second AAPL is cached
  });

  it('caches chain data', async () => {
    const spy = vi.spyOn(inner, 'getChain');

    const c1 = await cached.getChain('AAPL', '2025-06-20');
    const c2 = await cached.getChain('AAPL', '2025-06-20');

    expect(spy.mock.calls.length).toBe(1);
    expect(c1.calls.length).toBe(c2.calls.length);
  });

  it('caches historical prices', async () => {
    const spy = vi.spyOn(inner, 'getHistoricalPrices');

    await cached.getHistoricalPrices('SPY', 30);
    await cached.getHistoricalPrices('SPY', 30);

    expect(spy.mock.calls.length).toBe(1);
  });

  it('clearMemory forces re-fetch on next call', async () => {
    const spy = vi.spyOn(inner, 'getQuote');

    await cached.getQuote('AAPL');
    cached.clearMemory();
    await cached.getQuote('AAPL');

    // Would be 2 if IDB is not available (jsdom), since memory was cleared
    // In jsdom there's no real IDB, so it should fetch twice
    expect(spy.mock.calls.length).toBe(2);
  });
});
