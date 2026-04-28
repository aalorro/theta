import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/types';

interface ConfigState {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,

      updateConfig: (updates) =>
        set((s) => ({ config: { ...s.config, ...updates } })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'theta-config',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
