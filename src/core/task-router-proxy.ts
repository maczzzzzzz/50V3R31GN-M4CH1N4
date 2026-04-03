export type HardwareNode = 'NodeA' | 'NodeB';
export type HardwareCost = 'LIGHT' | 'HEAVY';

export interface TaskConfig {
  destination: HardwareNode;
  cost: HardwareCost;
}

export class TaskRouterProxy {
  private locks: Set<HardwareNode> = new Set();
  private queues: Map<HardwareNode, Array<() => Promise<void>>> = new Map();

  constructor() {
    this.queues.set('NodeA', []);
    this.queues.set('NodeB', []);
  }

  lockNode(node: HardwareNode) {
    this.locks.add(node);
  }

  unlockNode(node: HardwareNode) {
    this.locks.delete(node);
    this.processQueue(node);
  }

  async dispatch<T>(config: TaskConfig, taskFn: () => Promise<T>): Promise<T> {
    if (!this.locks.has(config.destination)) {
      return taskFn();
    }

    return new Promise((resolve, reject) => {
      const queue = this.queues.get(config.destination)!;
      queue.push(async () => {
        try {
          resolve(await taskFn());
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async processQueue(node: HardwareNode) {
    const queue = this.queues.get(node)!;
    while (queue.length > 0 && !this.locks.has(node)) {
      const task = queue.shift();
      if (task) await task();
    }
  }
}
