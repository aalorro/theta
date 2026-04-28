import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

type Props = {
  pnl: number[];
};

function buildBins(values: number[], binCount = 50) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    x: min + (i + 0.5) * binWidth,
    label: (min + (i + 0.5) * binWidth).toFixed(0),
    count: 0,
  }));

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx]!.count++;
  }

  return bins;
}

export function PnLHistogram({ pnl }: Props) {
  const data = useMemo(() => buildBins(pnl), [pnl]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 12 }}
          labelFormatter={(l) => `P&L: $${l}`}
          formatter={(v: number) => [v, 'Paths']}
        />
        <ReferenceLine x="0" stroke="#ef4444" strokeDasharray="3 3" />
        <Bar dataKey="count" radius={[1, 1, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.x >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
