/**
 * src/core/vesper-service.ts
 *
 * V35P3R-5H4D0W-M0D3 — Phase 30 Task 2
 *
 * Persistent, low-risk background loop for autonomous reconnaissance.
 * Operates the "Quiet Machine" that performs non-invasive tasks
 * while the GM is idle.
 */

import { SharedMemoryService } from './shared-memory-service.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { VisualMonitorService } from './visual-monitor-service.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { ILogger } from '../db/interfaces.js';
import { randomUUID } from 'node:crypto';

export enum RiskLevel {
  LOW = 'LOW',       // Passive observation, read-only
  MEDIUM = 'MEDIUM', // Minor state updates, internal lore commits
  HIGH = 'HIGH',     // Materialization, user-visible changes, destructive acts
}

export interface VesperAction {
  id: string;
  name: string;
  risk: RiskLevel;
  execute: () => Promise<void>;
}

export class VesperService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly loopIntervalMs: number = 60_000; // 1 minute recon cycle

  constructor(
    private readonly foundry: IFoundryAdapter,
    private readonly neuralUplink: VisualMonitorService,
    private readonly oracle: UnifiedOracleClient,
    private readonly sharedMemory: SharedMemoryService,
    private readonly logger?: ILogger,
  ) {}

  /**
   * Start the Vesper Shadow Mode background loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const traceId = randomUUID();
    this.logger?.info('Vesper', traceId, '🌘 VESPER: Shadow Mode ACTIVE. Commencing autonomous reconnaissance.');
    
    // Initial run
    this.runCycle().catch(err => this.logger?.error('Vesper', traceId, '[Vesper] Initial cycle failed', { error: (err as Error).message }));
    
    this.intervalId = setInterval(() => {
      const cycleTraceId = randomUUID();
      this.runCycle().catch(err => this.logger?.error('Vesper', cycleTraceId, '[Vesper] Cycle failed', { error: (err as Error).message }));
    }, this.loopIntervalMs);
  }

  /**
   * Stop the Vesper background loop.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.logger?.info('Vesper', 'stop', '🌒 VESPER: Shadow Mode DEACTIVATED.');
  }

  /**
   * A single reconnaissance cycle.
   */
  private async runCycle(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.debug('Vesper', traceId, '🌘 VESPER: Pulse...');

    // 1. Harvest Intents
    const actions = await this.harvestIntents();

    // 2. Classify and Execute
    for (const action of actions) {
      if (action.risk === RiskLevel.LOW) {
        // Low risk: Execute immediately
        this.logger?.info('Vesper', traceId, `Executing LOW risk action: ${action.name}`);
        await action.execute().catch(err => this.logger?.error('Vesper', traceId, `Action ${action.name} failed`, { error: (err as Error).message }));
      } else {
        // Medium/High risk: Must route through Flush Gate (Shared Memory Proposal)
        this.logger?.info('Vesper', traceId, `Proposing ${action.risk} risk action: ${action.name}`);
        await this.proposeThroughFlushGate(action);
      }
    }
  }

  /**
   * Identify potential autonomous tasks based on current environment.
   */
  private async harvestIntents(): Promise<VesperAction[]> {
    const actions: VesperAction[] = [];

    // Action A: Scene Reground (LOW)
    // Periodically refresh the machine's perception of the current scene.
    actions.push({
      id: 'reground_perception',
      name: 'Scene Perception Reground',
      risk: RiskLevel.LOW,
      execute: async () => {
        if (this.foundry.isConnected() && this.neuralUplink.isConnected()) {
          // Trigger reground on the neural uplink.
          await this.neuralUplink.regroundScene('');
        }
      }
    });

    // Action B: Ambient Lore Extraction (MEDIUM)
    // Extract lore from visual assets if we find un-audited items.
    // Classified as MEDIUM because it commits to the Oracle DB.
    actions.push({
      id: 'ambient_audit',
      name: 'Ambient Lore Audit',
      risk: RiskLevel.MEDIUM,
      execute: async () => {
        // Logic to trigger global audit or specific asset extraction
        this.logger?.info('Vesper', 'ambient_audit', '[Flush Gate Approved] Committing lore seeds to Oracle...');
      }
    });

    return actions;
  }

  /**
   * Route an action through the physical Flush Gate (crush CLI/Go Proxy).
   */
  private async proposeThroughFlushGate(action: VesperAction): Promise<void> {
    const proposalId = Math.floor(Math.random() * 1000000) + 1;
    const traceId = randomUUID();
    
    try {
      this.sharedMemory.writeProposal(
        proposalId,
        2, // Origin = Vesper
        action.risk === RiskLevel.HIGH ? 2 : 1, // ActionType mapping
        action.name
      );

      this.logger?.info('Vesper', traceId, `🕒 VESPER: Proposal ${proposalId} pending GM approval via Flush Gate.`);

      // Background poll for this specific proposal
      const pollStart = Date.now();
      const pollTimeout = 5 * 60_000; // 5 minute timeout for background tasks

      const interval = setInterval(() => {
        try {
          const { id, status } = this.sharedMemory.checkProposalStatus();
          
          if (id === proposalId) {
            if (status === 1) { // Approved
              clearInterval(interval);
              this.logger?.info('Vesper', traceId, `✅ VESPER: Proposal ${proposalId} APPROVED. Executing...`);
              action.execute().catch(err => this.logger?.error('Vesper', traceId, `Action ${action.name} failed after approval`, { error: (err as Error).message }));
            } else if (status === 2) { // Rejected
              clearInterval(interval);
              this.logger?.warn('Vesper', traceId, `❌ VESPER: Proposal ${proposalId} REJECTED by GM.`);
            }
          }

          if (Date.now() - pollStart > pollTimeout) {
            clearInterval(interval);
            this.logger?.warn('Vesper', traceId, `🕒 VESPER: Proposal ${proposalId} timed out waiting for GM.`);
          }
        } catch (err) {
          this.logger?.error('Vesper', traceId, 'Polling error', { error: (err as Error).message });
          clearInterval(interval);
        }
      }, 1000);

    } catch (err) {
      this.logger?.error('Vesper', traceId, 'Failed to write proposal to Flush Gate', { error: (err as Error).message });
    }
  }
}
