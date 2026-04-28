import type { MCConfig, MCResult } from '@/types';

export type WorkerRequest = {
  type: 'RUN_MC';
  id: string;
  config: MCConfig;
};

export type WorkerResponse =
  | { type: 'MC_RESULT'; id: string; result: MCResult }
  | { type: 'MC_ERROR'; id: string; error: string };
