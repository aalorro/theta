import type { MCModel } from './mc';

export type AppConfig = {
  priceRange: { min: number; max: number };
  candidateDeltas: number[];
  candidateDTEs: number[];
  moneynessRange: { min: number; max: number };
  assignmentThreshold: number;
  mcPaths: number;
  mcModel: MCModel;
  bootstrapWindow: number;
  earningsBuffer: number;
  maxSpreadPctOfMid: number;
  minOpenInterest: number;
};

export const DEFAULT_CONFIG: AppConfig = {
  priceRange: { min: 0, max: Infinity },
  candidateDeltas: [0.15, 0.20, 0.25, 0.30, 0.35, 0.40],
  candidateDTEs: [21, 30, 45],
  moneynessRange: { min: -0.02, max: 0.15 },
  assignmentThreshold: 0.30,
  mcPaths: 10000,
  mcModel: 'bootstrap',
  bootstrapWindow: 252,
  earningsBuffer: 7,
  maxSpreadPctOfMid: 0.10,
  minOpenInterest: 100,
};
