import type { RegimeName } from '@/types';
import { getRegimeOverlay } from '@/analytics/regime-classifier';

type Props = {
  confidence: number;
  label: RegimeName;
};

export function ConfidencePanel({ confidence, label }: Props) {
  const overlay = getRegimeOverlay(label);
  const pct = Math.round(confidence * 100);

  // Confidence ring: SVG arc
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - confidence);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">Confidence</h3>
      <div className="flex flex-col items-center gap-2">
        {/* Circular gauge */}
        <svg width="88" height="88" className="-rotate-90">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="6"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={overlay.warning ? '#ef4444' : '#3b82f6'}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-2xl font-bold text-white">{pct}%</span>
        <div className="text-center text-[10px] text-gray-500">
          {overlay.warning ? (
            <span className="text-red-400">Caution advised</span>
          ) : confidence > 0.7 ? (
            <span className="text-green-400">High confidence</span>
          ) : (
            <span className="text-yellow-400">Moderate confidence</span>
          )}
        </div>
        {overlay.adjustedDeltas && (
          <div className="mt-1 text-center text-[10px] text-gray-500">
            Suggested deltas: {overlay.adjustedDeltas.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
