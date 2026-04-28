import type { RegimeName } from '@/types';

type Props = {
  label: RegimeName;
  confidence: number;
};

const REGIME_COLORS: Record<RegimeName, { bg: string; text: string; ring: string }> = {
  low_vol_trending_up: { bg: 'bg-green-900/30', text: 'text-green-400', ring: 'ring-green-700' },
  low_vol_range: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', ring: 'ring-emerald-700' },
  low_vol_mixed: { bg: 'bg-teal-900/30', text: 'text-teal-400', ring: 'ring-teal-700' },
  neutral: { bg: 'bg-gray-800/50', text: 'text-gray-300', ring: 'ring-gray-600' },
  high_vol_stabilizing: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', ring: 'ring-yellow-700' },
  high_vol_elevated: { bg: 'bg-orange-900/30', text: 'text-orange-400', ring: 'ring-orange-700' },
  vol_expansion: { bg: 'bg-red-900/30', text: 'text-red-400', ring: 'ring-red-700' },
  shocked: { bg: 'bg-red-900/50', text: 'text-red-300', ring: 'ring-red-600' },
};

const REGIME_DISPLAY: Record<RegimeName, string> = {
  low_vol_trending_up: 'Low Vol — Trending Up',
  low_vol_range: 'Low Vol — Range Bound',
  low_vol_mixed: 'Low Vol — Mixed',
  neutral: 'Neutral',
  high_vol_stabilizing: 'High Vol — Stabilizing',
  high_vol_elevated: 'High Vol — Elevated',
  vol_expansion: 'Vol Expansion',
  shocked: 'Shocked',
};

export function RegimeBadge({ label, confidence }: Props) {
  const colors = REGIME_COLORS[label];
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
      >
        {REGIME_DISPLAY[label]}
      </span>
      <span className="text-xs text-gray-500">
        {(confidence * 100).toFixed(0)}% confidence
      </span>
    </div>
  );
}
