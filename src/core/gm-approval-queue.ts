// src/core/gm-approval-queue.ts
import { randomUUID } from 'node:crypto';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'edited';

export interface ProposedChange {
  proposalId: string;
  type: string;
  data: any;
  status: ApprovalStatus;
  timestamp: Date;
  resolve: (value: { status: ApprovalStatus; editedData?: any }) => void;
}

export class GmApprovalQueue {
  private queue: Map<string, ProposedChange> = new Map();

  constructor(private foundry: IFoundryAdapter) {}

  /**
   * Enqueue a change and wait for GM approval via the Foundry bridge.
   */
  async enqueue(type: string, data: any, schema?: string): Promise<{ status: ApprovalStatus; editedData?: any }> {
    const proposalId = randomUUID().slice(0, 8); // Short ID for UI
    
    return new Promise((resolve) => {
      const proposal: ProposedChange = {
        proposalId,
        type,
        data,
        status: 'pending',
        timestamp: new Date(),
        resolve,
      };

      this.queue.set(proposalId, proposal);
      
      // Push to Foundry
      this.foundry.queueApproval(proposalId, type, data, schema).catch((err) => {
        console.error(`Failed to push approval request ${proposalId} to Foundry:`, err);
        // Fallback or error handling if needed
      });
    });
  }

  /**
   * Handle the response coming back from Foundry.
   */
  handleResponse(proposalId: string, status: ApprovalStatus, editedData?: any): boolean {
    const proposal = this.queue.get(proposalId);
    if (!proposal) return false;

    proposal.status = status;
    proposal.resolve({ status, editedData });
    this.queue.delete(proposalId);
    return true;
  }

  getPending(): Omit<ProposedChange, 'resolve'>[] {
    return Array.from(this.queue.values()).map(({ resolve, ...rest }) => rest);
  }
}
