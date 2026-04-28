import { runMC } from '../analytics/mc-engine';
import type { WorkerRequest, WorkerResponse } from './worker-messages';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, id, config } = e.data;
  if (type === 'RUN_MC') {
    try {
      const result = runMC(config);
      const response: WorkerResponse = { type: 'MC_RESULT', id, result };
      self.postMessage(response);
    } catch (err) {
      const response: WorkerResponse = { type: 'MC_ERROR', id, error: String(err) };
      self.postMessage(response);
    }
  }
};
