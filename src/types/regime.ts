export type RegimeName =
  | 'low_vol_trending_up'
  | 'low_vol_range'
  | 'low_vol_mixed'
  | 'neutral'
  | 'high_vol_stabilizing'
  | 'high_vol_elevated'
  | 'vol_expansion'
  | 'shocked';

export type RegimeSignals = {
  vix: number;
  vix9d_vix_ratio: number;
  vix_vix3m_ratio: number;
  spy_vs_50dma: number;
  spy_vs_200dma: number;
  realized_vol_20d: number;
};

export type RegimeLabel = {
  label: RegimeName;
  confidence: number;
  signals: RegimeSignals;
};
