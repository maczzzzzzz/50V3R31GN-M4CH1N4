// tests/core/gm-approval-queue.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';

describe('GmApprovalQueue', () => {
  it('enqueues a change and resolves when response is handled', async () => {
    const mockFoundry = {
      queueApproval: vi.fn().mockResolvedValue(undefined),
    } as unknown as IFoundryAdapter;

    const queue = new GmApprovalQueue(mockFoundry);
    
    // We expect enqueue to return a promise that resolves when handleResponse is called
    const promise = queue.enqueue('item_addition', { name: 'Cyberdeck' });
    
    // Get the generated proposalId from the mock call
    expect(mockFoundry.queueApproval).toHaveBeenCalledOnce();
    const proposalId = (mockFoundry.queueApproval as any).mock.calls[0][0];
    
    // Simulate GM approval
    queue.handleResponse(proposalId, 'approved');
    
    const result = await promise;
    expect(result.status).toBe('approved');
    expect(queue.getPending()).toHaveLength(0);
  });

  it('rejects handleResponse for unknown proposalId', () => {
    const mockFoundry = {} as IFoundryAdapter;
    const queue = new GmApprovalQueue(mockFoundry);
    const success = queue.handleResponse('unknown', 'approved');
    expect(success).toBe(false);
  });
});
