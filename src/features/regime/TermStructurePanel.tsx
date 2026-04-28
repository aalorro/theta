import type { RegimeSignals } from '@/types';

type Props = {
  signals: RegimeSignals;
};

export function TermStructurePanel({ signals }: Props) {
  const { vix9d_vix_ratio, vix_vix3m_ratio } = signals;

  const shortInverted = vix9d_vix_ratio > 1.0;
  const fullInverted = vix_vix3m_ratio > 1.0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">VIX Term Structure</h3>
      <div className="space-y-3">
        {/* Short end: VIX9D / VIX */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">VIX9D / VIX</span>
            <span className={shortInverted ? 'font-medium text-red-400' : 'text-green-400'}>
              {vix9d_vix_ratio.toFixed(3)}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full ${shortInverted ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, vix9d_vix_ratio * 50)}%` }}
            />
          </div>
          <span className={`text-[10px] ${shortInverted ? 'text-red-400' : 'text-green-400'}`}>
            {shortInverted ? 'Backwardation (fear)' : 'Contango (normal)'}
          </span>
        </div>

        {/* Full curve: VIX / VIX3M */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">VIX / VIX3M</span>
            <span className={fullInverted ? 'font-medium text-red-400' : 'text-green-400'}>
              {vix_vix3m_ratio.toFixed(3)}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full ${fullInverted ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, vix_vix3m_ratio * 50)}%` }}
            />
          </div>
          <span className={`text-[10px] ${fullInverted ? 'text-red-400' : 'text-green-400'}`}>
            {fullInverted ? 'Inverted — short-term stress' : 'Normal contango'}
          </span>
        </div>
      </div>
    </div>
  );
}
