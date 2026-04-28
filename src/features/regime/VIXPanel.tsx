import type { RegimeSignals } from '@/types';
import { REGIME_THRESHOLDS } from '@/lib/constants';

type Props = {
  signals: RegimeSignals;
};

export function VIXPanel({ signals }: Props) {
  const { vix } = signals;

  // Color based on VIX level
  let color = 'text-green-400';
  if (vix >= REGIME_THRESHOLDS.SHOCKED) color = 'text-red-300';
  else if (vix >= REGIME_THRESHOLDS.VOL_EXPANSION) color = 'text-red-400';
  else if (vix >= REGIME_THRESHOLDS.HIGH_VOL) color = 'text-orange-400';
  else if (vix >= REGIME_THRESHOLDS.LOW_VOL) color = 'text-gray-300';

  // VIX gauge: map 0-80 to a percentage
  const pct = Math.min(100, (vix / 80) * 100);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">VIX Level</h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${color}`}>{vix.toFixed(1)}</span>
      </div>
      {/* Simple gauge bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-600">
        <span>0</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>35</span>
        <span>80</span>
      </div>
      {/* Threshold markers */}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className="text-green-400">{'<'}15 Low</span>
        <span className="text-gray-400">15-20 Neutral</span>
        <span className="text-orange-400">20-25 High</span>
        <span className="text-red-400">{'>'}25 Expansion</span>
        <span className="text-red-300">{'>'}35 Shocked</span>
      </div>
    </div>
  );
}
