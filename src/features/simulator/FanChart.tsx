import { useRef, useEffect, useMemo } from 'react';

type Props = {
  terminalPrices: number[];
  strike?: number;
};

/**
 * Canvas-based terminal price distribution visualization.
 * Shows a vertical swarm/histogram of terminal prices with optional strike line.
 */
export function FanChart({ terminalPrices, strike }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stats = useMemo(() => {
    const sorted = [...terminalPrices].sort((a, b) => a - b);
    const len = sorted.length;
    return {
      min: sorted[0]!,
      max: sorted[len - 1]!,
      p5: sorted[Math.floor(len * 0.05)]!,
      p25: sorted[Math.floor(len * 0.25)]!,
      p50: sorted[Math.floor(len * 0.50)]!,
      p75: sorted[Math.floor(len * 0.75)]!,
      p95: sorted[Math.floor(len * 0.95)]!,
    };
  }, [terminalPrices]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const pad = { top: 20, bottom: 30, left: 60, right: 20 };
    const plotH = H - pad.top - pad.bottom;
    const plotW = W - pad.left - pad.right;

    // Build vertical histogram
    const binCount = 40;
    const range = stats.max - stats.min || 1;
    const binSize = range / binCount;
    const bins = new Array(binCount).fill(0) as number[];

    for (const p of terminalPrices) {
      let idx = Math.floor((p - stats.min) / binSize);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx] = (bins[idx] ?? 0) + 1;
    }

    const maxBin = Math.max(...bins);

    // Map price to Y coordinate (price increases upward)
    const priceToY = (price: number) =>
      pad.top + plotH - ((price - stats.min) / range) * plotH;

    // Draw bins as horizontal bars from the left
    const barH = plotH / binCount;
    for (let i = 0; i < binCount; i++) {
      const barW = (bins[i]! / maxBin) * plotW;
      const y = pad.top + plotH - (i + 1) * barH;
      const binMidPrice = stats.min + (i + 0.5) * binSize;
      const hue = binMidPrice >= stats.p50 ? 142 : 0; // green above median, red below
      ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.5)`;
      ctx.fillRect(pad.left, y, barW, barH - 1);
    }

    // Draw percentile lines
    const drawPriceLine = (price: number, label: string, color: string, dashed = false) => {
      const y = priceToY(price);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      if (dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${label} $${price.toFixed(0)}`, pad.left - 4, y + 3);
    };

    drawPriceLine(stats.p5, 'P5', '#ef4444', true);
    drawPriceLine(stats.p25, 'P25', '#f59e0b', true);
    drawPriceLine(stats.p50, 'P50', '#3b82f6', false);
    drawPriceLine(stats.p75, 'P75', '#f59e0b', true);
    drawPriceLine(stats.p95, 'P95', '#22c55e', true);

    // Draw strike line if provided
    if (strike != null && strike >= stats.min && strike <= stats.max) {
      drawPriceLine(strike, 'K', '#f472b6', false);
    }

    // Y-axis label
    ctx.save();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.translate(12, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Terminal Price ($)', 0, 0);
    ctx.restore();
  }, [terminalPrices, stats, strike]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[280px] w-full"
    />
  );
}
