/** Trading days per year for annualization */
export const TRADING_DAYS_PER_YEAR = 252;

/** Calendar days per year */
export const DAYS_PER_YEAR = 365;

/** Regime VIX thresholds */
export const REGIME_THRESHOLDS = {
  SHOCKED: 35,
  VOL_EXPANSION: 25,
  HIGH_VOL: 20,
  LOW_VOL: 15,
  TS_BACKWARDATION: 1.05,
  LOW_RV: 0.10,
  TREND_RETURN: 0.02,
} as const;

/** Cache TTLs in milliseconds */
export const CACHE_TTL = {
  QUOTE: 60_000,
  CHAIN_MARKET_HOURS: 60_000,
  CHAIN_AFTER_HOURS: 3_600_000,
  HISTORICAL: 86_400_000,
  VIX_MACRO: 86_400_000,
  EARNINGS: 604_800_000,
} as const;
