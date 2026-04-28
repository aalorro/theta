import { describe, it, expect } from 'vitest';
import {
  classifyRegime,
  getRegimeOverlay,
  getRegimeDescription,
  type RegimeInputs,
} from '../regime-classifier';
import type { RegimeName } from '@/types';

// Helper: base inputs in neutral territory (VIX ~17.5)
function base(): RegimeInputs {
  return {
    vix: 17.5,
    vix9d: 17,
    vix3m: 18,
    spy: 450,
    spy50dma: 445,
    spy200dma: 430,
    spy20dReturn: 0.01,
    rv20d: 0.12,
    vixSeries: [18, 18, 17.5, 17.5, 17, 17.5, 17.5, 17, 17, 17.5],
  };
}

describe('classifyRegime', () => {
  // ── Rule 1: Shocked ──────────────────────────────────────

  it('classifies VIX > 35 as shocked', () => {
    const result = classifyRegime({ ...base(), vix: 40 });
    expect(result.label).toBe('shocked');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('shocked confidence scales with VIX distance above 35', () => {
    const low = classifyRegime({ ...base(), vix: 36 });
    const high = classifyRegime({ ...base(), vix: 48 });
    expect(high.confidence).toBeGreaterThan(low.confidence);
  });

  it('shocked confidence clamps at 1', () => {
    const result = classifyRegime({ ...base(), vix: 80 });
    expect(result.confidence).toBe(1);
  });

  // ── Rule 2: Vol Expansion ────────────────────────────────

  it('classifies VIX > 25 as vol_expansion', () => {
    const result = classifyRegime({ ...base(), vix: 28, vix9d: 27 });
    expect(result.label).toBe('vol_expansion');
  });

  it('classifies inverted term structure (vix9d/vix > 1.05) as vol_expansion', () => {
    // VIX = 22 (below 25 threshold), but short-term TS inverted
    const result = classifyRegime({ ...base(), vix: 22, vix9d: 24 });
    expect(result.label).toBe('vol_expansion');
    expect(result.signals.vix9d_vix_ratio).toBeGreaterThan(1.05);
  });

  // ── Rule 3: High Vol ─────────────────────────────────────

  it('classifies VIX 20-25 with falling VIX as high_vol_stabilizing', () => {
    // VIX falling: 5d MA < 10d MA → recent VIX declining
    const result = classifyRegime({
      ...base(),
      vix: 22,
      vix9d: 21,       // tsShort = 21/22 < 1.05, no vol_expansion
      vix3m: 23,
      vixSeries: [25, 25, 24, 24, 23, 22, 22, 21, 21, 20], // MA5=21.2, MA10=22.7
    });
    expect(result.label).toBe('high_vol_stabilizing');
  });

  it('classifies VIX 20-25 with rising VIX as high_vol_elevated', () => {
    const result = classifyRegime({
      ...base(),
      vix: 22,
      vix9d: 21,
      vix3m: 23,
      vixSeries: [18, 19, 20, 20, 21, 21, 22, 22, 23, 23], // MA5=22.2, MA10=20.8 → not falling
    });
    expect(result.label).toBe('high_vol_elevated');
  });

  // ── Rule 4: Low Vol ──────────────────────────────────────

  it('classifies low VIX with strong trend as low_vol_trending_up', () => {
    const result = classifyRegime({
      ...base(),
      vix: 12,
      vix9d: 11.5,    // keep tsShort < 1.05
      vix3m: 13,
      spy: 460,
      spy50dma: 450,
      spy200dma: 430,
      spy20dReturn: 0.04,
      rv20d: 0.08,
    });
    expect(result.label).toBe('low_vol_trending_up');
  });

  it('classifies low VIX + low RV + no trend as low_vol_range', () => {
    const result = classifyRegime({
      ...base(),
      vix: 11,
      vix9d: 10.5,    // keep tsShort < 1.05
      vix3m: 12,
      spy: 445,       // below 50dma → not trending
      spy50dma: 450,
      spy200dma: 430,
      spy20dReturn: 0.005,
      rv20d: 0.07,    // < 0.10 threshold
    });
    expect(result.label).toBe('low_vol_range');
  });

  it('classifies low VIX with higher RV and no trend as low_vol_mixed', () => {
    const result = classifyRegime({
      ...base(),
      vix: 13,
      vix9d: 12.5,    // keep tsShort < 1.05
      vix3m: 14,
      spy: 445,
      spy50dma: 450,
      spy200dma: 430,
      spy20dReturn: 0.005,
      rv20d: 0.14,    // > 0.10, doesn't qualify for range
    });
    expect(result.label).toBe('low_vol_mixed');
  });

  // ── Rule 5: Neutral ──────────────────────────────────────

  it('classifies VIX 15-20 as neutral', () => {
    const result = classifyRegime(base());
    expect(result.label).toBe('neutral');
  });

  it('neutral confidence peaks at VIX = 17.5', () => {
    const peak = classifyRegime({ ...base(), vix: 17.5 });
    const edge = classifyRegime({ ...base(), vix: 15.5 });
    expect(peak.confidence).toBeGreaterThan(edge.confidence);
  });

  // ── Signals ──────────────────────────────────────────────

  it('populates all signal fields', () => {
    const result = classifyRegime(base());
    expect(result.signals).toHaveProperty('vix');
    expect(result.signals).toHaveProperty('vix9d_vix_ratio');
    expect(result.signals).toHaveProperty('vix_vix3m_ratio');
    expect(result.signals).toHaveProperty('spy_vs_50dma');
    expect(result.signals).toHaveProperty('spy_vs_200dma');
    expect(result.signals).toHaveProperty('realized_vol_20d');
  });

  it('confidence is always in [0, 1]', () => {
    const scenarios: RegimeInputs[] = [
      { ...base(), vix: 80 },                          // extreme shocked
      { ...base(), vix: 5 },                           // extreme low vol
      { ...base(), vix: 17.5 },                        // perfect neutral
      { ...base(), vix: 30, vix9d: 32 },               // vol expansion
    ];
    for (const s of scenarios) {
      const r = classifyRegime(s);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });

  // ── Historical scenario smoke tests ──────────────────────

  it('March 2020 scenario → shocked', () => {
    const result = classifyRegime({
      vix: 65,
      vix9d: 70,
      vix3m: 45,
      spy: 240,
      spy50dma: 310,
      spy200dma: 295,
      spy20dReturn: -0.25,
      rv20d: 0.80,
      vixSeries: [30, 35, 40, 50, 55, 60, 65, 70, 68, 65],
    });
    expect(result.label).toBe('shocked');
  });

  it('Q4 2017 scenario → low_vol_trending_up', () => {
    const result = classifyRegime({
      vix: 10,
      vix9d: 9.5,
      vix3m: 11,
      spy: 265,
      spy50dma: 258,
      spy200dma: 245,
      spy20dReturn: 0.03,
      rv20d: 0.05,
      vixSeries: [11, 10.5, 10, 10, 9.8, 10.2, 10, 9.5, 9.5, 10],
    });
    expect(result.label).toBe('low_vol_trending_up');
  });

  it('Feb 2018 Volmageddon scenario → vol_expansion', () => {
    const result = classifyRegime({
      vix: 33,
      vix9d: 38,
      vix3m: 22,
      spy: 265,
      spy50dma: 272,
      spy200dma: 258,
      spy20dReturn: -0.08,
      rv20d: 0.35,
      vixSeries: [12, 14, 17, 22, 28, 33, 37, 35, 34, 33],
    });
    // VIX < 35, so not shocked; but VIX > 25 → vol_expansion
    expect(result.label).toBe('vol_expansion');
  });

  // ── Edge cases ───────────────────────────────────────────

  it('handles vix = 0 without division error', () => {
    // vix=0 → tsShort=1 (guarded), vix < 15 → low vol path
    // base has spy20dReturn=0.01 < 0.02 threshold, rv20d=0.12 > 0.10 → low_vol_mixed
    const result = classifyRegime({ ...base(), vix: 0 });
    expect(result.label).toBe('low_vol_mixed');
  });

  it('handles short vixSeries gracefully (< 10 entries)', () => {
    const result = classifyRegime({
      ...base(),
      vix: 22,
      vix9d: 21,
      vix3m: 23,
      vixSeries: [22, 23, 21],
    });
    // Not enough data for vixFalling → defaults to false → high_vol_elevated
    expect(result.label).toBe('high_vol_elevated');
  });
});

describe('getRegimeOverlay', () => {
  const regimes: RegimeName[] = [
    'low_vol_trending_up', 'low_vol_range', 'low_vol_mixed', 'neutral',
    'high_vol_stabilizing', 'high_vol_elevated', 'vol_expansion', 'shocked',
  ];

  it('returns overlay for every regime', () => {
    for (const regime of regimes) {
      const overlay = getRegimeOverlay(regime);
      expect(overlay).toHaveProperty('adjustedDeltas');
      expect(overlay).toHaveProperty('banner');
      expect(overlay).toHaveProperty('warning');
    }
  });

  it('warning is true for vol_expansion and shocked', () => {
    expect(getRegimeOverlay('vol_expansion').warning).toBe(true);
    expect(getRegimeOverlay('shocked').warning).toBe(true);
    expect(getRegimeOverlay('high_vol_elevated').warning).toBe(true);
  });

  it('warning is false for calm regimes', () => {
    expect(getRegimeOverlay('neutral').warning).toBe(false);
    expect(getRegimeOverlay('low_vol_range').warning).toBe(false);
  });

  it('low_vol_trending_up tightens deltas (further OTM)', () => {
    const overlay = getRegimeOverlay('low_vol_trending_up');
    expect(overlay.adjustedDeltas).not.toBeNull();
    expect(overlay.adjustedDeltas![0]).toBeLessThanOrEqual(0.10);
  });
});

describe('getRegimeDescription', () => {
  const regimes: RegimeName[] = [
    'low_vol_trending_up', 'low_vol_range', 'low_vol_mixed', 'neutral',
    'high_vol_stabilizing', 'high_vol_elevated', 'vol_expansion', 'shocked',
  ];

  it('returns non-empty string for every regime', () => {
    for (const regime of regimes) {
      const desc = getRegimeDescription(regime);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(20);
    }
  });
});
