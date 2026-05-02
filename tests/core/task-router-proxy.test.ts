import { describe, it, expect } from 'vitest';
import { TaskRouterProxy } from '../../packages/hermes-core/src/core/task-router-proxy.js';

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

  it('maintains sequential execution order when draining queue', async () => {
    const proxy = new TaskRouterProxy();
    proxy.lockNode('NodeA');
    
    const executionOrder: number[] = [];
    
    // Dispatch tasks while locked
    const task1 = proxy.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      await new Promise(r => setTimeout(r, 10)); // Simulate some work
      executionOrder.push(1);
    });

    const task2 = proxy.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      executionOrder.push(2);
    });

    // Unlock node, which starts processing task 1 asynchronously
    proxy.unlockNode('NodeA');
    
    // Immediately dispatch another task while the queue is draining task 1
    const task3 = proxy.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      executionOrder.push(3);
    });

    await Promise.all([task1, task2, task3]);
    
    expect(executionOrder).toEqual([1, 2, 3]);
  });
});
