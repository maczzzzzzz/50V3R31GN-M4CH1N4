import { describe, it, expect } from 'vitest';
import { TaskRouterProxy } from '../../src/core/task-router-proxy.js';

describe('TaskRouterProxy', () => {
  it('queues tasks when the destination node is locked', async () => {
    const proxy = new TaskRouterProxy();
    proxy.lockNode('NodeA');
    
    let resolved = false;
    const task = proxy.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      return 'success';
    }).then(() => { resolved = true; });

    // Yield to event loop
    await new Promise(r => setTimeout(r, 10));
    expect(resolved).toBe(false);

    proxy.unlockNode('NodeA');
    await task;
    expect(resolved).toBe(true);
  });
});
