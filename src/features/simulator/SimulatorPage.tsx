import { useState } from 'react';
import { useMCSimulation } from '@/hooks/useMCSimulation';
import { SimulatorInputs } from './SimulatorInputs';
import { PnLHistogram } from './PnLHistogram';
import { FanChart } from './FanChart';
import { StatsPanel } from './StatsPanel';
import type { MCConfig } from '@/types';

export function SimulatorPage() {
  const { result, loading, error, simulate, reset } = useMCSimulation();
  const [lastConfig, setLastConfig] = useState<MCConfig | null>(null);

  function handleRun(config: MCConfig) {
    setLastConfig(config);
    simulate(config);
  }

  function handleReset() {
    setLastConfig(null);
    reset();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h2 className="text-2xl font-bold text-white">Monte Carlo Simulator</h2>

      <SimulatorInputs onRun={handleRun} onReset={handleReset} loading={loading} />

      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          Running simulation...
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <StatsPanel result={result} premium={lastConfig?.premium} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-400">P&L Distribution</h3>
              <PnLHistogram pnl={result.terminalPnL} />
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-400">Terminal Price Distribution</h3>
              <FanChart terminalPrices={result.terminalPrices} strike={lastConfig?.strike} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
