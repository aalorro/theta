import type { ScoredCandidate } from '@/analytics/recommendation-engine';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';

type Props = {
  candidates: ScoredCandidate[];
};

export function ChainTable({ candidates }: Props) {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => a.strike - b.strike || a.dte - b.dte);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="border-b border-gray-800 px-4 py-2">
        <h3 className="text-sm font-medium text-gray-400">
          All Candidates ({candidates.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-left text-[10px] uppercase text-gray-500">
              <th className="px-3 py-2">Strike</th>
              <th className="px-3 py-2">Exp</th>
              <th className="px-3 py-2 text-right">DTE</th>
              <th className="px-3 py-2 text-right">Prem</th>
              <th className="px-3 py-2 text-right">Delta</th>
              <th className="px-3 py-2 text-right">IV</th>
              <th className="px-3 py-2 text-right">Money</th>
              <th className="px-3 py-2 text-right">E[Ret]</th>
              <th className="px-3 py-2 text-right">P(Asgn)</th>
              <th className="px-3 py-2 text-right">Yield</th>
              <th className="px-3 py-2 text-right">Edge</th>
              <th className="px-3 py-2 text-right">VRP</th>
              <th className="px-3 py-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={`${c.strike}-${c.expiration}`}
                className={`border-b border-gray-800/30 ${
                  c.flags.paretoOptimal
                    ? 'bg-yellow-900/10'
                    : 'hover:bg-gray-800/30'
                }`}
              >
                <td className="px-3 py-1.5 font-medium text-white">{formatCurrency(c.strike, true)}</td>
                <td className="px-3 py-1.5 text-gray-400">{c.expiration}</td>
                <td className="px-3 py-1.5 text-right text-gray-300">{c.dte}</td>
                <td className="px-3 py-1.5 text-right text-gray-300">{formatCurrency(c.premium)}</td>
                <td className="px-3 py-1.5 text-right text-gray-300">{formatNumber(c.delta, 2)}</td>
                <td className="px-3 py-1.5 text-right text-gray-300">{formatPercent(c.iv)}</td>
                <td className="px-3 py-1.5 text-right text-gray-300">{formatPercent(c.moneyness)}</td>
                <td className={`px-3 py-1.5 text-right ${c.metrics.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(c.metrics.expectedReturn)}
                </td>
                <td className={`px-3 py-1.5 text-right ${c.mc.pAssignment > 0.3 ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {formatPercent(c.mc.pAssignment)}
                </td>
                <td className="px-3 py-1.5 text-right text-blue-400">{formatPercent(c.metrics.annualizedYield)}</td>
                <td className={`px-3 py-1.5 text-right ${c.metrics.edgePerContract > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(c.metrics.edgePerContract)}
                </td>
                <td className={`px-3 py-1.5 text-right ${c.metrics.vrp > 0.2 ? 'text-green-400' : c.metrics.vrp < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                  {formatPercent(c.metrics.vrp)}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex gap-1">
                    {c.flags.paretoOptimal && <span className="text-yellow-400" title="Pareto optimal">P</span>}
                    {c.flags.earningsRisk && <span className="text-red-400" title={`Earnings: ${c.flags.earningsDate}`}>E</span>}
                    {c.flags.liquidityWarning && <span className="text-orange-400" title="Liquidity warning">L</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
