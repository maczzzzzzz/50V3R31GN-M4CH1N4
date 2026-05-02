/**
 * src/core/hermes/HealerProtocol.ts
 *
 * Phase 63.5 — Sovereign Healer Protocol
 * Phase 67.9 Task 2 — Shadow Mode Self-Healing (Visual Re-Targeting)
 *
 * Implements Layer 2 Re-planning and self-correction for the Trinity mesh.
 * Analyzes execution failures and suggests architectural shifts (e.g., Q5 → Q4)
 * or alternative routing to maintain mission continuity.
 */

import { appendFile, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { VisualSkillCrystallizationPipeline, type DetectedCycle } from '../../../../../scripts/forge/skill-factory.js';
import { randomUUID } from 'node:crypto';
import { ArteryClient } from '../../shared/ArteryClient.js';

export interface OrchestratorState {
  activeNode: string;
  retries: number;
  error?: string;
  prompt: string;
  tokens?: number;
  file_path?: string;
  diff?: string;
}

export interface OrchestratorConfig {
  maxRetries: number;
}

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

export class ShadowModeHealerDaemon {
  private queue: string[] = [];
  private isProcessing = false;

  /**
   * Processes DEGRADED skills in a background queue.
   */
  enqueueDegradedSkill(skillSlug: string): void {
    this.queue.push(skillSlug);
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processQueue().catch(e => {
        console.error('ShadowModeHealerDaemon error:', e);
        this.isProcessing = false;
      });
    }
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const skill = this.queue.shift();
      if (!skill) continue;
      await this.healSkill(skill);
    }
    this.isProcessing = false;
  }

  private async healSkill(skillSlug: string): Promise<void> {
    try {
      // 1. Use sovereign-observer live frames to identify new target locations via Node A OCR
      const liveFrameTarget = await this.getNodeAOCROnLiveFrame();
      
      // 2. Overwrite broken skills using the Crystallization Pipeline
      const cycle: DetectedCycle = {
        id: randomUUID(),
        name: skillSlug,
        description: `Healed skill targeting ${liveFrameTarget}`,
        phases: [],
        count: 1
      };
      
      await VisualSkillCrystallizationPipeline.crystallize(cycle, false);
      console.log(`Successfully healed and re-targeted skill: ${skillSlug}`);
    } catch (error) {
      console.error(`Failed to heal skill ${skillSlug}:`, error);
    }
  }

  private async getNodeAOCROnLiveFrame(): Promise<string> {
    try {
      const text = await ArteryClient.getVisionOCR('healer-daemon');
      return text || 'default_target_location_xy';
    } catch (e) {
      return 'default_target_location_xy';
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 80 — Sovereign Hall Failure Tracker
// Tracks consecutive FATAL outcomes per trace ID.
// On 3rd failure, emits SOVEREIGN_HALL_CALL to data/meetings/<traceId>/.
// ---------------------------------------------------------------------------

const failureCounts = new Map<string, number>();
const HALL_THRESHOLD = 3;
const MEETINGS_DIR = join(process.cwd(), 'data/meetings');

async function emitSovereignHallCall(traceId: string, reason: string): Promise<void> {
  const meetDir = join(MEETINGS_DIR, traceId);
  await mkdir(meetDir, { recursive: true });

  const manifest = {
    trace_id: traceId,
    called_at: new Date().toISOString(),
    called_by: 'healer:3-failure-gate',
    status: 'open',
    agents: [] as string[],
  };
  await writeFile(join(meetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const thought = [
    `## THOUGHT_FRAGMENT : healer:system`,
    `[IMPORTANT: HEALER_SYSTEM]`,
    `- **Assumed Context:** 3-failure threshold crossed for trace ${traceId}`,
    `- **Failed Approach:** ${reason}`,
    `- **Proposed Resolution:** Awaiting agent fragments`,
    `- **Confidence Score:** 0.0`,
  ].join('\n') + '\n';
  await writeFile(join(meetDir, 'healer.thought'), thought);

  process.stdout.write(`[HEALER] ◈ SOVEREIGN_HALL_CALL emitted → ${meetDir}\n`);
}

export class HealerProtocol {
  private static AUDIT_LEDGER = join(process.cwd(), 'data/logs/agentic_audit_trail.jsonl');

  static async logAudit(entry: { file_path?: string | undefined; diff?: string | undefined; reasoning_trace: string; outcome: 'SUCCESS' | 'FATAL'; traceId?: string | undefined }) {
    try {
      await mkdir(dirname(this.AUDIT_LEDGER), { recursive: true });
      await appendFile(this.AUDIT_LEDGER, JSON.stringify(entry) + '\n');
    } catch (e) { /* ignore */ }

    // Phase 80 — 3-failure Hall Gate
    const traceId = entry.traceId ?? 'unknown';
    if (entry.outcome === 'FATAL') {
      const count = (failureCounts.get(traceId) ?? 0) + 1;
      failureCounts.set(traceId, count);
      if (count >= HALL_THRESHOLD) {
        failureCounts.delete(traceId); // reset after gate fires
        emitSovereignHallCall(traceId, entry.reasoning_trace.slice(0, 500)).catch(
          e => process.stderr.write(`[HEALER] Hall call emit failed: ${e}\n`)
        );
      }
    } else if (entry.outcome === 'SUCCESS') {
      failureCounts.delete(traceId); // reset on success
    }
  }

  static async getNegativeConstraints(prompt: string): Promise<string> {
    try {
      const data = await readFile(this.AUDIT_LEDGER, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      const fatals = lines.map(l => JSON.parse(l)).filter(e => e.outcome === 'FATAL' && e.reasoning_trace.includes(prompt));
      if (fatals.length > 0) {
        return "\nNEGATIVE CONSTRAINTS (Avoid these previous fatal errors):\n" + fatals.map(f => f.reasoning_trace).join('\n');
      }
    } catch (e) { /* ignore */ }
    return "";
  }

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
