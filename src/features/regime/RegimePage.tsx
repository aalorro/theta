import { useEffect } from 'react';
import { useRegime } from '@/hooks/useRegime';
import { getRegimeOverlay, getRegimeDescription } from '@/analytics/regime-classifier';
import { RegimeBadge } from './RegimeBadge';
import { VIXPanel } from './VIXPanel';
import { TermStructurePanel } from './TermStructurePanel';
import { SPYTrendPanel } from './SPYTrendPanel';
import { ConfidencePanel } from './ConfidencePanel';
import { RegimeHistoryStrip } from './RegimeHistoryStrip';

export function RegimePage() {
  const { current, history, lastUpdated, loading, error, refresh } = useRegime();

  useEffect(() => {
    if (!current) refresh();
  }, [current, refresh]);

  const overlay = current ? getRegimeOverlay(current.label) : null;
  const description = current ? getRegimeDescription(current.label) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Regime Dashboard</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !current && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          Fetching market data and classifying regime...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Regime header */}
      {current && (
        <>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-start gap-4">
              <RegimeBadge label={current.label} confidence={current.confidence} />
              <div className="flex-1">
                <p className="text-sm text-gray-300">{description}</p>
                {overlay?.banner && (
                  <p className={`mt-2 text-sm font-medium ${overlay.warning ? 'text-red-400' : 'text-blue-400'}`}>
                    {overlay.banner}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4 panels */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VIXPanel signals={current.signals} />
            <TermStructurePanel signals={current.signals} />
            <SPYTrendPanel signals={current.signals} />
            <ConfidencePanel confidence={current.confidence} label={current.label} />
          </div>

          {/* 90-day history strip */}
          {history.length > 1 && <RegimeHistoryStrip history={history} />}
        </>
      )}
    </div>
  );
}
