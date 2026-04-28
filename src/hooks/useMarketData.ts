import { useState, useCallback, useRef } from 'react';
import type { DataAdapter, Quote, OptionChain, DailyBar } from '@/types';
import { createAdapter } from '@/data/adapter';

function getAdapter(): DataAdapter {
  return createAdapter();
}

export function useQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (symbol: string) => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const q = await getAdapter().getQuote(symbol.toUpperCase());
      setQuote(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { quote, loading, error, fetch };
}

export function useChain() {
  const [chain, setChain] = useState<OptionChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (symbol: string, expiration?: string) => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const c = await getAdapter().getChain(symbol.toUpperCase(), expiration);
      setChain(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { chain, loading, error, fetch };
}

export function useExpirations() {
  const [expirations, setExpirations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (symbol: string) => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const exps = await getAdapter().getExpirations(symbol.toUpperCase());
      setExpirations(exps);
    } catch {
      setExpirations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { expirations, loading, fetch };
}

export function useHistoricalPrices() {
  const [prices, setPrices] = useState<DailyBar[]>([]);
  const [loading, setLoading] = useState(false);
  const adapterRef = useRef(getAdapter());

  const fetch = useCallback(async (symbol: string, days: number) => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const p = await adapterRef.current.getHistoricalPrices(symbol.toUpperCase(), days);
      setPrices(p);
    } catch {
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { prices, loading, fetch };
}

export function useRealizedVol() {
  const [rv, setRv] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (symbol: string, days: number) => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const vol = await getAdapter().getRealizedVol(symbol.toUpperCase(), days);
      setRv(vol);
    } catch {
      setRv(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rv, loading, fetch };
}
