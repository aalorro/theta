import type { RegimeSignals } from '@/types';
import { formatPercent } from '@/lib/format';

type Props = {
  signals: RegimeSignals;
};

export function SPYTrendPanel({ signals }: Props) {
  const { spy_vs_50dma, spy_vs_200dma, realized_vol_20d } = signals;

  const above50 = spy_vs_50dma >= 0;
  const above200 = spy_vs_200dma >= 0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">SPY Trend</h3>
      <div className="space-y-3">
        {/* SPY vs 50 DMA */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">vs 50-DMA</span>
          <span className={`text-sm font-medium ${above50 ? 'text-green-400' : 'text-red-400'}`}>
            {spy_vs_50dma >= 0 ? '+' : ''}{formatPercent(spy_vs_50dma)}
          </span>
        </div>

        {/* SPY vs 200 DMA */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">vs 200-DMA</span>
          <span className={`text-sm font-medium ${above200 ? 'text-green-400' : 'text-red-400'}`}>
            {spy_vs_200dma >= 0 ? '+' : ''}{formatPercent(spy_vs_200dma)}
          </span>
        </div>

        {/* Realized Vol */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">20d RV</span>
          <span className="text-sm font-medium text-gray-300">
            {formatPercent(realized_vol_20d)}
          </span>
        </div>

        {/* Trend summary */}
        <div className="mt-1 rounded bg-gray-800/50 px-2 py-1 text-[10px]">
          {above50 && above200 ? (
            <span className="text-green-400">Above both DMAs — uptrend</span>
          ) : !above50 && !above200 ? (
            <span className="text-red-400">Below both DMAs — downtrend</span>
          ) : (
            <span className="text-yellow-400">Mixed signals — transition zone</span>
          )}
        </div>
      </div>
    </div>
  );
}
