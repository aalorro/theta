import type { MCResult } from './mc';

export type RecommendationMetrics = {
  expectedReturn: number;
  annualizedYield: number;
  riskAdjustedReturn: number;
  edgePerContract: number;
  vrp: number;
};

export type RecommendationFlags = {
  earningsRisk: boolean;
  earningsDate?: string;
  paretoOptimal: boolean;
  liquidityWarning?: boolean;
};

export type Recommendation = {
  symbol: string;
  strike: number;
  expiration: string;
  dte: number;
  premium: number;
  delta: number;
  iv: number;
  ivRank: number;
  moneyness: number;
  mc: MCResult;
  metrics: RecommendationMetrics;
  flags: RecommendationFlags;
};
