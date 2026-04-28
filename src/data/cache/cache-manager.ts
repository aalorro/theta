import type { DataAdapter, Quote, OptionChain, DailyBar, IVPoint, Position } from '@/types';
import type { CacheEntry, CacheCategory } from './ttl';
import { isStale } from './ttl';
import { idbGet, idbSet } from './idb-store';

/**
 * Dual-layer cache wrapping a DataAdapter.
 * Layer 1: in-memory Map (hot path, instant).
 * Layer 2: IndexedDB (persistent, survives refresh).
 *
 * The CachedAdapter itself implements DataAdapter, so consumers
 * never know whether they hit cache or network.
 */
export class CachedAdapter implements DataAdapter {
  private mem = new Map<string, CacheEntry<unknown>>();

  constructor(private inner: DataAdapter) {}

  private async getCached<T>(key: string, category: CacheCategory): Promise<T | null> {
    // Check in-memory first
    const memEntry = this.mem.get(key) as CacheEntry<T> | undefined;
    if (memEntry && !isStale(memEntry, category)) {
      return memEntry.value;
    }

    // Check IndexedDB
    try {
      const idbEntry = await idbGet<T>(key);
      if (idbEntry && !isStale(idbEntry, category)) {
        // Promote to memory
        this.mem.set(key, idbEntry as CacheEntry<unknown>);
        return idbEntry.value;
      }
    } catch {
      // IndexedDB unavailable — proceed without persistent cache
    }

    return null;
  }

  private async setCache<T>(key: string, value: T): Promise<void> {
    const entry: CacheEntry<T> = { value, timestamp: Date.now() };
    this.mem.set(key, entry as CacheEntry<unknown>);
    try {
      await idbSet(key, entry);
    } catch {
      // IndexedDB write failed — in-memory still works
    }
  }

  private async fetch<T>(key: string, category: CacheCategory, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.getCached<T>(key, category);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.setCache(key, fresh);
    return fresh;
  }

  async getQuote(symbol: string): Promise<Quote> {
    return this.fetch(`quote:${symbol}`, 'quote', () => this.inner.getQuote(symbol));
  }

  async getChain(symbol: string, expiration?: string): Promise<OptionChain> {
    const key = expiration ? `chain:${symbol}:${expiration}` : `chain:${symbol}`;
    return this.fetch(key, 'chain', () => this.inner.getChain(symbol, expiration));
  }

  async getExpirations(symbol: string): Promise<string[]> {
    return this.fetch(`expirations:${symbol}`, 'expirations', () => this.inner.getExpirations(symbol));
  }

  async getHistoricalPrices(symbol: string, days: number): Promise<DailyBar[]> {
    return this.fetch(`historical:${symbol}:${days}`, 'historical', () =>
      this.inner.getHistoricalPrices(symbol, days),
    );
  }

  async getHistoricalIV(symbol: string, days: number): Promise<IVPoint[]> {
    return this.fetch(`iv:${symbol}:${days}`, 'iv', () => this.inner.getHistoricalIV(symbol, days));
  }

  async getRealizedVol(symbol: string, days: number): Promise<number> {
    return this.fetch(`rv:${symbol}:${days}`, 'realizedVol', () =>
      this.inner.getRealizedVol(symbol, days),
    );
  }

  async getPositions(accountId: string): Promise<Position[]> {
    return this.fetch(`positions:${accountId}`, 'positions', () =>
      this.inner.getPositions(accountId),
    );
  }

  async getVIXSeries(days: number): Promise<DailyBar[]> {
    return this.fetch(`vix:${days}`, 'vix', () => this.inner.getVIXSeries(days));
  }

  async getVIXTermStructure(): Promise<{ vix9d: number; vix: number; vix3m: number }> {
    return this.fetch('vixTermStructure', 'vixTermStructure', () =>
      this.inner.getVIXTermStructure(),
    );
  }

  async getMacroSeries(seriesId: string, days: number): Promise<DailyBar[]> {
    return this.fetch(`macro:${seriesId}:${days}`, 'macro', () =>
      this.inner.getMacroSeries(seriesId, days),
    );
  }

  async getNextEarnings(symbol: string): Promise<{ date: string } | null> {
    return this.fetch(`earnings:${symbol}`, 'earnings', () =>
      this.inner.getNextEarnings(symbol),
    );
  }

  /** Clear all in-memory cache entries. */
  clearMemory(): void {
    this.mem.clear();
  }
}
