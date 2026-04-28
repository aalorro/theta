import { useState } from 'react';
import { useHoldingsStore } from '@/store/holdings-store';
import type { Position } from '@/types';

export function BulkImport() {
  const importPositions = useHoldingsStore((s) => s.importPositions);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Position[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function parse() {
    const lines = text.trim().split('\n').filter((l) => l.trim());
    const parsed: Position[] = [];
    const errs: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      // Skip header-like lines
      if (/^symbol/i.test(line)) continue;

      const parts = line.split(/[,\t]+/).map((s) => s.trim());
      if (parts.length < 3) {
        errs.push(`Line ${i + 1}: expected SYMBOL, SHARES, COST_BASIS`);
        continue;
      }

      const symbol = parts[0]!.toUpperCase();
      const shares = parseInt(parts[1]!, 10);
      const costBasis = parseFloat(parts[2]!);

      if (!symbol || !/^[A-Z]{1,5}$/.test(symbol)) {
        errs.push(`Line ${i + 1}: invalid symbol "${parts[0]}"`);
        continue;
      }
      if (isNaN(shares) || shares <= 0) {
        errs.push(`Line ${i + 1}: invalid shares "${parts[1]}"`);
        continue;
      }
      if (isNaN(costBasis) || costBasis < 0) {
        errs.push(`Line ${i + 1}: invalid cost basis "${parts[2]}"`);
        continue;
      }

      parsed.push({ symbol, shares, costBasis, source: 'manual' });
    }

    setPreview(parsed);
    setErrors(errs);
  }

  function handleImport() {
    importPositions(preview);
    setText('');
    setPreview([]);
    setErrors([]);
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
      <div>
        <label className="mb-1 block text-xs text-gray-400">
          Paste CSV/TSV — one row per position: SYMBOL, SHARES, COST_BASIS
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={`AAPL, 100, 150.00\nMSFT, 200, 310.50\nSPY, 300, 420.00`}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        onClick={parse}
        disabled={!text.trim()}
        className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-40"
      >
        Preview
      </button>

      {errors.length > 0 && (
        <div className="text-xs text-red-400 space-y-0.5">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">{preview.length} position(s) ready to import:</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-1">Symbol</th>
                <th className="px-2 py-1 text-right">Shares</th>
                <th className="px-2 py-1 text-right">Cost Basis</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i} className="text-gray-300">
                  <td className="px-2 py-1 font-medium text-white">{p.symbol}</td>
                  <td className="px-2 py-1 text-right">{p.shares}</td>
                  <td className="px-2 py-1 text-right">${p.costBasis.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleImport}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Import {preview.length} Position(s)
          </button>
        </div>
      )}
    </div>
  );
}
