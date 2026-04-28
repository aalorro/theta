import type { DataAdapter } from '@/types';
import { TradierAdapter } from './tradier-adapter';
import { MockAdapter } from './mock-adapter';
import { CachedAdapter } from './cache/cache-manager';

export type AdapterProvider = 'tradier' | 'mock';

let cachedInstance: CachedAdapter | null = null;

/**
 * Create a DataAdapter with caching.
 * The adapter is a singleton — calling again returns the same instance.
 */
export function createAdapter(provider?: AdapterProvider): DataAdapter {
  if (cachedInstance) return cachedInstance;

  let inner: DataAdapter;

  const apiKey = import.meta.env.VITE_TRADIER_API_KEY as string | undefined;
  const resolvedProvider = provider ?? (apiKey ? 'tradier' : 'mock');

  switch (resolvedProvider) {
    case 'tradier': {
      if (!apiKey) {
        console.warn('VITE_TRADIER_API_KEY not set — falling back to mock adapter');
        inner = new MockAdapter();
      } else {
        const sandbox = (import.meta.env.VITE_TRADIER_SANDBOX as string) !== 'false';
        inner = new TradierAdapter(apiKey, sandbox);
      }
      break;
    }
    case 'mock':
    default:
      inner = new MockAdapter();
  }

  cachedInstance = new CachedAdapter(inner);
  return cachedInstance;
}

/** Reset the singleton (useful for tests). */
export function resetAdapter(): void {
  cachedInstance = null;
}
