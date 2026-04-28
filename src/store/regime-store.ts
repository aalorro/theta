import { create } from 'zustand';
import type { RegimeLabel } from '@/types';

interface RegimeState {
  /** Current regime classification (null until first fetch). */
  current: RegimeLabel | null;
  /** History of regime labels (most recent last, capped at 90 entries). */
  history: Array<{ date: string; label: RegimeLabel }>;
  /** Timestamp of last refresh. */
  lastUpdated: number | null;
  /** Loading indicator. */
  loading: boolean;
  error: string | null;

  setRegime: (label: RegimeLabel) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const MAX_HISTORY = 90;

export const useRegimeStore = create<RegimeState>()((set) => ({
  current: null,
  history: [],
  lastUpdated: null,
  loading: false,
  error: null,

  setRegime: (label) =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10);
      // Deduplicate: replace if same date, else append
      const historyWithout = s.history.filter((h) => h.date !== today);
      const updated = [...historyWithout, { date: today, label }].slice(-MAX_HISTORY);
      return { current: label, history: updated, lastUpdated: Date.now(), error: null };
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
