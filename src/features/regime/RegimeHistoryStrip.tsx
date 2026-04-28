import type { RegimeLabel, RegimeName } from '@/types';

type Props = {
  history: Array<{ date: string; label: RegimeLabel }>;
};

const REGIME_STRIP_COLORS: Record<RegimeName, string> = {
  low_vol_trending_up: 'bg-green-500',
  low_vol_range: 'bg-emerald-500',
  low_vol_mixed: 'bg-teal-500',
  neutral: 'bg-gray-500',
  high_vol_stabilizing: 'bg-yellow-500',
  high_vol_elevated: 'bg-orange-500',
  vol_expansion: 'bg-red-500',
  shocked: 'bg-red-700',
};

const REGIME_SHORT: Record<RegimeName, string> = {
  low_vol_trending_up: 'LVT',
  low_vol_range: 'LVR',
  low_vol_mixed: 'LVM',
  neutral: 'N',
  high_vol_stabilizing: 'HVS',
  high_vol_elevated: 'HVE',
  vol_expansion: 'VE',
  shocked: 'S',
};

export function RegimeHistoryStrip({ history }: Props) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">
        Regime History ({history.length} days)
      </h3>
      <div className="flex gap-0.5 overflow-x-auto">
        {history.map((h) => (
          <div
            key={h.date}
            className={`flex h-8 min-w-[10px] flex-1 items-center justify-center rounded-sm ${REGIME_STRIP_COLORS[h.label.label]}`}
            title={`${h.date}: ${h.label.label} (${Math.round(h.label.confidence * 100)}%)`}
          >
            {history.length <= 30 && (
              <span className="text-[8px] font-bold text-white/80">
                {REGIME_SHORT[h.label.label]}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(REGIME_STRIP_COLORS).map(([regime, color]) => (
          <div key={regime} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-gray-500">{REGIME_SHORT[regime as RegimeName]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
