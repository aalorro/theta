import type { MCConfig, MCResult } from '@/types';
import type { WorkerResponse } from './worker-messages';

type PendingTask = {
  resolve: (result: MCResult) => void;
  reject: (error: Error) => void;
};

export class WorkerPool {
  private workers: Worker[];
  private pending = new Map<string, PendingTask>();
  private nextWorker = 0;

  constructor(size = 1) {
    this.workers = Array.from({ length: size }, () => {
      const w = new Worker(new URL('./mc-worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<WorkerResponse>) => this.handleMessage(e);
      return w;
    });
  }

  runMC(config: MCConfig): Promise<MCResult> {
    const id = crypto.randomUUID();
    return new Promise<MCResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const worker = this.workers[this.nextWorker % this.workers.length]!;
      this.nextWorker++;
      worker.postMessage({ type: 'RUN_MC', id, config });
    });
  }

  private handleMessage(e: MessageEvent<WorkerResponse>) {
    const msg = e.data;
    const task = this.pending.get(msg.id);
    if (!task) return;
    this.pending.delete(msg.id);

    if (msg.type === 'MC_RESULT') {
      task.resolve(msg.result);
    } else {
      task.reject(new Error(msg.error));
    }
  }

  terminate() {
    for (const w of this.workers) w.terminate();
    this.workers = [];
    for (const [, task] of this.pending) {
      task.reject(new Error('Worker pool terminated'));
    }
    this.pending.clear();
  }
}
