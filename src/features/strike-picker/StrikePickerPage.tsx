import { useState, useCallback } from 'react';
import { useHoldingsStore } from '@/store/holdings-store';
import { useConfigStore } from '@/store/config-store';
import { createAdapter } from '@/data/adapter';
import { rankCandidates, type RankResult } from '@/analytics/recommendation-engine';
import { LensColumn } from './LensColumn';
import { LensAgreementBadge } from './LensAgreementBadge';
import { ChainTable } from './ChainTable';
import type { Position } from '@/types';

export function StrikePickerPage() {
  const positions = useHoldingsStore((s) => s.positions);
  const config = useConfigStore((s) => s.config);

  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [result, setResult] = useState<RankResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (position: Position) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const adapter = createAdapter();
      const r = await rankCandidates(position, adapter, config);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [config]);

  function handleSymbolChange(sym: string) {
    setSelectedSymbol(sym);
    const pos = positions.find((p) => p.symbol === sym);
    if (pos) analyze(pos);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Strike Picker</h2>
      </div>

      {/* Symbol selector */}
      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Select Holding</label>
          {positions.length === 0 ? (
            <p className="text-sm text-gray-500">
              No holdings — add positions on the Holdings page first.
            </p>
          ) : (
            <select
              value={selectedSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Choose a symbol...</option>
              {positions.map((p) => (
                <option key={`${p.symbol}:${p.source}`} value={p.symbol}>
                  {p.symbol} — {p.shares} shares @ ${p.costBasis.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedSymbol && (
          <button
            onClick={() => {
              const pos = positions.find((p) => p.symbol === selectedSymbol);
              if (pos) analyze(pos);
            }}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          Running MC simulations across candidate strikes...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <LensAgreementBadge agree={result.lensesAgree} />

          {/* Summary stats */}
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{result.candidates.length} candidates evaluated</span>
            <span>{result.candidates.filter((c) => c.flags.paretoOptimal).length} Pareto-optimal</span>
            {result.candidates.some((c) => c.flags.earningsRisk) && (
              <span className="text-red-400">Earnings risk detected</span>
            )}
          </div>

          {/* Three-column lens layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <LensColumn
              title="Lens 1: Max Expected Return"
              description="Annualized expected total return ($)"
              picks={result.lens1Top3}
            />
            <LensColumn
              title="Lens 2: Max Yield"
              description="Annualized yield, capped assignment risk"
              picks={result.lens2Top3}
            />
            <LensColumn
              title="Lens 3: Risk-Adjusted"
              description="Expected return / std dev (Sharpe-like)"
              picks={result.lens3Top3}
            />
          </div>

          {/* Full chain table */}
          <ChainTable candidates={result.candidates} />
        </div>
      )}
    </div>
  );
}
