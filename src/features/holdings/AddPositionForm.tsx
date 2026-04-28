import { useState } from 'react';
import { useHoldingsStore } from '@/store/holdings-store';
import type { Position } from '@/types';

export function AddPositionForm() {
  const addPosition = useHoldingsStore((s) => s.addPosition);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const sym = symbol.trim().toUpperCase();
    const sh = parseInt(shares, 10);
    const cb = parseFloat(costBasis);

    if (!sym) { setError('Symbol is required'); return; }
    if (isNaN(sh) || sh <= 0) { setError('Shares must be a positive integer'); return; }
    if (isNaN(cb) || cb < 0) { setError('Cost basis must be non-negative'); return; }

    const pos: Position = {
      symbol: sym,
      shares: sh,
      costBasis: cb,
      source: 'manual',
    };

    addPosition(pos);
    setSymbol('');
    setShares('');
    setCostBasis('');
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-400">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="AAPL"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-xs text-gray-400">Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="100"
            min="1"
            step="1"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs text-gray-400">Cost Basis ($)</label>
          <input
            type="number"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder="150.00"
            min="0"
            step="0.01"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
