export type MCModel = 'gbm' | 'bootstrap';

export type MCConfig = {
  spotPrice: number;
  strike: number;
  iv: number;
  dte: number;
  premium: number;
  shares: number;
  costBasis: number;
  paths: number;
  model: MCModel;
  historicalReturns?: number[];
  seed?: number;
};

export type MCResult = {
  paths: number;
  terminalPrices: number[];
  terminalPnL: number[];
  expectedReturn: number;
  stdDev: number;
  pAssignment: number;
  expectedPayoutShort: number;
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
};
