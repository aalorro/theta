import { useState } from 'react';
import { useHoldingsStore } from '@/store/holdings-store';
import { HoldingsTable } from './HoldingsTable';
import { AddPositionForm } from './AddPositionForm';
import { BulkImport } from './BulkImport';

export function HoldingsPage() {
  const positions = useHoldingsStore((s) => s.positions);
  const [showBulkImport, setShowBulkImport] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Holdings</h2>
        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
        >
          {showBulkImport ? 'Single Add' : 'Bulk Import'}
        </button>
      </div>

      {showBulkImport ? <BulkImport /> : <AddPositionForm />}

      {positions.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">No holdings yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Add positions above to get started, or use Bulk Import to paste CSV data.
          </p>
        </div>
      ) : (
        <HoldingsTable />
      )}
    </div>
  );
}
