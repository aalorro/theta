import { useState, useCallback, useRef, useEffect } from 'react';
import type { MCConfig, MCResult } from '@/types';
import { WorkerPool } from '@/workers/worker-pool';

export function useMCSimulation() {
  const [result, setResult] = useState<MCResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);

  useEffect(() => {
    poolRef.current = new WorkerPool(1);
    return () => {
      poolRef.current?.terminate();
      poolRef.current = null;
    };
  }, []);

  const simulate = useCallback(async (config: MCConfig) => {
    if (!poolRef.current) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await poolRef.current.runMC(config);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, simulate, reset };
}
