import type { ScoredCandidate } from '@/analytics/recommendation-engine';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';

type Props = {
  rec: ScoredCandidate;
  rank: number;
};

export function RecommendationCard({ rec, rank }: Props) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        rec.flags.paretoOptimal
          ? 'border-yellow-600/50 bg-yellow-900/10'
          : 'border-gray-800 bg-gray-900/50'
      } ${rank === 0 ? 'ring-1 ring-blue-500/30' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">#{rank + 1}</span>
          <span className="text-sm font-bold text-white">{formatCurrency(rec.strike, true)} strike</span>
        </div>
        <div className="flex gap-1">
          {rec.flags.paretoOptimal && (
            <span className="rounded bg-yellow-800/50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
              PARETO
            </span>
          )}
          {rec.flags.earningsRisk && (
            <span className="rounded bg-red-800/50 px-1.5 py-0.5 text-[10px] font-medium text-red-400" title={`Earnings: ${rec.flags.earningsDate}`}>
              EARNINGS
            </span>
          )}
          {rec.flags.liquidityWarning && (
            <span className="rounded bg-orange-800/50 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
              LOW LIQ
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <Row label="Premium" value={formatCurrency(rec.premium)} />
        <Row label="Delta" value={formatNumber(rec.delta, 2)} />
        <Row label="IV" value={formatPercent(rec.iv)} />
        <Row label="IV Rank" value={formatPercent(rec.ivRank)} />
        <Row label="Moneyness" value={formatPercent(rec.moneyness)} />
        <Row label="DTE" value={String(rec.dte)} />
        <Row label="Exp Return" value={formatCurrency(rec.metrics.expectedReturn)} color={rec.metrics.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Row label="P(Assign)" value={formatPercent(rec.mc.pAssignment)} color={rec.mc.pAssignment > 0.3 ? 'text-yellow-400' : undefined} />
        <Row label="Ann. Yield" value={formatPercent(rec.metrics.annualizedYield)} color="text-blue-400" />
        <Row label="Risk-Adj" value={formatNumber(rec.metrics.riskAdjustedReturn, 2)} />
        <Row label="Edge/ct" value={formatCurrency(rec.metrics.edgePerContract)} color={rec.metrics.edgePerContract > 0 ? 'text-green-400' : 'text-red-400'} />
        <Row label="VRP" value={formatPercent(rec.metrics.vrp)} color={rec.metrics.vrp > 0.2 ? 'text-green-400' : rec.metrics.vrp < 0 ? 'text-red-400' : undefined} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={color ?? 'text-gray-300'}>{value}</span>
    </div>
  );
}
