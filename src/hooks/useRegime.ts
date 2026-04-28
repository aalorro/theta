import { useCallback } from 'react';
import { createAdapter } from '@/data/adapter';
import { useRegimeStore } from '@/store/regime-store';
import { classifyRegime, type RegimeInputs } from '@/analytics/regime-classifier';
import { realizedVol } from '@/analytics/realized-vol';
import { mean } from '@/analytics/stats';

/**
 * Hook that fetches VIX / SPY market data and runs the regime classifier.
 * Call `refresh()` to re-fetch and reclassify.
 */
export function useRegime() {
  const { current, history, lastUpdated, loading, error, setRegime, setLoading, setError } =
    useRegimeStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adapter = createAdapter();

      // Fetch in parallel: VIX term structure, SPY quote, SPY history, VIX series
      const [vixTS, spyQuote, spyHistory, vixHistory] = await Promise.all([
        adapter.getVIXTermStructure(),
        adapter.getQuote('SPY'),
        adapter.getHistoricalPrices('SPY', 220), // ~200 trading days for 200-DMA
        adapter.getVIXSeries(30),
      ]);

      // Compute SPY moving averages from history
      const spyCloses = spyHistory.map((b) => b.close);
      const spy50dma = spyCloses.length >= 50 ? mean(spyCloses.slice(-50)) : spyQuote.last;
      const spy200dma = spyCloses.length >= 200 ? mean(spyCloses.slice(-200)) : spy50dma;

      // 20-day return
      const spy20dAgo = spyCloses.length >= 21 ? spyCloses[spyCloses.length - 21]! : spyQuote.last;
      const spy20dReturn = spy20dAgo > 0 ? spyQuote.last / spy20dAgo - 1 : 0;

      // 20-day realized vol
      const rv20dPrices = spyCloses.slice(-21); // need 21 prices for 20 returns
      const rv20d = rv20dPrices.length >= 5 ? realizedVol(rv20dPrices) : 0.15;

      // VIX series for vixFalling computation
      const vixSeries = vixHistory.map((b) => b.close);

      const inputs: RegimeInputs = {
        vix: vixTS.vix,
        vix9d: vixTS.vix9d,
        vix3m: vixTS.vix3m,
        spy: spyQuote.last,
        spy50dma,
        spy200dma,
        spy20dReturn,
        rv20d,
        vixSeries,
      };

      const label = classifyRegime(inputs);
      setRegime(label);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [setRegime, setLoading, setError]);

  return { current, history, lastUpdated, loading, error, refresh };
}
