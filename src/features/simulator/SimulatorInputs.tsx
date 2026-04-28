import { useState, useCallback } from 'react';
import { useHoldingsStore } from '@/store/holdings-store';
import { logReturns } from '@/analytics/stats';
import { createAdapter } from '@/data/adapter';
import type { MCConfig, MCModel } from '@/types';

type Props = {
  onRun: (config: MCConfig) => void;
  onReset: () => void;
  loading: boolean;
};

export function SimulatorInputs({ onRun, onReset, loading }: Props) {
  const positions = useHoldingsStore((s) => s.positions);

  const [symbol, setSymbol] = useState('');
  const [spotPrice, setSpotPrice] = useState('');
  const [strike, setStrike] = useState('');
  const [dte, setDte] = useState('30');
  const [premium, setPremium] = useState('');
  const [shares, setShares] = useState('100');
  const [costBasis, setCostBasis] = useState('');
  const [iv, setIv] = useState('');
  const [model, setModel] = useState<MCModel>('bootstrap');
  const [paths, setPaths] = useState('10000');
  const [historicalPricesText, setHistoricalPricesText] = useState('');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [dataStatus, setDataStatus] = useState('');

  const fetchMarketData = useCallback(async (sym: string) => {
    if (!sym.trim()) return;
    setFetching(true);
    setDataStatus('Fetching...');
    try {
      const adapter = createAdapter();
      const [quote, history] = await Promise.all([
        adapter.getQuote(sym),
        adapter.getHistoricalPrices(sym, 260),
      ]);

      setSpotPrice(String(quote.last.toFixed(2)));
      if (!costBasis) setCostBasis(String(quote.last.toFixed(2)));

      // Auto-fill historical prices for bootstrap
      const closes = history.map((b) => b.close);
      setHistoricalPricesText(closes.map((c) => c.toFixed(2)).join('\n'));

      // Try to get realized vol for display
      const rv = await adapter.getRealizedVol(sym, 30);
      setDataStatus(`Loaded: $${quote.last.toFixed(2)} | RV30: ${(rv * 100).toFixed(1)}%`);
    } catch (e) {
      setDataStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setFetching(false);
    }
  }, [costBasis]);

  function handleSymbolSelect(sym: string) {
    setSymbol(sym);
    const pos = positions.find((p) => p.symbol === sym);
    if (pos) {
      setCostBasis(String(pos.costBasis));
      setShares(String(pos.shares));
    }
    fetchMarketData(sym);
  }

  function handleSymbolBlur() {
    if (symbol.trim() && !spotPrice) {
      fetchMarketData(symbol.trim().toUpperCase());
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const sp = parseFloat(spotPrice);
    const k = parseFloat(strike);
    const d = parseInt(dte, 10);
    const pr = parseFloat(premium);
    const sh = parseInt(shares, 10);
    const cb = parseFloat(costBasis) || sp;
    const p = parseInt(paths, 10);
    const manualIV = parseFloat(iv);

    if (isNaN(sp) || sp <= 0) { setError('Valid spot price required'); return; }
    if (isNaN(k) || k <= 0) { setError('Valid strike required'); return; }
    if (isNaN(d) || d <= 0) { setError('Valid DTE required'); return; }
    if (isNaN(pr) || pr < 0) { setError('Valid premium required'); return; }
    if (isNaN(sh) || sh <= 0) { setError('Valid shares required'); return; }
    if (isNaN(p) || p < 100) { setError('At least 100 paths required'); return; }

    let historicalReturns: number[] | undefined;
    if (model === 'bootstrap') {
      const priceLines = historicalPricesText.trim().split('\n').map((l) => parseFloat(l.trim()));
      const validPrices = priceLines.filter((v) => !isNaN(v) && v > 0);
      if (validPrices.length < 20) {
        setError('Bootstrap mode requires at least 20 historical prices (one per line). Fetch data for a symbol or paste prices manually.');
        return;
      }
      historicalReturns = logReturns(validPrices);
    }

    // IV: use manual input if provided, otherwise approximate from premium
    let resolvedIV: number;
    if (!isNaN(manualIV) && manualIV > 0) {
      resolvedIV = manualIV / 100; // user enters as percent
    } else {
      const T = d / 365;
      resolvedIV = pr / (sp * 0.4 * Math.sqrt(T));
    }
    resolvedIV = Math.max(0.05, Math.min(resolvedIV, 2.0));

    const config: MCConfig = {
      spotPrice: sp,
      strike: k,
      iv: resolvedIV,
      dte: d,
      premium: pr,
      shares: sh,
      costBasis: cb,
      paths: p,
      model,
      historicalReturns,
    };

    onRun(config);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Symbol</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onBlur={handleSymbolBlur}
              placeholder="AAPL"
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            {positions.length > 0 && (
              <select
                value=""
                onChange={(e) => handleSymbolSelect(e.target.value)}
                className="rounded border border-gray-700 bg-gray-800 px-1 py-1.5 text-xs text-gray-400"
              >
                <option value="">Pick</option>
                {positions.map((p) => (
                  <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => fetchMarketData(symbol)}
              disabled={!symbol.trim() || fetching}
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-blue-400 hover:bg-gray-700 disabled:opacity-40"
            >
              {fetching ? '...' : 'Fetch'}
            </button>
          </div>
          {dataStatus && (
            <p className={`mt-1 text-xs ${dataStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {dataStatus}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Spot Price ($)</label>
          <input
            type="number" value={spotPrice} onChange={(e) => setSpotPrice(e.target.value)}
            placeholder="175.00" step="0.01" min="0"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Strike ($)</label>
          <input
            type="number" value={strike} onChange={(e) => setStrike(e.target.value)}
            placeholder="180.00" step="0.01" min="0"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">DTE (days)</label>
          <input
            type="number" value={dte} onChange={(e) => setDte(e.target.value)}
            placeholder="30" step="1" min="1"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Premium ($)</label>
          <input
            type="number" value={premium} onChange={(e) => setPremium(e.target.value)}
            placeholder="3.50" step="0.01" min="0"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">IV (%)</label>
          <input
            type="number" value={iv} onChange={(e) => setIv(e.target.value)}
            placeholder="30" step="0.1" min="1"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-gray-500">Leave blank to estimate from premium</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Shares</label>
          <input
            type="number" value={shares} onChange={(e) => setShares(e.target.value)}
            placeholder="100" step="1" min="1"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Cost Basis ($)</label>
          <input
            type="number" value={costBasis} onChange={(e) => setCostBasis(e.target.value)}
            placeholder="150.00" step="0.01" min="0"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Paths</label>
          <input
            type="number" value={paths} onChange={(e) => setPaths(e.target.value)}
            placeholder="10000" step="1000" min="100"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-400">MC Model</label>
          <div className="flex rounded border border-gray-700 text-sm">
            <button
              type="button"
              onClick={() => setModel('gbm')}
              className={`px-3 py-1.5 ${model === 'gbm' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              GBM
            </button>
            <button
              type="button"
              onClick={() => setModel('bootstrap')}
              className={`px-3 py-1.5 ${model === 'bootstrap' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              Bootstrap
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Simulation'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>

      {model === 'bootstrap' && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
            Historical Prices ({historicalPricesText.trim() ? historicalPricesText.trim().split('\n').length + ' loaded' : 'none'})
          </summary>
          <textarea
            value={historicalPricesText}
            onChange={(e) => setHistoricalPricesText(e.target.value)}
            rows={4}
            placeholder="Fetched automatically when you load a symbol, or paste one price per line..."
            className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </details>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
