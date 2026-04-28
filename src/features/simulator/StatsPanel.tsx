import type { MCResult } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { edgePerContract } from '@/analytics/edge';

type Props = {
  result: MCResult;
  premium?: number;
};

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded border border-gray-800 bg-gray-900/50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${color ?? 'text-white'}`}>{value}</div>
    </div>
  );
}

export function StatsPanel({ result, premium }: Props) {
  const edge = premium != null ? edgePerContract(premium, result.expectedPayoutShort) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Expected Return"
        value={formatCurrency(result.expectedReturn)}
        color={result.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        label="Std Dev"
        value={formatCurrency(result.stdDev)}
      />
      <StatCard
        label="P(Assignment)"
        value={formatPercent(result.pAssignment)}
        color={result.pAssignment > 0.3 ? 'text-yellow-400' : 'text-white'}
      />
      <StatCard
        label="P50 (Median P&L)"
        value={formatCurrency(result.percentiles.p50)}
        color={result.percentiles.p50 >= 0 ? 'text-green-400' : 'text-red-400'}
      />
      {edge != null && (
        <StatCard
          label="Edge / Contract"
          value={formatCurrency(edge)}
          color={edge > 0 ? 'text-green-400' : edge < 0 ? 'text-red-400' : 'text-white'}
        />
      )}
      <StatCard label="P5" value={formatCurrency(result.percentiles.p5)} color="text-red-400" />
      <StatCard label="P25" value={formatCurrency(result.percentiles.p25)} />
      <StatCard label="P75" value={formatCurrency(result.percentiles.p75)} />
      <StatCard label="P95" value={formatCurrency(result.percentiles.p95)} color="text-green-400" />
      <StatCard label="Paths" value={result.paths.toLocaleString()} />
    </div>
  );
}
