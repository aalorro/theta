import type { RegimeLabel, RegimeName } from '@/types';
import { REGIME_THRESHOLDS } from '@/lib/constants';
import { mean } from './stats';

export type RegimeInputs = {
  vix: number;
  vix9d: number;
  vix3m: number;
  spy: number;
  spy50dma: number;
  spy200dma: number;
  spy20dReturn: number;   // (spy / spy_20d_ago) - 1
  rv20d: number;          // 20-day realized vol of SPY, annualized
  vixSeries: number[];    // recent VIX closes, most recent last (need at least 10)
};

/**
 * Rules-based regime classifier. First match wins.
 * Returns regime label, confidence score, and underlying signals.
 */
export function classifyRegime(inputs: RegimeInputs): RegimeLabel {
  const { vix, vix9d, vix3m, spy, spy50dma, spy200dma, spy20dReturn, rv20d, vixSeries } = inputs;

  const tsShort = vix > 0 ? vix9d / vix : 1;
  const tsFull = vix3m > 0 ? vix / vix3m : 1;

  // Compute vix_falling: 5d MA < 10d MA
  const vixFalling = computeVixFalling(vixSeries);

  const signals = {
    vix,
    vix9d_vix_ratio: tsShort,
    vix_vix3m_ratio: tsFull,
    spy_vs_50dma: spy50dma > 0 ? spy / spy50dma - 1 : 0,
    spy_vs_200dma: spy200dma > 0 ? spy / spy200dma - 1 : 0,
    realized_vol_20d: rv20d,
  };

  // Rule 1: Shocked
  if (vix > REGIME_THRESHOLDS.SHOCKED) {
    return {
      label: 'shocked',
      confidence: clamp((vix - REGIME_THRESHOLDS.SHOCKED) / 15), // 35-50 range
      signals,
    };
  }

  // Rule 2: Vol expansion
  if (vix > REGIME_THRESHOLDS.VOL_EXPANSION || tsShort > REGIME_THRESHOLDS.TS_BACKWARDATION) {
    const vixDist = (vix - REGIME_THRESHOLDS.VOL_EXPANSION) / 10;
    const tsDist = (tsShort - REGIME_THRESHOLDS.TS_BACKWARDATION) / 0.10;
    return {
      label: 'vol_expansion',
      confidence: clamp(Math.max(vixDist, tsDist)),
      signals,
    };
  }

  // Rule 3: High vol (20-25)
  if (vix > REGIME_THRESHOLDS.HIGH_VOL) {
    const label: RegimeName = vixFalling ? 'high_vol_stabilizing' : 'high_vol_elevated';
    return {
      label,
      confidence: clamp((vix - REGIME_THRESHOLDS.HIGH_VOL) / 5),
      signals,
    };
  }

  // Rule 4: Low vol (<15)
  if (vix < REGIME_THRESHOLDS.LOW_VOL) {
    const aboveBothDMA = spy > spy50dma && spy > spy200dma;
    const trending = aboveBothDMA && spy20dReturn > REGIME_THRESHOLDS.TREND_RETURN;

    if (trending) {
      return {
        label: 'low_vol_trending_up',
        confidence: clamp((REGIME_THRESHOLDS.LOW_VOL - vix) / 5 + spy20dReturn * 5),
        signals,
      };
    }

    if (rv20d < REGIME_THRESHOLDS.LOW_RV) {
      return {
        label: 'low_vol_range',
        confidence: clamp((REGIME_THRESHOLDS.LOW_RV - rv20d) / 0.05),
        signals,
      };
    }

    return {
      label: 'low_vol_mixed',
      confidence: clamp((REGIME_THRESHOLDS.LOW_VOL - vix) / 5),
      signals,
    };
  }

  // Rule 5: Neutral (15-20)
  return {
    label: 'neutral',
    confidence: clamp(1 - Math.abs(vix - 17.5) / 2.5), // peaks at 17.5
    signals,
  };
}

function computeVixFalling(vixSeries: number[]): boolean {
  if (vixSeries.length < 10) return false;
  const recent = vixSeries.slice(-10);
  const ma5 = mean(recent.slice(-5));
  const ma10 = mean(recent);
  return ma5 < ma10;
}

function clamp(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ── Regime overlay helpers ────────────────────────────────────

export type RegimeOverlay = {
  adjustedDeltas: number[] | null; // null = use default
  banner: string | null;
  warning: boolean;
};

const DEFAULT_DELTAS = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40];

export function getRegimeOverlay(regime: RegimeName): RegimeOverlay {
  switch (regime) {
    case 'low_vol_trending_up':
      return {
        adjustedDeltas: [0.10, 0.15, 0.20, 0.25],
        banner: 'Trending — consider further OTM or skipping',
        warning: false,
      };
    case 'low_vol_range':
      return {
        adjustedDeltas: null,
        banner: 'Premium-rich range — favorable for ATM-ish writes',
        warning: false,
      };
    case 'low_vol_mixed':
    case 'neutral':
      return { adjustedDeltas: null, banner: null, warning: false };
    case 'high_vol_stabilizing':
      return {
        adjustedDeltas: [0.20, 0.25, 0.30],
        banner: 'Vol risk premium attractive — watch for spikes',
        warning: false,
      };
    case 'high_vol_elevated':
      return {
        adjustedDeltas: [0.15, 0.20, 0.25],
        banner: 'Elevated vol — sized writes only',
        warning: true,
      };
    case 'vol_expansion':
      return {
        adjustedDeltas: DEFAULT_DELTAS,
        banner: 'Term structure inverted — consider standing down',
        warning: true,
      };
    case 'shocked':
      return {
        adjustedDeltas: DEFAULT_DELTAS,
        banner: 'Skip writes; tail risk elevated',
        warning: true,
      };
  }
}

/** Interpretive text for the dashboard, keyed to regime. */
export function getRegimeDescription(regime: RegimeName): string {
  switch (regime) {
    case 'low_vol_trending_up':
      return 'Markets are calm and trending higher. Premiums are lean. Consider further OTM strikes to avoid capping gains, or skip writing entirely if the trend is strong.';
    case 'low_vol_range':
      return 'Low volatility with price contained in a range. Theta decay is your friend. ATM-ish covered calls harvest premium efficiently with manageable assignment risk.';
    case 'low_vol_mixed':
      return 'Volatility is low but the trend is unclear. Standard covered call strategies apply. No strong directional edge.';
    case 'neutral':
      return 'Market conditions are balanced. VIX is in normal territory. Standard delta/DTE selection criteria apply.';
    case 'high_vol_stabilizing':
      return 'Volatility is elevated but declining. The volatility risk premium is attractive — implied vol likely overstates actual risk. Good window for covered calls, but size conservatively.';
    case 'high_vol_elevated':
      return 'Volatility is high and not yet falling. Premiums are rich but risk of further downside is real. Write only on strong conviction holdings with conservative strike selection.';
    case 'vol_expansion':
      return 'VIX term structure is inverted — short-term fear exceeds longer-term expectations. This often precedes or accompanies sharp moves. Consider standing down until the curve normalizes.';
    case 'shocked':
      return 'Extreme market stress. VIX above 35 signals panic-level uncertainty. Covered call premiums look tempting but tail risk is severely elevated. Strongly consider waiting for stabilization.';
  }
}
