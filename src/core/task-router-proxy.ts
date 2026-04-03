export type HardwareNode = 'NodeA' | 'NodeB';
export type HardwareCost = 'LIGHT' | 'HEAVY';

export interface TaskConfig {
  destination: HardwareNode;
  cost: HardwareCost;
}

export class TaskRouterProxy {
  private locks: Set<HardwareNode> = new Set();
  private queues: Map<HardwareNode, Array<() => Promise<void>>> = new Map();
  private processing: Set<HardwareNode> = new Set();

  constructor() {
    this.queues.set('NodeA', []);
    this.queues.set('NodeB', []);
  }

  lockNode(node: HardwareNode) {
    this.locks.add(node);
  }

  unlockNode(node: HardwareNode) {
    this.locks.delete(node);
    this.processQueue(node).catch(console.error); // Handle potential errors gracefully
  }

  async dispatch<T>(config: TaskConfig, taskFn: () => Promise<T>): Promise<T> {
    const isLocked = this.locks.has(config.destination);
    const isProcessing = this.processing.has(config.destination);
    const queue = this.queues.get(config.destination)!;

    // Fast path: node is available and no pending queue
    if (!isLocked && !isProcessing && queue.length === 0) {
      return taskFn();
    }

    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await taskFn());
        } catch (err) {
          reject(err);
        }
      });

      // If node is available but wasn't processing (e.g., if it just got unlocked
      // and processQueue didn't catch this new task yet), trigger it.
      if (!this.locks.has(config.destination) && !this.processing.has(config.destination)) {
        this.processQueue(config.destination).catch(console.error);
      }
    });
  }

  private async processQueue(node: HardwareNode) {
    if (this.processing.has(node)) return;
    this.processing.add(node);

    try {
      const queue = this.queues.get(node)!;
      while (queue.length > 0 && !this.locks.has(node)) {
        const task = queue.shift();
        if (task) await task();
      }
    } finally {
      this.processing.delete(node);
    }
  }
}
