import { useHoldingsStore } from '@/store/holdings-store';
import { formatCurrency } from '@/lib/format';

export function HoldingsTable() {
  const positions = useHoldingsStore((s) => s.positions);
  const removePosition = useHoldingsStore((s) => s.removePosition);
  const clearAll = useHoldingsStore((s) => s.clearAll);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <span className="text-sm text-gray-400">{positions.length} position(s)</span>
        <button
          onClick={clearAll}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Clear All
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs uppercase text-gray-500">
            <th className="px-4 py-2">Symbol</th>
            <th className="px-4 py-2 text-right">Shares</th>
            <th className="px-4 py-2 text-right">Cost Basis</th>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={`${p.symbol}:${p.source}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="px-4 py-2 font-medium text-white">{p.symbol}</td>
              <td className="px-4 py-2 text-right text-gray-300">{p.shares}</td>
              <td className="px-4 py-2 text-right text-gray-300">{formatCurrency(p.costBasis)}</td>
              <td className="px-4 py-2 text-gray-400">{p.source}</td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => removePosition(p.symbol, p.source)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
