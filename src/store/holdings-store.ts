import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Position } from '@/types';

interface HoldingsState {
  positions: Position[];
  addPosition: (p: Position) => void;
  removePosition: (symbol: string, source: string) => void;
  updatePosition: (symbol: string, source: string, updates: Partial<Position>) => void;
  importPositions: (positions: Position[]) => void;
  clearAll: () => void;
}

export const useHoldingsStore = create<HoldingsState>()(
  persist(
    (set) => ({
      positions: [],

      addPosition: (p) =>
        set((s) => ({ positions: [...s.positions, p] })),

      removePosition: (symbol, source) =>
        set((s) => ({
          positions: s.positions.filter(
            (p) => !(p.symbol === symbol && p.source === source),
          ),
        })),

      updatePosition: (symbol, source, updates) =>
        set((s) => ({
          positions: s.positions.map((p) =>
            p.symbol === symbol && p.source === source ? { ...p, ...updates } : p,
          ),
        })),

      importPositions: (imported) =>
        set((s) => {
          const map = new Map(
            s.positions.map((p) => [`${p.symbol}:${p.source}`, p]),
          );
          for (const p of imported) {
            map.set(`${p.symbol}:${p.source}`, p);
          }
          return { positions: Array.from(map.values()) };
        }),

      clearAll: () => set({ positions: [] }),
    }),
    {
      name: 'theta-holdings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
