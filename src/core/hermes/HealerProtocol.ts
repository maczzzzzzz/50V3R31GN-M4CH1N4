/**
 * src/core/hermes/HealerProtocol.ts
 *
 * Phase 63.5 — Sovereign Healer Protocol
 *
 * Implements Layer 2 Re-planning and self-correction for the Trinity mesh.
 * Analyzes execution failures and suggests architectural shifts (e.g., Q5 → Q4)
 * or alternative routing to maintain mission continuity.
 */

import { OrchestratorState, OrchestratorConfig } from './LangGraphOrchestrator.js';

export enum RepairStrategy {
  RETRY_SAME_NODE = 'RETRY_SAME_NODE',
  SHIFT_QUANTIZATION = 'SHIFT_QUANTIZATION',
  BYPASS_NODE = 'BYPASS_NODE',
  ABORT_MISSION = 'ABORT_MISSION',
}

export interface Diagnosis {
  strategy: RepairStrategy;
  reason: string;
  suggestedState?: Partial<OrchestratorState>;
}

export class HealerProtocol {
  /**
   * Diagnose a node failure and provide a repair strategy.
   */
  static diagnose(state: OrchestratorState, cfg: OrchestratorConfig): Diagnosis {
    const error = state.error?.toLowerCase() ?? '';

    // Case 1: VRAM Pressure / OOM / Timeout on Node C (Oracle)
    if (state.activeNode === 'node-c' && (error.includes('timeout') || error.includes('oom') || error.includes('429'))) {
      if (state.retries === 0) {
        return {
          strategy: RepairStrategy.SHIFT_QUANTIZATION,
          reason: 'Node C latency/pressure detected. Suggesting down-scale to Q4.',
          suggestedState: { retries: 1, activeNode: 'node-c' },
        };
      }
    }

    // Case 2: Synapse (Node A) failure
    if (state.activeNode === 'node-a' && (error.includes('unreachable') || error.includes('502'))) {
      return {
        strategy: RepairStrategy.BYPASS_NODE,
        reason: 'Synapse Artery silent. Bypassing context-fetch and routing directly to Oracle.',
        suggestedState: { activeNode: 'node-c', retries: state.retries + 1 },
      };
    }

    // Default: Exponential backoff / Simple retry
    if (state.retries < cfg.maxRetries) {
      return {
        strategy: RepairStrategy.RETRY_SAME_NODE,
        reason: `Generic transient error: ${error}. Retrying execution.`,
        suggestedState: { retries: state.retries + 1 },
      };
    }

    return {
      strategy: RepairStrategy.ABORT_MISSION,
      reason: `Maximum retries (${cfg.maxRetries}) exceeded. Artery failure permanent.`,
    };
  }
}
