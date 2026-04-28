export type Quote = {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
};

export type DailyBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IVPoint = {
  date: string;
  iv: number;
};

export type OptionLeg = {
  symbol: string;
  underlying: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  mid: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
};

export type OptionChain = {
  underlying: string;
  expiration: string;
  calls: OptionLeg[];
  puts: OptionLeg[];
};
