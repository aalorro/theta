import { CACHE_TTL } from '@/lib/constants';

export type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

export type CacheCategory =
  | 'quote'
  | 'chain'
  | 'expirations'
  | 'historical'
  | 'iv'
  | 'realizedVol'
  | 'vix'
  | 'macro'
  | 'earnings'
  | 'positions'
  | 'vixTermStructure';

/** Returns TTL in ms for a given cache category. */
export function getTTL(category: CacheCategory): number {
  switch (category) {
    case 'quote':
      return CACHE_TTL.QUOTE;
    case 'chain':
    case 'expirations':
      return isMarketHours() ? CACHE_TTL.CHAIN_MARKET_HOURS : CACHE_TTL.CHAIN_AFTER_HOURS;
    case 'historical':
    case 'iv':
    case 'realizedVol':
      return CACHE_TTL.HISTORICAL;
    case 'vix':
    case 'vixTermStructure':
    case 'macro':
      return CACHE_TTL.VIX_MACRO;
    case 'earnings':
      return CACHE_TTL.EARNINGS;
    case 'positions':
      return CACHE_TTL.QUOTE;
    default:
      return CACHE_TTL.QUOTE;
  }
}

export function isStale<T>(entry: CacheEntry<T>, category: CacheCategory): boolean {
  return Date.now() - entry.timestamp > getTTL(category);
}

/** NYSE market hours: 09:30–16:00 ET, Mon–Fri. */
function isMarketHours(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= 570 && minutes <= 960; // 9:30=570, 16:00=960
}
