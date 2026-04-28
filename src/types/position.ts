export type PositionSource = 'schwab' | 'fidelity' | 'robinhood' | 'manual';

export type Position = {
  symbol: string;
  shares: number;
  costBasis: number;
  source: PositionSource;
  accountId?: string;
};
